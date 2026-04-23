import { Client as MinioClient } from 'minio';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * Bucket name constants for the three storage categories.
 */
export const BUCKETS = {
  PROFILES: process.env.MINIO_BUCKET_PROFILES || 'profile-photos',
  STORIES: process.env.MINIO_BUCKET_STORIES || 'story-illustrations',
  REPORTS: process.env.MINIO_BUCKET_REPORTS || 'report-pdfs',
};

/**
 * StorageService - MinIO-based binary asset storage.
 *
 * Manages profile photos, story illustrations, and report PDFs.
 * Follows the singleton service pattern used by other backend services.
 */
class StorageService {
  constructor() {
    this.client = null;
    this.initialized = false;
    /** @type {string|null} Base URL for browser-facing/public URLs */
    this.publicBaseUrl = null;
  }

  /**
   * Initialize the MinIO client and ensure all required buckets exist.
   * Should be called once during server startup.
   */
  async initialize() {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = parseInt(process.env.MINIO_PORT || '9000', 10);
    const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
    const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
    const useSSL = process.env.MINIO_USE_SSL === 'true';

    this.client = new MinioClient({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });

    // Determine the public base URL for browser-facing responses.
    // MINIO_PUBLIC_URL should be the externally reachable URL (e.g. http://localhost:9000).
    // Falls back to constructing from endpoint:port (works for local dev without Docker).
    const protocol = useSSL ? 'https' : 'http';
    this.publicBaseUrl = process.env.MINIO_PUBLIC_URL
      || `${protocol}://${endpoint}:${port}`;
    // Strip trailing slash if present
    this.publicBaseUrl = this.publicBaseUrl.replace(/\/+$/, '');

    // Create buckets if they don't exist and set public read policy
    const buckets = [BUCKETS.PROFILES, BUCKETS.STORIES, BUCKETS.REPORTS];
    for (const bucket of buckets) {
      await this._ensureBucket(bucket);
    }

    this.initialized = true;
    console.log(`Connected to MinIO at ${endpoint}:${port}`);
    console.log(`Public MinIO URL: ${this.publicBaseUrl}`);
    console.log(`Buckets ready: ${buckets.join(', ')}`);
  }

  /**
   * Create a bucket if it doesn't exist and apply a public read policy.
   * @param {string} bucket - Bucket name
   */
  async _ensureBucket(bucket) {
    const exists = await this.client.bucketExists(bucket);
    if (!exists) {
      await this.client.makeBucket(bucket);
      console.log(`Created bucket: ${bucket}`);
    }

    // Set public read policy so objects can be accessed via URL
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };
    await this.client.setBucketPolicy(bucket, JSON.stringify(policy));
  }

  /**
   * Generate a unique object name preserving the original file extension.
   * @param {string} originalName - Original filename (e.g. "photo.jpg")
   * @returns {string} Unique object name (e.g. "a1b2c3d4-e5f6-...jpg")
   */
  _generateObjectName(originalName) {
    const ext = path.extname(originalName || '').toLowerCase();
    return `${uuidv4()}${ext}`;
  }

  /**
   * Upload a buffer (in-memory data) to a bucket.
   * @param {string} bucket - Target bucket name (use BUCKETS constant)
   * @param {Buffer} buffer - File data
   * @param {string} mimeType - MIME type (e.g. "image/jpeg")
   * @param {string} originalName - Original filename for extension detection
   * @returns {Promise<{objectName: string, url: string}>}
   */
  async uploadBuffer(bucket, buffer, mimeType, originalName) {
    this._assertInitialized();

    const objectName = this._generateObjectName(originalName);
    const metaData = { 'Content-Type': mimeType };

    await this.client.putObject(bucket, objectName, buffer, buffer.length, metaData);

    return {
      objectName,
      url: this.getPublicUrl(bucket, objectName),
    };
  }

  /**
   * Upload a file from the local filesystem to a bucket.
   * @param {string} bucket - Target bucket name (use BUCKETS constant)
   * @param {string} filePath - Absolute path to the file on disk
   * @param {string} mimeType - MIME type (e.g. "application/pdf")
   * @returns {Promise<{objectName: string, url: string}>}
   */
  async uploadFile(bucket, filePath, mimeType) {
    this._assertInitialized();

    const originalName = path.basename(filePath);
    const objectName = this._generateObjectName(originalName);
    const metaData = { 'Content-Type': mimeType };

    await this.client.fPutObject(bucket, objectName, filePath, metaData);

    return {
      objectName,
      url: this.getPublicUrl(bucket, objectName),
    };
  }

  /**
   * Build the public URL for an object. Uses MINIO_PUBLIC_URL so that
   * browser-facing responses point to the externally reachable host
   * (not the Docker-internal hostname).
   * @param {string} bucket - Bucket name
   * @param {string} objectName - Object key
   * @returns {string} Public URL
   */
  getPublicUrl(bucket, objectName) {
    // After initialize(), publicBaseUrl is always set.
    // Before initialize() (shouldn't happen), fall back safely.
    const base = this.publicBaseUrl || (() => {
      const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
      const publicUrl = process.env.MINIO_PUBLIC_URL;
      if (publicUrl) return publicUrl.replace(/\/+$/, '');
      const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
      const port = process.env.MINIO_PORT || '9000';
      return `${protocol}://${endpoint}:${port}`;
    })();
    return `${base}/${bucket}/${objectName}`;
  }

  /**
   * Delete an object from a bucket.
   * @param {string} bucket - Bucket name
   * @param {string} objectName - Object key to delete
   * @returns {Promise<void>}
   */
  async deleteObject(bucket, objectName) {
    this._assertInitialized();
    await this.client.removeObject(bucket, objectName);
  }

  /**
   * Generate a presigned URL for temporary access to a private object.
   * The MinIO client generates the URL using the internal endpoint, so we
   * rewrite the origin to the public URL for browser accessibility.
   * @param {string} bucket - Bucket name
   * @param {string} objectName - Object key
   * @param {number} [expiry=3600] - Expiry time in seconds (default 1 hour)
   * @returns {Promise<string>} Presigned URL (publicly accessible)
   */
  async getPresignedUrl(bucket, objectName, expiry = 3600) {
    this._assertInitialized();
    const internalUrl = await this.client.presignedGetObject(bucket, objectName, expiry);

    // Replace the internal Docker hostname with the public URL.
    // The MinIO client builds URLs like http://minio:9000/bucket/obj?X-Amz-...
    // We need http://localhost:9000/bucket/obj?X-Amz-...
    if (this.publicBaseUrl) {
      const parsed = new URL(internalUrl);
      const publicParsed = new URL(this.publicBaseUrl);
      parsed.protocol = publicParsed.protocol;
      parsed.hostname = publicParsed.hostname;
      parsed.port = publicParsed.port;
      return parsed.toString();
    }

    return internalUrl;
  }

  /**
   * Download an object from MinIO and return it as a Buffer.
   * @param {string} bucket - Bucket name
   * @param {string} objectName - Object key
   * @returns {Promise<Buffer>}
   */
  async getObjectBuffer(bucket, objectName) {
    this._assertInitialized();
    const stream = await this.client.getObject(bucket, objectName);
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Parse a MinIO public URL into its bucket and objectName components.
   * Handles URLs like: http://localhost:9000/profile-photos/abc-123.jpg
   * @param {string} url - Full MinIO URL
   * @returns {{ bucket: string, objectName: string } | null}
   */
  parseMinioUrl(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      // Path is like /bucket-name/object-name.ext
      const parts = parsed.pathname.replace(/^\//, '').split('/');
      if (parts.length < 2) return null;
      const bucket = parts[0];
      const objectName = parts.slice(1).join('/');
      return { bucket, objectName };
    } catch {
      return null;
    }
  }

  /**
   * Ensure the service has been initialized before performing operations.
   * @throws {Error} If initialize() has not been called
   */
  _assertInitialized() {
    if (!this.initialized || !this.client) {
      throw new Error('StorageService not initialized. Call initialize() first.');
    }
  }
}

// Singleton instance
const storageService = new StorageService();
export default storageService;
