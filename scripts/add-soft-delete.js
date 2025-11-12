#!/usr/bin/env node

/**
 * Migration Script: Add Soft Delete Support
 * Adds deleted_at and deleted_by columns to tables
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../database/biyuboxing.db');

console.log('🔧 Starting soft delete migration...');
console.log(`📁 Database: ${DB_PATH}`);

const db = new Database(DB_PATH);

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  // Add deleted_at and deleted_by columns to tables
  const tables = ['events', 'fighters', 'news', 'media'];

  for (const table of tables) {
    console.log(`\n📊 Migrating table: ${table}`);

    // Check if columns already exist
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    const hasDeletedAt = columns.some(col => col.name === 'deleted_at');
    const hasDeletedBy = columns.some(col => col.name === 'deleted_by');

    if (!hasDeletedAt) {
      console.log(`  ➕ Adding deleted_at column to ${table}`);
      db.exec(`ALTER TABLE ${table} ADD COLUMN deleted_at TEXT DEFAULT NULL`);
    } else {
      console.log(`  ✓ deleted_at column already exists in ${table}`);
    }

    if (!hasDeletedBy) {
      console.log(`  ➕ Adding deleted_by column to ${table}`);
      db.exec(`ALTER TABLE ${table} ADD COLUMN deleted_by TEXT DEFAULT NULL`);
    } else {
      console.log(`  ✓ deleted_by column already exists in ${table}`);
    }
  }

  // Commit transaction
  db.exec('COMMIT');

  console.log('\n✅ Migration completed successfully!');
  console.log('\nSoft delete columns added to:');
  tables.forEach(table => console.log(`  - ${table}`));

} catch (error) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
