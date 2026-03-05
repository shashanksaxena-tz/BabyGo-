import AgeActivity from '../models/AgeActivity.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function up() {
  const existing = await AgeActivity.countDocuments();
  if (existing >= 500) {
    console.log(`AgeActivity collection already has ${existing} documents, skipping.`);
    return;
  }

  const dataPath = join(__dirname, 'data', 'activities.json');
  const activities = JSON.parse(readFileSync(dataPath, 'utf-8'));

  const docs = activities.map((a) => ({
    ...a,
    relatedMilestoneUuids: a.relatedMilestoneUuids || [],
    isActive: true,
  }));

  await AgeActivity.insertMany(docs);
  console.log(`Seeded ${docs.length} activities.`);
}
