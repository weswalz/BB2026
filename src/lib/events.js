import { connectToDatabase, getAllEvents, getEventBySlug } from './database.js';
import { randomUUID } from 'crypto';
import { purgeCloudflareCache } from './cloudflare.js';

// Re-export main functions
export { getAllEvents, getEventBySlug };

/**
 * Get upcoming events sorted by date
 * @returns {Array} - Array of upcoming events
 */
export function getUpcomingEvents() {
  const db = connectToDatabase();
  try {
    const stmt = db.prepare(`
      SELECT * FROM events
      WHERE status = 'upcoming' AND deleted_at IS NULL
      ORDER BY date ASC
    `);
    const events = stmt.all();

    // Parse fights JSON for each event
    return events.map(event => ({
      ...event,
      fights: event.fights ? JSON.parse(event.fights) : []
    }));
  } catch (error) {
    console.error('❌ Error fetching upcoming events:', error.message);
    return [];
  }
}

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

/**
 * Auto-determine event status based on date
 * @param {string} eventDate - ISO date string
 * @param {string} currentStatus - Current status (don't override 'cancelled')
 * @returns {string} - Status: 'upcoming', 'past', or 'cancelled'
 */
function autoStatus(eventDate, currentStatus = 'upcoming') {
  // Never auto-change cancelled events
  if (currentStatus === 'cancelled') {
    return 'cancelled';
  }

  const now = new Date();
  const eventDateTime = new Date(eventDate);

  return eventDateTime < now ? 'past' : 'upcoming';
}

export function getEventById(id) {
  const db = connectToDatabase();
  try {
    const stmt = db.prepare('SELECT * FROM events WHERE id = ?');
    const event = stmt.get(id);
    if (event && event.fights) {
      event.fights = JSON.parse(event.fights);
    }
    return event || null;
  } catch (error) {
    console.error(`❌ Error fetching event by id ${id}:`, error.message);
    return null;
  }
}

export function createEvent(eventData) {
  const db = connectToDatabase();
  const id = randomUUID();
  const slug = slugify(eventData.title);
  const now = new Date().toISOString();
  const location = [eventData.city, eventData.country].filter(Boolean).join(', ');

  // Auto-determine status based on date
  const status = autoStatus(eventData.date, eventData.status || 'upcoming');

  const newEvent = {
    id,
    title: eventData.title,
    date: eventData.date,
    venue: eventData.venue || '',
    location: location,
    description: eventData.description || '',
    detailedDescription: eventData.detailedDescription || '',
    image: eventData.image || '',
    ticketUrl: eventData.ticketUrl || '',
    fights: JSON.stringify(eventData.fights || []),
    status: status,
    featured: eventData.featured ? 1 : 0,
    slug,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const stmt = db.prepare(
      `INSERT INTO events (id, title, date, venue, location, description, detailedDescription, image, ticketUrl, fights, status, featured, slug, createdAt, updatedAt)
       VALUES (@id, @title, @date, @venue, @location, @description, @detailedDescription, @image, @ticketUrl, @fights, @status, @featured, @slug, @createdAt, @updatedAt)`
    );
    stmt.run(newEvent);
    console.log(`✅ Created event: ${newEvent.title}`);

    // Purge Cloudflare cache
    purgeCloudflareCache().catch(err => console.error('Cache purge error:', err));

    return { ...newEvent, _id: id, fights: JSON.parse(newEvent.fights) };
  } catch (error) {
    console.error('❌ Error creating event:', error.message);
    return null;
  }
}

export function updateEvent(id, eventData) {
  const db = connectToDatabase();
  const now = new Date().toISOString();
  const location = [eventData.city, eventData.country].filter(Boolean).join(', ');

  // Auto-determine status based on date if date is being updated
  const status = eventData.date
    ? autoStatus(eventData.date, eventData.status || 'upcoming')
    : eventData.status;

  const allowedFields = {
    title: eventData.title,
    date: eventData.date,
    venue: eventData.venue,
    location: location,
    description: eventData.description,
    detailedDescription: eventData.detailedDescription,
    image: eventData.image,
    ticketUrl: eventData.ticketUrl,
    fights: eventData.fights,
    status: status,
    featured: eventData.featured,
    slug: eventData.slug,
  };

  const updateFields = {};
  for (const [key, value] of Object.entries(allowedFields)) {
    if (value !== undefined) {
      if (key === 'featured') {
        updateFields[key] = value ? 1 : 0;
      } else if (key === 'fights' && Array.isArray(value)) {
        updateFields[key] = JSON.stringify(value);
      } else {
        updateFields[key] = value;
      }
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return true; // Nothing to update
  }

  updateFields.updatedAt = now;

  const setClause = Object.keys(updateFields)
    .map(key => `${key} = @${key}`)
    .join(', ');

  try {
    const stmt = db.prepare(`UPDATE events SET ${setClause} WHERE id = @id`);
    stmt.run({ ...updateFields, id });
    console.log(`✅ Updated event: ${id}`);

    // Purge Cloudflare cache
    purgeCloudflareCache().catch(err => console.error('Cache purge error:', err));

    return true;
  } catch (error) {
    console.error(`❌ Error updating event ${id}:`, error.message);
    return false;
  }
}

/**
 * Soft delete event (mark as deleted)
 * @param {string} id - Event ID
 * @param {string} deletedBy - Username of person deleting
 * @returns {boolean} Success status
 */
export function deleteEvent(id, deletedBy = 'unknown') {
  const db = connectToDatabase();
  const now = new Date().toISOString();

  try {
    const stmt = db.prepare('UPDATE events SET deleted_at = ?, deleted_by = ? WHERE id = ?');
    const result = stmt.run(now, deletedBy, id);
    if (result.changes > 0) {
      console.log(`✅ Soft deleted event: ${id} by ${deletedBy}`);

      // Purge Cloudflare cache
      purgeCloudflareCache().catch(err => console.error('Cache purge error:', err));

      return true;
    }
    console.log(`⚠️ Event not found for deletion: ${id}`);
    return false;
  } catch (error) {
    console.error(`❌ Error deleting event ${id}:`, error.message);
    return false;
  }
}

/**
 * Restore soft-deleted event
 * @param {string} id - Event ID
 * @returns {boolean} Success status
 */
export function restoreEvent(id) {
  const db = connectToDatabase();

  try {
    const stmt = db.prepare('UPDATE events SET deleted_at = NULL, deleted_by = NULL WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes > 0) {
      console.log(`✅ Restored event: ${id}`);

      // Purge Cloudflare cache
      purgeCloudflareCache().catch(err => console.error('Cache purge error:', err));

      return true;
    }
    console.log(`⚠️ Event not found for restoration: ${id}`);
    return false;
  } catch (error) {
    console.error(`❌ Error restoring event ${id}:`, error.message);
    return false;
  }
}

/**
 * Permanently delete event (hard delete)
 * @param {string} id - Event ID
 * @returns {boolean} Success status
 */
export function permanentlyDeleteEvent(id) {
  const db = connectToDatabase();
  try {
    const stmt = db.prepare('DELETE FROM events WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes > 0) {
      console.log(`✅ Permanently deleted event: ${id}`);
      return true;
    }
    console.log(`⚠️ Event not found for permanent deletion: ${id}`);
    return false;
  } catch (error) {
    console.error(`❌ Error permanently deleting event ${id}:`, error.message);
    return false;
  }
}
