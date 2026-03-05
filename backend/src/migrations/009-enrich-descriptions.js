import Milestone from '../models/Milestone.js';
import AgeActivity from '../models/AgeActivity.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function up() {
  // Update milestone descriptions from enriched data file
  const milestonePath = join(__dirname, 'data', 'milestones.json');
  const milestones = JSON.parse(readFileSync(milestonePath, 'utf-8'));

  let milestoneUpdated = 0;
  for (const m of milestones) {
    const result = await Milestone.updateMany(
      { title: m.title, isActive: true },
      { $set: { description: m.description, typicalMonths: m.typicalMonths } }
    );
    milestoneUpdated += result.modifiedCount;
  }
  console.log(`Updated ${milestoneUpdated} milestone descriptions with enriched content.`);

  // Update activity descriptions from enriched data file
  const activityPath = join(__dirname, 'data', 'activities.json');
  const activities = JSON.parse(readFileSync(activityPath, 'utf-8'));

  let activityUpdated = 0;
  for (const a of activities) {
    const result = await AgeActivity.updateMany(
      { name: a.name, isActive: true },
      { $set: { description: a.description } }
    );
    activityUpdated += result.modifiedCount;
  }
  console.log(`Updated ${activityUpdated} activity descriptions with enriched content.`);
}
