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

    // Create buckets if they don't exist and set public read policy
    const buckets = [BUCKETS.PROFILES, BUCKETS.STORIES, BUCKETS.REPORTS];
    for (const bucket of buckets) {
      await this._ensureBucket(bucket);
    }

    this.initialized = true;
    console.log(`Connected to MinIO at ${endpoint}:${port}`);
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
   * Build the public URL for an object. This assumes the bucket has a
   * public read policy (set during initialization).
   * @param {string} bucket - Bucket name
   * @param {string} objectName - Object key
   * @returns {string} Public URL
   */
  getPublicUrl(bucket, objectName) {
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = parseInt(process.env.MINIO_PORT || '9000', 10);
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    return `${protocol}://${endpoint}:${port}/${bucket}/${objectName}`;
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
   * @param {string} bucket - Bucket name
   * @param {string} objectName - Object key
   * @param {number} [expiry=3600] - Expiry time in seconds (default 1 hour)
   * @returns {Promise<string>} Presigned URL
   */
  async getPresignedUrl(bucket, objectName, expiry = 3600) {
    this._assertInitialized();
    return this.client.presignedGetObject(bucket, objectName, expiry);
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
