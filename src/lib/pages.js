import { connectToDatabase } from './database.js';
import { randomUUID } from 'crypto';

// Pages management for SQLite version

export function getPage(id) {
  const db = connectToDatabase();
  try {
    const stmt = db.prepare('SELECT * FROM pages WHERE id = ?');
    const page = stmt.get(id);
    if (!page) {
      console.log(`⚠️ Page not found: ${id}`);
      return null;
    }
    // Parse JSON content and assign to fields
    try {
      if (page.content) {
        page.fields = JSON.parse(page.content);
      } else {
        page.fields = {};
      }
    } catch (jsonError) {
      console.error(`❌ Error parsing JSON for page ${id}:`, jsonError.message);
      page.fields = {};
    }
    return page;
  } catch (error) {
    console.error(`❌ Error fetching page by id ${id}:`, error.message);
    return null;
  }
}

export function updatePage(id, pageData) {
  const db = connectToDatabase();
  const now = new Date().toISOString();
  const content = JSON.stringify(pageData);

  try {
    // Check if page exists
    const existingPage = getPage(id);

    if (existingPage) {
      // Update existing page
      const stmt = db.prepare(
        'UPDATE pages SET content = ?, updatedAt = ? WHERE id = ?'
      );
      stmt.run(content, now, id);
      console.log(`✅ Updated page: ${id}`);
      return true;
    } else {
      // Create new page
      const stmt = db.prepare(
        'INSERT INTO pages (id, content, createdAt, updatedAt) VALUES (?, ?, ?, ?)'
      );
      stmt.run(id, content, now, now);
      console.log(`✅ Created page: ${id}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error updating/creating page ${id}:`, error.message);
    return false;
  }
}

export function deletePage(id) {
  const db = connectToDatabase();
  try {
    const stmt = db.prepare('DELETE FROM pages WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes > 0) {
      console.log(`✅ Deleted page: ${id}`);
      return true;
    }
    console.log(`⚠️ Page not found for deletion: ${id}`);
    return false;
  } catch (error) {
    console.error(`❌ Error deleting page ${id}:`, error.message);
    return false;
  }
}

// Placeholders for other functions not used by 404.astro
export function getAllPages() {
  console.log('getAllPages not implemented for generic pages');
  return [];
}

export function getPageBySlug(slug) {
  console.log(`getPageBySlug for ${slug} not implemented for generic pages`);
  return null;
}

export function getPageById(id) {
  // This is a duplicate of getPage, but keeping it for compatibility if other parts of the code use it.
  return getPage(id);
}

export function createPage(pageData) {
  // This is a duplicate of updatePage for new pages, but keeping it for compatibility.
  return updatePage(randomUUID(), pageData); // Generate a new ID for create
}