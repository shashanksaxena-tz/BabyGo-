import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Migration from '../models/Migration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

export async function runMigrations() {
  console.log('🔄 Running database migrations...');

  // Ensure migrations directory exists
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    console.log('  No migrations directory found, created it.');
    return;
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.js'))
    .sort();

  if (files.length === 0) {
    console.log('  No migration files found.');
    return;
  }

  const applied = await Migration.find({}).lean();
  const appliedNames = new Set(applied.map(m => m.name));

  let ranCount = 0;
  for (const file of files) {
    const migrationName = file.replace('.js', '');

    if (appliedNames.has(migrationName)) {
      continue; // Already applied
    }

    try {
      console.log(`  ⏳ Running migration: ${migrationName}`);
      const migrationModule = await import(path.join(MIGRATIONS_DIR, file));
      await migrationModule.up();

      await Migration.create({ name: migrationName });
      console.log(`  ✅ Migration applied: ${migrationName}`);
      ranCount++;
    } catch (error) {
      console.error(`  ❌ Migration failed: ${migrationName}`, error.message);
      // Don't crash - log and continue
    }
  }

  if (ranCount === 0) {
    console.log('  All migrations are up to date.');
  } else {
    console.log(`  📦 Applied ${ranCount} migration(s).`);
  }
}
