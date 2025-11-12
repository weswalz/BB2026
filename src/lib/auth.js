// BiYu Boxing Admin Authentication System
// Username/Password authentication with Argon2id hashing
// Database-backed lockout tracking, CSRF protection, persistent sessions

import argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { connectToDatabase } from './database.js';
import { generateCSRFToken, logAudit } from './security.js';

const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

/**
 * Get user configuration from environment
 */
function getUserConfig() {
  return {
    admin: {
      username: 'admin',
      passwordHash: process.env.ADMIN_PASSWORD_HASH,
      role: 'administrator',
      displayName: 'Admin'
    },
    lee: {
      username: 'lee',
      passwordHash: process.env.LEE_PASSWORD_HASH,
      role: 'editor',
      displayName: 'Lee'
    }
  };
}

/**
 * Check if account is locked (database-backed)
 */
function isAccountLocked(username) {
  const db = connectToDatabase();
  const now = Date.now();

  try {
    const attempt = db.prepare(
      'SELECT * FROM login_attempts WHERE username = ?'
    ).get(username);

    if (!attempt) return false;

    if (attempt.attempt_count >= MAX_ATTEMPTS && attempt.locked_until) {
      if (now < attempt.locked_until) {
        const remaining = Math.ceil((attempt.locked_until - now) / 60000);
        console.log(`[AUTH] ⏱️  Account ${username} locked. ${remaining} minutes remaining.`);
        return true;
      } else {
        // Lockout expired, reset
        db.prepare(
          'UPDATE login_attempts SET attempt_count = 0, locked_until = NULL WHERE username = ?'
        ).run(username);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('[AUTH] Error checking lockout:', error);
    return false;
  }
}

/**
 * Record failed login attempt (database-backed)
 */
function recordFailedAttempt(username, ipAddress = null) {
  const db = connectToDatabase();
  const now = Date.now();

  try {
    const existing = db.prepare(
      'SELECT * FROM login_attempts WHERE username = ?'
    ).get(username);

    if (!existing) {
      db.prepare(
        'INSERT INTO login_attempts (username, attempt_count, last_attempt) VALUES (?, 1, ?)'
      ).run(username, now);
    } else {
      const newCount = existing.attempt_count + 1;
      const lockedUntil = newCount >= MAX_ATTEMPTS ? now + LOCKOUT_DURATION : null;

      db.prepare(
        'UPDATE login_attempts SET attempt_count = ?, last_attempt = ?, locked_until = ? WHERE username = ?'
      ).run(newCount, now, lockedUntil, username);

      if (newCount >= MAX_ATTEMPTS) {
        console.log(`[AUTH] 🔒 Account ${username} locked after ${newCount} failed attempts`);

        // Log lockout event
        logAudit({
          username,
          action: 'ACCOUNT_LOCKED',
          entityType: 'auth',
          ipAddress
        });
      }
    }
  } catch (error) {
    console.error('[AUTH] Error recording failed attempt:', error);
  }
}

/**
 * Clear failed attempts on successful login
 */
function clearFailedAttempts(username) {
  const db = connectToDatabase();

  try {
    db.prepare(
      'UPDATE login_attempts SET attempt_count = 0, locked_until = NULL WHERE username = ?'
    ).run(username);
  } catch (error) {
    console.error('[AUTH] Error clearing attempts:', error);
  }
}

/**
 * Validate username and password
 */
export async function validateCredentials(username, password, ipAddress = null) {
  if (!username || !password) {
    console.log('[AUTH] ❌ Authentication failed: Missing username or password');
    return null;
  }

  // Check if account is locked
  if (isAccountLocked(username)) {
    return null;
  }

  const users = getUserConfig();
  const userConfig = users[username.toLowerCase()];

  if (!userConfig) {
    console.log(`[AUTH] ❌ Authentication failed: User "${username}" not found`);
    recordFailedAttempt(username, ipAddress);
    return null;
  }

  if (!userConfig.passwordHash) {
    console.error(`[AUTH] ❌ No password hash configured for user: ${username}`);
    return null;
  }

  try {
    const isValid = await argon2.verify(userConfig.passwordHash, password);

    if (isValid) {
      clearFailedAttempts(username);
      console.log(`[AUTH] ✅ Authentication successful for user: ${userConfig.displayName} (${username})`);

      // Log successful login
      logAudit({
        username: userConfig.username,
        action: 'LOGIN_SUCCESS',
        entityType: 'auth',
        ipAddress
      });

      return {
        username: userConfig.username,
        role: userConfig.role,
        displayName: userConfig.displayName
      };
    } else {
      console.log(`[AUTH] ❌ Authentication failed: Invalid password for user "${username}"`);
      recordFailedAttempt(username, ipAddress);

      // Log failed login
      logAudit({
        username,
        action: 'LOGIN_FAILED',
        entityType: 'auth',
        ipAddress
      });

      return null;
    }
  } catch (error) {
    console.error('[AUTH] ❌ Error verifying password:', error.message);
    return null;
  }
}

/**
 * Create persistent session with CSRF token
 */
export function createSession(userInfo, ipAddress = null, userAgent = null) {
  const db = connectToDatabase();
  const sessionId = randomUUID();
  const csrfToken = generateCSRFToken();
  const now = Math.floor(Date.now() / 1000);

  const sessionData = {
    authenticated: true,
    user: {
      username: userInfo.username,
      role: userInfo.role,
      displayName: userInfo.displayName
    },
    sessionId,
    csrfToken,
    timestamp: Date.now()
  };

  try {
    // Store session in database
    db.prepare(
      `INSERT INTO sessions (session_id, username, created_at, last_activity, ip_address, user_agent, csrf_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(sessionId, userInfo.username, now, now, ipAddress, userAgent, csrfToken);

    console.log(`[AUTH] 📝 Created session for: ${userInfo.displayName} (${sessionId})`);

    return sessionData;
  } catch (error) {
    console.error('[AUTH] Error creating session:', error);
    return null;
  }
}

/**
 * Verify and update session with rotation
 */
export function verifySession(sessionId, shouldRotate = false) {
  if (!sessionId) return null;

  const db = connectToDatabase();
  const maxAge = parseInt(process.env.SESSION_MAX_AGE || '86400000') / 1000; // Convert to seconds
  const rotationInterval = 3600; // Rotate session every hour (3600 seconds)
  const now = Math.floor(Date.now() / 1000);

  try {
    const session = db.prepare(
      'SELECT * FROM sessions WHERE session_id = ?'
    ).get(sessionId);

    if (!session) return null;

    // Check if session is expired
    if (now - session.last_activity > maxAge) {
      // Delete expired session
      db.prepare('DELETE FROM sessions WHERE session_id = ?').run(sessionId);
      console.log('[AUTH] Session expired and deleted');
      return null;
    }

    // Check if session should be rotated (every hour)
    const sessionAge = now - session.created_at;
    const needsRotation = shouldRotate || (sessionAge > rotationInterval && (sessionAge % rotationInterval) < 60);

    let newSessionId = session.session_id;
    if (needsRotation) {
      newSessionId = randomUUID();
      // Update session ID while preserving all other data
      db.prepare(
        'UPDATE sessions SET session_id = ?, created_at = ? WHERE session_id = ?'
      ).run(newSessionId, now, sessionId);
      console.log(`[AUTH] 🔄 Session rotated: ${sessionId.substring(0, 8)}... → ${newSessionId.substring(0, 8)}...`);
    } else {
      // Just update last activity
      db.prepare(
        'UPDATE sessions SET last_activity = ? WHERE session_id = ?'
      ).run(now, sessionId);
    }

    // Get user config to retrieve role
    const users = getUserConfig();
    const userConfig = users[session.username.toLowerCase()];

    // Return session data with CSRF token
    return {
      authenticated: true,
      user: {
        username: session.username,
        role: userConfig?.role || 'editor',
        displayName: userConfig?.displayName || session.username
      },
      sessionId: newSessionId,
      csrfToken: session.csrf_token,
      timestamp: session.created_at * 1000,
      rotated: needsRotation
    };
  } catch (error) {
    console.error('[AUTH] Error verifying session:', error);
    return null;
  }
}

/**
 * Destroy session
 */
export function destroySession(sessionId) {
  const db = connectToDatabase();

  try {
    const session = db.prepare('SELECT username FROM sessions WHERE session_id = ?').get(sessionId);

    if (session) {
      db.prepare('DELETE FROM sessions WHERE session_id = ?').run(sessionId);

      logAudit({
        username: session.username,
        action: 'LOGOUT',
        entityType: 'auth'
      });

      console.log(`[AUTH] Session destroyed: ${sessionId}`);
    }

    return true;
  } catch (error) {
    console.error('[AUTH] Error destroying session:', error);
    return false;
  }
}

/**
 * Set session cookie
 */
export function setSessionCookie(response, sessionData) {
  const maxAge = parseInt(process.env.SESSION_MAX_AGE || '86400000');

  response.headers.append(
    'Set-Cookie',
    `admin_session=${sessionData.sessionId}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge / 1000}`
  );

  return response;
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(response) {
  response.headers.append(
    'Set-Cookie',
    'admin_session=; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=0'
  );

  return response;
}

/**
 * Hash password (for generating new hashes)
 */
export async function hashPassword(password) {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4
  });
}
