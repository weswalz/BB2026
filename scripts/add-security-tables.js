#!/usr/bin/env node
/**
 * Add security tables to BiYu Boxing database
 * - login_attempts: Persistent lockout tracking
 * - audit_log: Track all content changes
 * - rate_limits: IP-based rate limiting
 * - sessions: Persistent session storage
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../database/biyuboxing.db');

console.log('📦 Adding security tables to database...');

const db = new Database(dbPath);

try {
  // Create login_attempts table for persistent lockout tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      username TEXT PRIMARY KEY,
      attempt_count INTEGER DEFAULT 0,
      locked_until INTEGER,
      last_attempt INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
  console.log('✅ Created login_attempts table');

  // Create audit_log table for tracking all changes
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      timestamp INTEGER DEFAULT (strftime('%s', 'now')),
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      changes TEXT,
      ip_address TEXT,
      user_agent TEXT
    )
  `);
  console.log('✅ Created audit_log table');

  // Create index on audit_log for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_username ON audit_log(username);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
  `);
  console.log('✅ Created audit_log indexes');

  // Create rate_limits table for IP-based throttling
  db.exec(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      ip_address TEXT,
      endpoint TEXT,
      request_count INTEGER DEFAULT 0,
      window_start INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      PRIMARY KEY (ip_address, endpoint)
    )
  `);
  console.log('✅ Created rate_limits table');

  // Create sessions table for persistent session storage
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      last_activity INTEGER DEFAULT (strftime('%s', 'now')),
      ip_address TEXT,
      user_agent TEXT,
      csrf_token TEXT NOT NULL
    )
  `);
  console.log('✅ Created sessions table');

  // Create index on sessions for cleanup queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);
  `);
  console.log('✅ Created sessions indexes');

  console.log('');
  console.log('🎉 All security tables created successfully!');
  console.log('');
  console.log('Tables added:');
  console.log('  - login_attempts (persistent lockout tracking)');
  console.log('  - audit_log (change tracking)');
  console.log('  - rate_limits (IP throttling)');
  console.log('  - sessions (persistent sessions with CSRF)');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
