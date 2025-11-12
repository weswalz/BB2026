#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../database/biyuboxing.db');
const DATA_DIR = path.join(__dirname, '../database');

console.log('🔄 Converting JSON data to SQLite...');

// Remove existing database
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('🗑️  Removed existing database');
}

// Create new database
const db = new Database(DB_PATH);

// Create tables
const createFighters = `
  CREATE TABLE fighters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    record TEXT,
    nationality TEXT,
    weightClass TEXT,
    image TEXT,
    flag TEXT,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    kos INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    slug TEXT UNIQUE
  )
`;

const createEvents = `
  CREATE TABLE events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT,
    venue TEXT,
    location TEXT,
    description TEXT,
    image TEXT,
    fights TEXT,
    status TEXT DEFAULT 'upcoming',
    slug TEXT UNIQUE
  )
`;

const createNews = `
  CREATE TABLE news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    excerpt TEXT,
    image TEXT,
    author TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    status TEXT DEFAULT 'published',
    slug TEXT UNIQUE
  )
`;

try {
  db.exec(createFighters);
  db.exec(createEvents);
  db.exec(createNews);
  console.log('✅ Tables created');

  // Import fighters
  const fightersData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'fighters.json'), 'utf8'));
  const insertFighter = db.prepare(`
    INSERT INTO fighters (id, name, record, nationality, weightClass, image, flag, wins, losses, draws, kos, status, slug)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const fighterTransaction = db.transaction((fighters) => {
    for (const fighter of fighters) {
      const id = fighter._id?.$oid || fighter.id || `fighter_${Date.now()}_${Math.random()}`;
      insertFighter.run(
        id,
        fighter.name,
        fighter.record,
        fighter.nationality,
        fighter.weightClass,
        fighter.image,
        fighter.flag,
        fighter.wins || 0,
        fighter.losses || 0,
        fighter.draws || 0,
        fighter.kos || 0,
        fighter.status || 'active',
        fighter.slug
      );
    }
  });

  fighterTransaction(fightersData);
  console.log(`✅ Imported ${fightersData.length} fighters`);

  // Import events
  const eventsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'events.json'), 'utf8'));
  const insertEvent = db.prepare(`
    INSERT INTO events (id, title, date, venue, location, description, image, fights, status, slug)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const eventTransaction = db.transaction((events) => {
    for (const event of events) {
      const id = event._id?.$oid || event.id || `event_${Date.now()}_${Math.random()}`;
      insertEvent.run(
        id,
        event.title,
        event.date,
        event.venue,
        event.location,
        event.description,
        event.image,
        JSON.stringify(event.fights || []),
        event.status || 'upcoming',
        event.slug
      );
    }
  });

  eventTransaction(eventsData);
  console.log(`✅ Imported ${eventsData.length} events`);

  // Import news
  const newsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'news.json'), 'utf8'));
  const insertNews = db.prepare(`
    INSERT INTO news (id, title, content, excerpt, image, author, createdAt, updatedAt, status, slug)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const newsTransaction = db.transaction((news) => {
    for (const article of news) {
      const id = article._id?.$oid || article.id || `news_${Date.now()}_${Math.random()}`;
      insertNews.run(
        id,
        article.title,
        article.content,
        article.excerpt,
        article.image,
        article.author,
        article.createdAt,
        article.updatedAt,
        article.status || 'published',
        article.slug
      );
    }
  });

  newsTransaction(newsData);
  console.log(`✅ Imported ${newsData.length} news articles`);

  console.log('\n🎉 SQLite database created successfully!');
  console.log(`📁 Database location: ${DB_PATH}`);
  
  // Show some stats
  const fighterCount = db.prepare('SELECT COUNT(*) as count FROM fighters').get().count;
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
  const newsCount = db.prepare('SELECT COUNT(*) as count FROM news').get().count;
  
  console.log(`\n📊 Database contains:`);
  console.log(`   - ${fighterCount} fighters`);
  console.log(`   - ${eventCount} events`);
  console.log(`   - ${newsCount} news articles`);

} catch (error) {
  console.error('❌ Error importing data:', error);
  process.exit(1);
} finally {
  db.close();
}