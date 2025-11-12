import { connectToDatabase } from './database.js';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export async function getAllMedia() {
  const db = connectToDatabase();
  try {
    const media = db.prepare('SELECT * FROM media ORDER BY createdAt DESC').all();
    return media;
  } catch (error) {
    console.error('❌ Error fetching media:', error.message);
    return [];
  }
}

export async function createMedia(mediaData) {
  const db = connectToDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  const newMedia = {
    id,
    filename: mediaData.filename,
    originalName: mediaData.originalName,
    url: mediaData.url,
    mimetype: mediaData.mimetype,
    size: mediaData.size,
    alt: mediaData.alt || '',
    createdAt: now,
  };

  try {
    const stmt = db.prepare(
      `INSERT INTO media (id, filename, originalName, url, mimetype, size, alt, createdAt)
       VALUES (@id, @filename, @originalName, @url, @mimetype, @size, @alt, @createdAt)`
    );
    stmt.run(newMedia);
    console.log(`✅ Created media record: ${newMedia.filename}`);
    return newMedia;
  } catch (error) {
    console.error('❌ Error creating media record:', error.message);
    return null;
  }
}

export async function deleteMedia(id) {
  const db = connectToDatabase();
  try {
    const stmt = db.prepare('SELECT * FROM media WHERE id = ?');
    const media = stmt.get(id);

    if (!media) {
      console.log(`⚠️ Media not found for deletion: ${id}`);
      return false;
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'public', media.url);
    await fs.unlink(filePath);

    // Delete from database
    const deleteStmt = db.prepare('DELETE FROM media WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes > 0) {
      console.log(`✅ Deleted media: ${id}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error deleting media ${id}:`, error.message);
    return false;
  }
}
