import Milestone from '../models/Milestone.js';
import Child from '../models/Child.js';

export async function up() {
  // Fetch all milestones and build a legacyId → uuid lookup map
  const milestones = await Milestone.find({}).lean();

  if (milestones.length === 0) {
    console.log('    No milestones found in database, skipping migration.');
    return;
  }

  const legacyToUuid = new Map();
  for (const m of milestones) {
    if (m.legacyId) {
      legacyToUuid.set(m.legacyId, m.uuid);
    }
  }

  if (legacyToUuid.size === 0) {
    console.log('    No milestones with legacyId found, skipping migration.');
    return;
  }

  console.log(`    Built lookup map with ${legacyToUuid.size} legacy → uuid mappings.`);

  // Find all children that have achieved or watched milestones
  const children = await Child.find({
    $or: [
      { 'achievedMilestones.0': { $exists: true } },
      { 'watchedMilestones.0': { $exists: true } },
    ],
  }).lean();

  if (children.length === 0) {
    console.log('    No children with milestones found, skipping migration.');
    return;
  }

  const bulkOps = [];

  for (const child of children) {
    let changed = false;

    const updatedAchieved = (child.achievedMilestones || []).map((am) => {
      if (legacyToUuid.has(am.milestoneId)) {
        changed = true;
        return { ...am, milestoneId: legacyToUuid.get(am.milestoneId) };
      }
      return am;
    });

    const updatedWatched = (child.watchedMilestones || []).map((wm) => {
      if (legacyToUuid.has(wm.milestoneId)) {
        changed = true;
        return { ...wm, milestoneId: legacyToUuid.get(wm.milestoneId) };
      }
      return wm;
    });

    if (changed) {
      bulkOps.push({
        updateOne: {
          filter: { _id: child._id },
          update: {
            $set: {
              achievedMilestones: updatedAchieved,
              watchedMilestones: updatedWatched,
            },
          },
        },
      });
    }
  }

  if (bulkOps.length === 0) {
    console.log('    No children needed milestone ID migration.');
    return;
  }

  const result = await Child.bulkWrite(bulkOps);
  console.log(`    Migrated milestone IDs for ${result.modifiedCount} children.`);
}
