#!/usr/bin/env python3
import json
import sqlite3
from datetime import datetime

# Connect to database
conn = sqlite3.connect('biyuboxing.db')
cursor = conn.cursor()

# Import news
with open('news.json', 'r') as f:
    news_data = json.load(f)
    
for item in news_data:
    try:
        cursor.execute('''
            INSERT OR REPLACE INTO news (
                id, title, slug, content, excerpt, image,
                author, createdAt, updatedAt, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            item['_id']['$oid'],
            item.get('title', ''),
            item.get('slug', ''),
            item.get('content', ''),
            item.get('excerpt', ''),
            item.get('featuredImage', ''),
            item.get('author', ''),
            item.get('createdAt', {}).get('$date', ''),
            item.get('updatedAt', {}).get('$date', ''),
            'published' if item.get('published', False) else 'draft'
        ))
        print(f"Inserted news: {item.get('title', '')}")
    except Exception as e:
        print(f"Error inserting news item: {e}")

# Import events
with open('events.json', 'r') as f:
    events_data = json.load(f)
    
for item in events_data:
    try:
        # Combine address, city, state into location
        location_parts = []
        if item.get('address'):
            location_parts.append(item['address'])
        if item.get('city'):
            location_parts.append(item['city'])
        if item.get('state'):
            location_parts.append(item['state'])
        location = ', '.join(location_parts)
        
        # Generate slug if not present
        slug = item.get('slug', '')
        if not slug and item.get('title'):
            slug = item['title'].lower().replace(' ', '-').replace('&', 'and')
            
        cursor.execute('''
            INSERT OR REPLACE INTO events (
                id, title, slug, date, venue, location,
                description, image, fights, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            item['_id']['$oid'],
            item.get('title', ''),
            slug,
            item.get('date', {}).get('$date', ''),
            item.get('venue', ''),
            location,
            item.get('description', ''),
            item.get('featuredImage', ''),
            json.dumps(item.get('fights', [])),
            'upcoming' if item.get('published', False) else 'draft'
        ))
        print(f"Inserted event: {item.get('title', '')}")
    except Exception as e:
        print(f"Error inserting event item: {e}")

conn.commit()

# Check counts
cursor.execute("SELECT COUNT(*) FROM news")
news_count = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM events")
events_count = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM fighters")
fighters_count = cursor.fetchone()[0]

print(f"\nImport complete!")
print(f"News articles: {news_count}")
print(f"Events: {events_count}")
print(f"Fighters: {fighters_count}")

conn.close()