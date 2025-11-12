import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(process.cwd(), 'database', 'biyuboxing.db');
const db = new Database(DB_PATH);

const now = new Date().toISOString();

console.log('🔍 Checking current homepage hero image...\n');

// Get current homepage content
const currentPage = db.prepare('SELECT content FROM pages WHERE id = ?').get('home');
if (currentPage) {
  const content = JSON.parse(currentPage.content);
  console.log('Current heroImage:', content.heroImage);
}

// Update to correct boxer image
console.log('\n📸 Updating homepage hero image...');

try {
  const page = db.prepare('SELECT content FROM pages WHERE id = ?').get('home');

  if (page) {
    const content = JSON.parse(page.content);
    content.heroImage = '/images/home/boxerhero.jpg';

    const stmt = db.prepare('UPDATE pages SET content = ?, updatedAt = ? WHERE id = ?');
    stmt.run(JSON.stringify(content), now, 'home');

    console.log('✅ Homepage hero image updated to: /images/home/boxerhero.jpg');

    // Verify the change
    const updatedPage = db.prepare('SELECT content FROM pages WHERE id = ?').get('home');
    const updatedContent = JSON.parse(updatedPage.content);
    console.log('✅ Verified new heroImage:', updatedContent.heroImage);
  } else {
    console.error('❌ Homepage not found in database');
  }
} catch (error) {
  console.error('❌ Error updating homepage hero:', error.message);
} finally {
  db.close();
}
