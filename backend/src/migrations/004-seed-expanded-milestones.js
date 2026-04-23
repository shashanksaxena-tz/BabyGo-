import Milestone from '../models/Milestone.js';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function up() {
  // Skip if we already have a large milestone set (002 + 004 already ran)
  const existing = await Milestone.countDocuments();
  if (existing >= 500) {
    console.log(`Milestone collection already has ${existing} documents, skipping expanded seed.`);
    return;
  }

  // Load generated milestones
  const dataPath = join(__dirname, 'data', 'milestones.json');
  const milestones = JSON.parse(readFileSync(dataPath, 'utf-8'));

  // Get existing titles to avoid duplicates with 002-seed-milestones
  const existingTitles = new Set(
    (await Milestone.find({}, { title: 1 }).lean()).map((m) => m.title)
  );

  const toInsert = milestones
    .filter((m) => !existingTitles.has(m.title))
    .map((m) => ({
      uuid: uuidv4(),
      title: m.title,
      description: m.description,
      domain: m.domain,
      subDomain: m.subDomain || 'general',
      ageRangeStartMonths: m.ageRangeStartMonths,
      ageRangeEndMonths: m.ageRangeEndMonths,
      typicalMonths: m.typicalMonths,
      source: m.source || 'WHO',
      tags: m.tags || [],
      isActive: true,
    }));

  if (toInsert.length > 0) {
    await Milestone.insertMany(toInsert);
    console.log(`Seeded ${toInsert.length} expanded milestones (skipped ${milestones.length - toInsert.length} duplicates).`);
  } else {
    console.log('No new milestones to seed.');
  }
}
