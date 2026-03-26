import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  if (globalThis.__MONGO_CONTAINER__) {
    await globalThis.__MONGO_CONTAINER__.stop();
  }

  // Clean up temp file
  const tmpFile = path.join(process.cwd(), 'tests/.mongo-uri');
  if (fs.existsSync(tmpFile)) {
    fs.unlinkSync(tmpFile);
  }
}
