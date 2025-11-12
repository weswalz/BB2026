// src/lib/globals.js
import { connectToDatabase } from './database.js';

/**
 * Get a single global setting by key
 * @param {string} key - Setting key
 * @returns {Object|null} - Setting object or null
 */
export function getGlobal(key) {
  const db = connectToDatabase();
  try {
    const stmt = db.prepare('SELECT * FROM globals WHERE key = ?');
    const setting = stmt.get(key);
    return setting || null;
  } catch (error) {
    console.error(`❌ Error fetching global setting ${key}:`, error.message);
    return null;
  }
}

/**
 * Get all global settings
 * @returns {Array} - Array of all settings
 */
export function getAllGlobals() {
  const db = connectToDatabase();
  try {
    const stmt = db.prepare('SELECT * FROM globals ORDER BY key');
    const settings = stmt.all();
    console.log(`✅ Retrieved ${settings.length} global settings`);
    return settings;
  } catch (error) {
    console.error('❌ Error fetching global settings:', error.message);
    return [];
  }
}

/**
 * Get all globals as a key-value object
 * @returns {Object} - Object with key-value pairs
 */
export function getGlobalsObject() {
  const settings = getAllGlobals();
  const obj = {};
  for (const setting of settings) {
    // Convert boolean strings to actual booleans
    if (setting.type === 'boolean') {
      obj[setting.key] = setting.value === '1' || setting.value === 'true';
    } else {
      obj[setting.key] = setting.value;
    }
  }
  return obj;
}

/**
 * Update a global setting
 * @param {string} key - Setting key
 * @param {string} value - New value
 * @returns {boolean} - Success status
 */
export function updateGlobal(key, value) {
  const db = connectToDatabase();
  const now = new Date().toISOString();

  try {
    // Check if setting exists
    const existing = getGlobal(key);

    if (existing) {
      // Update existing
      const stmt = db.prepare('UPDATE globals SET value = ?, updatedAt = ? WHERE key = ?');
      stmt.run(value, now, key);
      console.log(`✅ Updated global setting: ${key}`);
      return true;
    } else {
      // Create new
      const stmt = db.prepare(
        'INSERT INTO globals (key, value, type, label, updatedAt) VALUES (?, ?, ?, ?, ?)'
      );
      stmt.run(key, value, 'text', key, now);
      console.log(`✅ Created global setting: ${key}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error updating global setting ${key}:`, error.message);
    return false;
  }
}

/**
 * Update multiple globals at once
 * @param {Object} settings - Object with key-value pairs to update
 * @returns {boolean} - Success status
 */
export function updateGlobals(settings) {
  const db = connectToDatabase();
  const now = new Date().toISOString();

  try {
    const transaction = db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        const existing = getGlobal(key);
        if (existing) {
          const stmt = db.prepare('UPDATE globals SET value = ?, updatedAt = ? WHERE key = ?');
          stmt.run(value, now, key);
        }
      }
    });

    transaction();
    console.log(`✅ Updated ${Object.keys(settings).length} global settings`);
    return true;
  } catch (error) {
    console.error('❌ Error updating global settings:', error.message);
    return false;
  }
}

/**
 * Delete a global setting
 * @param {string} key - Setting key to delete
 * @returns {boolean} - Success status
 */
export function deleteGlobal(key) {
  const db = connectToDatabase();
  try {
    const stmt = db.prepare('DELETE FROM globals WHERE key = ?');
    const result = stmt.run(key);
    if (result.changes > 0) {
      console.log(`✅ Deleted global setting: ${key}`);
      return true;
    }
    console.log(`⚠️ Global setting not found: ${key}`);
    return false;
  } catch (error) {
    console.error(`❌ Error deleting global setting ${key}:`, error.message);
    return false;
  }
}

/**
 * Legacy function for compatibility
 */
export function getSiteSettings() {
  return getGlobalsObject();
}

/**
 * Legacy function for compatibility
 */
export function getGlobalSettings() {
  return getGlobalsObject();
}
