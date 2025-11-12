/**
 * Cloudflare Cache Purge Utility
 * Automatically purges Cloudflare cache when content changes
 */

import 'dotenv/config';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

/**
 * Purge entire Cloudflare cache for the zone
 * @returns {Promise<boolean>} Success status
 */
export async function purgeCloudflareCache() {
  // Skip in development if credentials not set
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
    console.log('⚠️  Cloudflare credentials not configured, skipping cache purge');
    return false;
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        purge_everything: true
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Cloudflare cache purged successfully');
      return true;
    } else {
      console.error('❌ Cloudflare cache purge failed:', data.errors);
      return false;
    }
  } catch (error) {
    console.error('❌ Error purging Cloudflare cache:', error.message);
    return false;
  }
}

/**
 * Purge specific URLs from Cloudflare cache
 * @param {string[]} urls - Array of full URLs to purge
 * @returns {Promise<boolean>} Success status
 */
export async function purgeCloudflareUrls(urls) {
  // Skip in development if credentials not set
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
    console.log('⚠️  Cloudflare credentials not configured, skipping cache purge');
    return false;
  }

  if (!urls || urls.length === 0) {
    console.log('⚠️  No URLs provided for cache purge');
    return false;
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: urls
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Purged ${urls.length} URL(s) from Cloudflare cache`);
      return true;
    } else {
      console.error('❌ Cloudflare URL purge failed:', data.errors);
      return false;
    }
  } catch (error) {
    console.error('❌ Error purging Cloudflare URLs:', error.message);
    return false;
  }
}
