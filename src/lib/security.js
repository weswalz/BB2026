/**
 * BiYu Boxing - Security Utilities
 * CSRF protection, rate limiting, audit logging
 */

import { connectToDatabase } from './database.js';
import { randomUUID, randomBytes } from 'crypto';

// Rate limiting configuration
const RATE_LIMIT_WINDOWS = {
  auth: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 min
  api: { requests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  upload: { requests: 10, windowMs: 60 * 1000 }, // 10 uploads per minute
};

/**
 * Generate CSRF token
 */
export function generateCSRFToken() {
  return randomBytes(32).toString('hex');
}

/**
 * Verify CSRF token from session
 */
export function verifyCSRFToken(sessionData, providedToken) {
  if (!sessionData || !sessionData.csrfToken || !providedToken) {
    return false;
  }
  return sessionData.csrfToken === providedToken;
}

/**
 * Get client IP address from request
 */
export function getClientIP(request) {
  // Check for forwarded IP (behind proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Check for real IP header
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to connection IP (not reliable behind proxies)
  return 'unknown';
}

/**
 * Check rate limit for IP and endpoint
 */
export function checkRateLimit(ipAddress, endpoint = 'api') {
  const db = connectToDatabase();
  const now = Date.now();

  const config = RATE_LIMIT_WINDOWS[endpoint] || RATE_LIMIT_WINDOWS.api;
  const windowStart = now - config.windowMs;

  try {
    // Get or create rate limit record
    let record = db.prepare(
      'SELECT * FROM rate_limits WHERE ip_address = ? AND endpoint = ?'
    ).get(ipAddress, endpoint);

    if (!record) {
      // Create new record
      db.prepare(
        'INSERT INTO rate_limits (ip_address, endpoint, request_count, window_start) VALUES (?, ?, 1, ?)'
      ).run(ipAddress, endpoint, now);
      return { allowed: true, remaining: config.requests - 1 };
    }

    // Check if window has expired
    if (record.window_start < windowStart) {
      // Reset window
      db.prepare(
        'UPDATE rate_limits SET request_count = 1, window_start = ? WHERE ip_address = ? AND endpoint = ?'
      ).run(now, ipAddress, endpoint);
      return { allowed: true, remaining: config.requests - 1 };
    }

    // Check if limit exceeded
    if (record.request_count >= config.requests) {
      const resetTime = record.window_start + config.windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);
      return {
        allowed: false,
        retryAfter,
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      };
    }

    // Increment counter
    db.prepare(
      'UPDATE rate_limits SET request_count = request_count + 1 WHERE ip_address = ? AND endpoint = ?'
    ).run(ipAddress, endpoint);

    return {
      allowed: true,
      remaining: config.requests - record.request_count - 1
    };
  } catch (error) {
    console.error('[SECURITY] Rate limit check error:', error);
    // Fail open - allow request but log error
    return { allowed: true, remaining: 0 };
  }
}

/**
 * Log audit event
 */
export function logAudit(params) {
  const {
    username,
    action,
    entityType,
    entityId = null,
    changes = null,
    ipAddress = null,
    userAgent = null
  } = params;

  const db = connectToDatabase();
  const id = randomUUID();
  const timestamp = Math.floor(Date.now() / 1000);

  try {
    db.prepare(
      `INSERT INTO audit_log (id, timestamp, username, action, entity_type, entity_id, changes, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      timestamp,
      username,
      action,
      entityType,
      entityId,
      changes ? JSON.stringify(changes) : null,
      ipAddress,
      userAgent
    );

    console.log(`[AUDIT] ${username} - ${action} ${entityType}${entityId ? ` (${entityId})` : ''}`);
    return true;
  } catch (error) {
    console.error('[AUDIT] Failed to log:', error);
    return false;
  }
}

/**
 * Get audit logs (for admin review)
 */
export function getAuditLogs(options = {}) {
  const { limit = 100, offset = 0, username = null, entityType = null } = options;
  const db = connectToDatabase();

  try {
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];

    if (username) {
      query += ' AND username = ?';
      params.push(username);
    }

    if (entityType) {
      query += ' AND entity_type = ?';
      params.push(entityType);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = db.prepare(query).all(...params);

    return logs.map(log => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null,
      timestamp: new Date(log.timestamp * 1000).toISOString()
    }));
  } catch (error) {
    console.error('[AUDIT] Failed to get logs:', error);
    return [];
  }
}

/**
 * Clean up old rate limit records (run periodically)
 */
export function cleanupRateLimits() {
  const db = connectToDatabase();
  const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

  try {
    const result = db.prepare(
      'DELETE FROM rate_limits WHERE window_start < ?'
    ).run(cutoff);

    console.log(`[SECURITY] Cleaned up ${result.changes} old rate limit records`);
    return result.changes;
  } catch (error) {
    console.error('[SECURITY] Cleanup error:', error);
    return 0;
  }
}

/**
 * Clean up old sessions (run periodically)
 */
export function cleanupSessions() {
  const db = connectToDatabase();
  const maxAge = parseInt(process.env.SESSION_MAX_AGE || '86400000');
  const cutoff = Math.floor((Date.now() - maxAge) / 1000);

  try {
    const result = db.prepare(
      'DELETE FROM sessions WHERE last_activity < ?'
    ).run(cutoff);

    console.log(`[SECURITY] Cleaned up ${result.changes} expired sessions`);
    return result.changes;
  } catch (error) {
    console.error('[SECURITY] Session cleanup error:', error);
    return 0;
  }
}

/**
 * Create database transaction wrapper
 */
export function withTransaction(db, callback) {
  const transaction = db.transaction(callback);
  try {
    return transaction();
  } catch (error) {
    console.error('[TRANSACTION] Failed:', error);
    throw error;
  }
}
