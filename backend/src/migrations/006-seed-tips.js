import Tip from '../models/Tip.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function up() {
  const existing = await Tip.countDocuments();
  if (existing >= 500) {
    console.log(`Tip collection already has ${existing} documents, skipping.`);
    return;
  }

  const dataPath = join(__dirname, 'data', 'tips.json');
  const tips = JSON.parse(readFileSync(dataPath, 'utf-8'));

  const docs = tips.map((t) => ({
    ...t,
    isActive: true,
  }));

  await Tip.insertMany(docs);
  console.log(`Seeded ${docs.length} tips.`);
}
