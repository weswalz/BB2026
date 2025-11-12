import { connectToDatabase, getAllNews, getNewsBySlug } from './database.js';
import { randomUUID } from 'crypto';
import { purgeCloudflareCache } from './cloudflare.js';

// Re-export main functions
export { getAllNews, getNewsBySlug };

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

export function getNewsById(id) {
  const db = connectToDatabase();
  try {
    const stmt = db.prepare('SELECT * FROM news WHERE id = ?');
    const article = stmt.get(id);
    return article || null;
  } catch (error) {
    console.error(`❌ Error fetching news by id ${id}:`, error.message);
    return null;
  }
}

export function createNews(newsData) {
  const db = connectToDatabase();
  const id = randomUUID();
  const slug = slugify(newsData.title);
  const now = new Date().toISOString();

  const newArticle = {
    id,
    title: newsData.title,
    content: newsData.content || '',
    excerpt: newsData.excerpt || '',
    image: newsData.featuredImage || '',
    featuredImage: newsData.featuredImage || '',
    author: newsData.author || 'BiYu Promotions',
    category: newsData.category || 'General',
    featured: newsData.featured ? 1 : 0,
    published: newsData.published ? 1 : 0,
    createdAt: now,
    updatedAt: now,
    publishedAt: newsData.published ? now : null,
    status: newsData.published ? 'published' : 'draft',
    slug,
    seoTitle: newsData.seo?.metaTitle || newsData.title,
    seoDescription: newsData.seo?.metaDescription || newsData.excerpt,
    tags: Array.isArray(newsData.tags) ? newsData.tags.join(', ') : (newsData.tags || ''),
  };

  try {
    const stmt = db.prepare(
      `INSERT INTO news (id, title, content, excerpt, image, featuredImage, author, category, featured, published, createdAt, updatedAt, publishedAt, status, slug, seoTitle, seoDescription, tags)
       VALUES (@id, @title, @content, @excerpt, @image, @featuredImage, @author, @category, @featured, @published, @createdAt, @updatedAt, @publishedAt, @status, @slug, @seoTitle, @seoDescription, @tags)`
    );
    stmt.run(newArticle);
    console.log(`✅ Created news article: ${newArticle.title}`);

    // Purge Cloudflare cache
    purgeCloudflareCache().catch(err => console.error('Cache purge error:', err));

    return { ...newArticle, _id: id };
  } catch (error) {
    console.error('❌ Error creating news article:', error.message);
    return null;
  }
}

export function updateNews(id, newsData) {
  const db = connectToDatabase();
  const now = new Date().toISOString();

  // Fields that can be updated
  const allowedFields = {
    title: newsData.title,
    content: newsData.content,
    excerpt: newsData.excerpt,
    image: newsData.featuredImage,
    featuredImage: newsData.featuredImage,
    author: newsData.author,
    category: newsData.category,
    featured: newsData.featured,
    published: newsData.published,
    status: newsData.status,
    slug: newsData.slug,
    seoTitle: newsData.seo?.metaTitle,
    seoDescription: newsData.seo?.metaDescription,
    tags: newsData.tags,
  };

  const updateFields = {};
  for (const [key, value] of Object.entries(allowedFields)) {
    if (value !== undefined) {
      if (key === 'featured' || key === 'published') {
        updateFields[key] = value ? 1 : 0;
      } else if (key === 'tags' && Array.isArray(value)) {
        updateFields[key] = value.join(', ');
      }
      else {
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
    const stmt = db.prepare(`UPDATE news SET ${setClause} WHERE id = @id`);
    stmt.run({ ...updateFields, id });
    console.log(`✅ Updated news article: ${id}`);

    // Purge Cloudflare cache
    purgeCloudflareCache().catch(err => console.error('Cache purge error:', err));

    return true;
  } catch (error) {
    console.error(`❌ Error updating news article ${id}:`, error.message);
    return false;
  }
}

/**
 * Soft delete news article (mark as deleted)
 * @param {string} id - News article ID
 * @param {string} deletedBy - Username of person deleting
 * @returns {boolean} Success status
 */
export function deleteNews(id, deletedBy = 'unknown') {
  const db = connectToDatabase();
  const now = new Date().toISOString();

  try {
    const stmt = db.prepare('UPDATE news SET deleted_at = ?, deleted_by = ? WHERE id = ?');
    const result = stmt.run(now, deletedBy, id);
    if (result.changes > 0) {
      console.log(`✅ Soft deleted news article: ${id} by ${deletedBy}`);

      // Purge Cloudflare cache
      purgeCloudflareCache().catch(err => console.error('Cache purge error:', err));

      return true;
    }
    console.log(`⚠️ News article not found for deletion: ${id}`);
    return false;
  } catch (error) {
    console.error(`❌ Error deleting news article ${id}:`, error.message);
    return false;
  }
}

/**
 * Restore soft-deleted news article
 * @param {string} id - News article ID
 * @returns {boolean} Success status
 */
export function restoreNews(id) {
  const db = connectToDatabase();

  try {
    const stmt = db.prepare('UPDATE news SET deleted_at = NULL, deleted_by = NULL WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes > 0) {
      console.log(`✅ Restored news article: ${id}`);

      // Purge Cloudflare cache
      purgeCloudflareCache().catch(err => console.error('Cache purge error:', err));

      return true;
    }
    console.log(`⚠️ News article not found for restoration: ${id}`);
    return false;
  } catch (error) {
    console.error(`❌ Error restoring news article ${id}:`, error.message);
    return false;
  }
}

/**
 * Permanently delete news article (hard delete)
 * @param {string} id - News article ID
 * @returns {boolean} Success status
 */
export function permanentlyDeleteNews(id) {
  const db = connectToDatabase();
  try {
    const stmt = db.prepare('DELETE FROM news WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes > 0) {
      console.log(`✅ Permanently deleted news article: ${id}`);
      return true;
    }
    console.log(`⚠️ News article not found for permanent deletion: ${id}`);
    return false;
  } catch (error) {
    console.error(`❌ Error permanently deleting news article ${id}:`, error.message);
    return false;
  }
}

export function togglePublishStatus(id) {
  const article = getNewsById(id);
  if (!article) return false;
  return updateNews(id, { published: !article.published });
}

export function getNewsCategories() {
  const news = getAllNews();
  if (!news) return [];
  const categories = new Set(news.map(n => n.category).filter(Boolean));
  return Array.from(categories);
}

export function getNewsTags() {
  const news = getAllNews();
  if (!news) return [];
  const tags = new Set(
    news
      .flatMap(n => {
        if (typeof n.tags === 'string') {
          return n.tags.split(',').map(t => t.trim());
        }
        if (Array.isArray(n.tags)) {
          return n.tags;
        }
        return [];
      })
      .filter(Boolean)
  );
  return Array.from(tags);
}
