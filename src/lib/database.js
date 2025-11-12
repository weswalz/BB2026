import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path - read from environment or use default relative path
const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'database', 'biyuboxing.db');

/**
 * @type {import('better-sqlite3').Database}
 */
let db;

export function connectToDatabase() {
  if (db) {
    return db;
  }

  try {
    db = new Database(DB_PATH);
    console.log('✅ SQLite connected successfully to', DB_PATH);
    return db;
  } catch (error) {
    console.error('❌ SQLite connection failed:', error.message);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}



/**
 * Get all events from the database
 * @param {Object} options - Query options
 * @param {boolean} options.includeDeleted - Include soft-deleted items (admin only)
 * @returns {Array}
 */
export function getAllEvents(options = {}) {
  const { includeDeleted = false } = options;

  try {
    const db = connectToDatabase();
    const whereClause = includeDeleted ? '' : 'WHERE deleted_at IS NULL';
    const events = db.prepare(`SELECT * FROM events ${whereClause} ORDER BY date DESC`).all();
    const now = new Date();

    // Process events - parse JSON fights field and auto-update status based on date
    const processedEvents = events.map(event => {
      let status = event.status;

      // Auto-determine status based on date (don't override cancelled)
      if (event.date && status !== 'cancelled') {
        const eventDate = new Date(event.date);
        const autoStatus = eventDate < now ? 'past' : 'upcoming';

        // If status changed, update in database
        if (status !== autoStatus) {
          try {
            db.prepare('UPDATE events SET status = ? WHERE id = ?').run(autoStatus, event.id);
            status = autoStatus;
            console.log(`🔄 Auto-updated event status: ${event.title} → ${autoStatus}`);
          } catch (err) {
            console.error('Error auto-updating event status:', err);
          }
        }
      }

      return {
        ...event,
        status,
        fights: event.fights ? JSON.parse(event.fights) : [],
        // Keep date as string to avoid serialization issues in Astro SSR
        date: event.date || null,
        isDeleted: event.deleted_at !== null
      };
    });

    console.log(`✅ Retrieved ${events.length} events from database`);
    return processedEvents;
  } catch (error) {
    console.error('❌ Error fetching events:', error.message);
    return [];
  }
}

/**
 * Get all news articles from the database
 * @param {Object} options - Query options
 * @param {boolean} options.includeDeleted - Include soft-deleted items (admin only)
 * @returns {Array}
 */
export function getAllNews(options = {}) {
  const { includeDeleted = false } = options;

  try {
    const db = connectToDatabase();
    const whereClause = includeDeleted ? '' : 'WHERE deleted_at IS NULL';
    const news = db.prepare(`SELECT * FROM news ${whereClause} ORDER BY featured DESC, publishedAt DESC`).all();

    // Process news articles - convert date strings to Date objects and handle boolean fields
    const processedNews = news.map(article => ({
      ...article,
      published: Boolean(article.published),
      featured: Boolean(article.featured),
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
      createdAt: article.createdAt ? new Date(article.createdAt) : null,
      updatedAt: article.updatedAt ? new Date(article.updatedAt) : null,
      isDeleted: article.deleted_at !== null
    }));

    console.log(`✅ Retrieved ${news.length} news articles from database`);
    return processedNews;
  } catch (error) {
    console.error('❌ Error fetching news:', error.message);
    return [];
  }
}

/**
 * Get all fighters from the database
 * @param {Object} options - Query options
 * @param {boolean} options.includeDeleted - Include soft-deleted items (admin only)
 * @returns {Array}
 */
export function getAllFighters(options = {}) {
  const { includeDeleted = false } = options;

  try {
    const db = connectToDatabase();
    const whereClause = includeDeleted ? '' : 'WHERE deleted_at IS NULL';
    const fighters = db.prepare(`SELECT * FROM fighters ${whereClause} ORDER BY name`).all();

    const processedFighters = fighters.map(fighter => ({
      ...fighter,
      isDeleted: fighter.deleted_at !== null
    }));

    console.log(`✅ Retrieved ${fighters.length} fighters from database`);
    return processedFighters;
  } catch (error) {
    console.error('❌ Error fetching fighters:', error.message);
    return [];
  }
}

/**
 * Get a fighter by slug
 * @param {string} slug
 * @returns {Object|null}
 */
export function getFighterBySlug(slug) {
  try {
    const db = connectToDatabase();
    const fighter = db.prepare('SELECT * FROM fighters WHERE slug = ? AND deleted_at IS NULL').get(slug);
    console.log(`✅ Retrieved fighter by slug: ${slug}`, fighter ? 'found' : 'not found');
    return fighter;
  } catch (error) {
    console.error('❌ Error fetching fighter by slug:', error.message);
    return null;
  }
}

/**
 * Get a news article by slug
 * @param {string} slug
 * @returns {Object|null}
 */
export function getNewsBySlug(slug) {
  try {
    const db = connectToDatabase();
    const article = db.prepare('SELECT * FROM news WHERE slug = ? AND deleted_at IS NULL').get(slug);
    console.log(`✅ Retrieved news by slug: ${slug}`, article ? 'found' : 'not found');
    return article;
  } catch (error) {
    console.error('❌ Error fetching news by slug:', error.message);
    return null;
  }
}

/**
 * Get an event by slug
 * @param {string} slug
 * @returns {Object|null}
 */
export function getEventBySlug(slug) {
  try {
    const db = connectToDatabase();
    const event = db.prepare('SELECT * FROM events WHERE slug = ? AND deleted_at IS NULL').get(slug);
    if (event && event.fights) {
      event.fights = JSON.parse(event.fights);
    }
    return event || null;
  } catch (error) {
    console.error('❌ Error fetching event:', error.message);
    return null;
  }
}


// Close database on process exit
process.on('exit', () => {
  if (db) {
    db.close();
  }
});

process.on('SIGINT', () => {
  if (db) {
    db.close();
  }
  process.exit(0);
});