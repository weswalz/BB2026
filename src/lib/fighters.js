import { connectToDatabase, getAllFighters, getFighterBySlug } from './database.js';
import { randomUUID } from 'crypto';
import { purgeCloudflareCache } from './cloudflare.js';

// Re-export main functions
export { getAllFighters, getFighterBySlug };

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function getFighterById(id) {
  const db = connectToDatabase();
  try {
    const stmt = db.prepare('SELECT * FROM fighters WHERE id = ?');
    const fighter = stmt.get(id);
    return fighter || null;
  } catch (error) {
    console.error(`❌ Error fetching fighter by id ${id}:`, error.message);
    return null;
  }
}

export function createFighter(fighterData) {
  const db = connectToDatabase();
  const id = randomUUID();
  const slug = slugify(fighterData.name);

  const newFighter = {
    id,
    name: fighterData.name,
    nickname: fighterData.nickname || null,
    record: fighterData.record || '',
    nationality: fighterData.nationality || '',
    weightClass: fighterData.weightClass || '',
    height: fighterData.height || null,
    weight: fighterData.weight || null,
    reach: fighterData.reach || null,
    stance: fighterData.stance || null,
    hometown: fighterData.hometown || null,
    bio: fighterData.bio || null,
    image: fighterData.image || '',
    flag: fighterData.flag || '',
    wins: fighterData.wins || 0,
    losses: fighterData.losses || 0,
    draws: fighterData.draws || 0,
    kos: fighterData.kos || 0,
    status: fighterData.status || 'active',
    slug,
    displayOrder: fighterData.displayOrder || 0,
  };

  try {
    const stmt = db.prepare(
      `INSERT INTO fighters (id, name, nickname, record, nationality, weightClass, height, weight, reach, stance, hometown, bio, image, flag, wins, losses, draws, kos, status, slug, displayOrder)
       VALUES (@id, @name, @nickname, @record, @nationality, @weightClass, @height, @weight, @reach, @stance, @hometown, @bio, @image, @flag, @wins, @losses, @draws, @kos, @status, @slug, @displayOrder)`
    );
    stmt.run(newFighter);
    console.log(`✅ Created fighter: ${newFighter.name}`);

    // Purge Cloudflare cache
    purgeCloudflareCache().catch(err => console.error('Cache purge error:', err));

    return { ...newFighter, _id: id };
  } catch (error) {
    console.error('❌ Error creating fighter:', error.message);
    return null;
  }
}

export function updateFighter(id, fighterData) {
  const db = connectToDatabase();

  const allowedFields = {
    name: fighterData.name,
    nickname: fighterData.nickname,
    record: fighterData.record,
    nationality: fighterData.nationality,
    weightClass: fighterData.weightClass,
    height: fighterData.height,
    weight: fighterData.weight,
    reach: fighterData.reach,
    stance: fighterData.stance,
    hometown: fighterData.hometown,
    bio: fighterData.bio,
    image: fighterData.image,
    flag: fighterData.flag,
    wins: fighterData.wins,
    losses: fighterData.losses,
    draws: fighterData.draws,
    kos: fighterData.kos,
    status: fighterData.status,
    slug: fighterData.slug,
    displayOrder: fighterData.displayOrder,
  };

  const updateFields = {};
  for (const [key, value] of Object.entries(allowedFields)) {
    if (value !== undefined) {
      updateFields[key] = value;
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return true; // Nothing to update
  }

  const setClause = Object.keys(updateFields)
    .map(key => `${key} = @${key}`)
    .join(', ');

  try {
    const stmt = db.prepare(`UPDATE fighters SET ${setClause} WHERE id = @id`);
    stmt.run({ ...updateFields, id });
    console.log(`✅ Updated fighter: ${id}`);

    // Purge Cloudflare cache
    purgeCloudflareCache().catch(err => console.error('Cache purge error:', err));

    return true;
  } catch (error) {
    console.error(`❌ Error updating fighter ${id}:`, error.message);
    return false;
  }
}

/**
 * Soft delete fighter (mark as deleted)
 * @param {string} id - Fighter ID
 * @param {string} deletedBy - Username of person deleting
 * @returns {boolean} Success status
 */
export function deleteFighter(id, deletedBy = 'unknown') {
  const db = connectToDatabase();
  const now = new Date().toISOString();

  try {
    const stmt = db.prepare('UPDATE fighters SET deleted_at = ?, deleted_by = ? WHERE id = ?');
    const result = stmt.run(now, deletedBy, id);
    if (result.changes > 0) {
      console.log(`✅ Soft deleted fighter: ${id} by ${deletedBy}`);

      // Purge Cloudflare cache
      purgeCloudflareCache().catch(err => console.error('Cache purge error:', err));

      return true;
    }
    console.log(`⚠️ Fighter not found for deletion: ${id}`);
    return false;
  } catch (error) {
    console.error(`❌ Error deleting fighter ${id}:`, error.message);
    return false;
  }
}

/**
 * Restore soft-deleted fighter
 * @param {string} id - Fighter ID
 * @returns {boolean} Success status
 */
export function restoreFighter(id) {
  const db = connectToDatabase();

  try {
    const stmt = db.prepare('UPDATE fighters SET deleted_at = NULL, deleted_by = NULL WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes > 0) {
      console.log(`✅ Restored fighter: ${id}`);

      // Purge Cloudflare cache
      purgeCloudflareCache().catch(err => console.error('Cache purge error:', err));

      return true;
    }
    console.log(`⚠️ Fighter not found for restoration: ${id}`);
    return false;
  } catch (error) {
    console.error(`❌ Error restoring fighter ${id}:`, error.message);
    return false;
  }
}

/**
 * Permanently delete fighter (hard delete)
 * @param {string} id - Fighter ID
 * @returns {boolean} Success status
 */
export function permanentlyDeleteFighter(id) {
  const db = connectToDatabase();
  try {
    const stmt = db.prepare('DELETE FROM fighters WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes > 0) {
      console.log(`✅ Permanently deleted fighter: ${id}`);
      return true;
    }
    console.log(`⚠️ Fighter not found for permanent deletion: ${id}`);
    return false;
  } catch (error) {
    console.error(`❌ Error permanently deleting fighter ${id}:`, error.message);
    return false;
  }
}
