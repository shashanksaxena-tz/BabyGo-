import Recipe from '../models/Recipe.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function up() {
  const existing = await Recipe.countDocuments({ isSeeded: true });
  if (existing >= 500) {
    console.log(`Recipe collection already has ${existing} seeded documents, skipping.`);
    return;
  }

  const dataPath = join(__dirname, 'data', 'recipes.json');
  const recipes = JSON.parse(readFileSync(dataPath, 'utf-8'));

  const docs = recipes.map((r) => ({
    ...r,
    isSeeded: true,
    isActive: true,
  }));

  await Recipe.insertMany(docs);
  console.log(`Seeded ${docs.length} recipes.`);
}
