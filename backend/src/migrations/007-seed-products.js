import Product from '../models/Product.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function up() {
  const existing = await Product.countDocuments();
  if (existing >= 500) {
    console.log(`Product collection already has ${existing} documents, skipping.`);
    return;
  }

  const dataPath = join(__dirname, 'data', 'products.json');
  const products = JSON.parse(readFileSync(dataPath, 'utf-8'));

  const docs = products.map((p) => ({
    ...p,
    isActive: true,
  }));

  await Product.insertMany(docs);
  console.log(`Seeded ${docs.length} products.`);
}
