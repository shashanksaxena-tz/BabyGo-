import { MongoDBContainer } from '@testcontainers/mongodb';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  const mongoContainer = await new MongoDBContainer('mongo:7').start();
  const mongoUri = mongoContainer.getConnectionString() + '?directConnection=true';

  // Store container reference for teardown
  globalThis.__MONGO_CONTAINER__ = mongoContainer;

  // Write URI to temp file so integrationBase.js (different process) can read it
  const tmpFile = path.join(process.cwd(), 'tests/.mongo-uri');
  fs.writeFileSync(tmpFile, mongoUri);

  // Also set env vars for any code that reads them directly in the same process
  process.env.MONGODB_URI = mongoUri;
  process.env.JWT_SECRET = 'test-jwt-secret-for-integration';
  process.env.NODE_ENV = 'test';
}
