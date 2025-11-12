import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(process.cwd(), 'database', 'biyuboxing.db');

console.log('🔧 Adding detailedDescription column to events table...');

try {
  const db = new Database(DB_PATH);

  // Check if column already exists
  const tableInfo = db.prepare("PRAGMA table_info(events)").all();
  const hasDetailedDescription = tableInfo.some(col => col.name === 'detailedDescription');

  if (hasDetailedDescription) {
    console.log('✅ detailedDescription column already exists');
  } else {
    // Add the new column
    db.prepare('ALTER TABLE events ADD COLUMN detailedDescription TEXT').run();
    console.log('✅ Added detailedDescription column to events table');
  }

  db.close();
  console.log('✅ Migration complete');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
