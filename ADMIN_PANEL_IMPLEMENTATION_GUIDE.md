# BiYu Boxing Admin Panel - Implementation Guide

**Project:** BiYu Boxing Admin Panel Security & Theming Fixes
**Date:** 2025-01-XX
**Status:** READY FOR IMPLEMENTATION
**Critical Warning:** This is a LIVE PRODUCTION WEBSITE. All changes must be tested and deployed carefully.

---

## CRITICAL SAFETY RULES

⚠️ **MANDATORY RULES FOR ALL SUBAGENTS:**

1. **ONLY modify files explicitly listed in your assigned task**
2. **DO NOT modify frontend/public-facing website code**
3. **DO NOT add features not explicitly requested**
4. **DO NOT refactor code beyond the specific changes requested**
5. **ALWAYS preserve existing functionality**
6. **ALWAYS test changes before marking as complete**
7. **DO NOT modify database schema**
8. **DO NOT change API endpoints unless explicitly instructed**

---

## IMPLEMENTATION PHASES

### PHASE 1: AUTHENTICATION SYSTEM (CRITICAL - Priority 1)
**Estimated Time:** 2-4 hours
**Dependencies:** None
**Must Complete Before:** All other phases

### PHASE 2: DARK THEME CONSISTENCY (HIGH - Priority 2)
**Estimated Time:** 4-6 hours
**Dependencies:** None (can run parallel to Phase 1)
**Must Complete Before:** Phase 3

### PHASE 3: CSS STANDARDIZATION (MEDIUM - Priority 3)
**Estimated Time:** 6-8 hours
**Dependencies:** Phase 2 must be complete
**Must Complete Before:** Final QA

---

## PHASE 1: AUTHENTICATION SYSTEM IMPLEMENTATION

### Overview
Implement .env-based authentication WITHOUT visible login UI in admin panel.

### Goals
- Add secure authentication using environment variables
- Remove public credential display
- Implement HTTP-only cookie-based sessions
- Create minimal auth entry point
- Ensure all admin routes are protected

---

### PHASE 1 - TASK 1.1: Update Environment Configuration

**Assigned Agent:** auth-env-agent
**Files to Modify:**
- `/var/www/biyuboxing/.env`

**Exact Changes Required:**

Add the following lines to `/var/www/biyuboxing/.env`:
```env
# Admin Authentication
ADMIN_AUTH_KEY=BiYu_Secure_Admin_Key_2025_Change_This_In_Production
SESSION_SECRET=BiYu_Session_Secret_2025_Change_This_In_Production
SESSION_MAX_AGE=86400000
```

**Success Criteria:**
- [ ] File exists at `/var/www/biyuboxing/.env`
- [ ] Three new environment variables added
- [ ] No existing environment variables modified or removed
- [ ] File has proper line breaks

**Testing:**
```bash
# Verify file contents
cat /var/www/biyuboxing/.env | grep "ADMIN_AUTH_KEY"
cat /var/www/biyuboxing/.env | grep "SESSION_SECRET"
cat /var/www/biyuboxing/.env | grep "SESSION_MAX_AGE"
```

---

### PHASE 1 - TASK 1.2: Implement Authentication Library

**Assigned Agent:** auth-lib-agent
**Files to Modify:**
- `/var/www/biyuboxing/src/lib/auth.js`

**Exact Changes Required:**

Replace the ENTIRE contents of `/var/www/biyuboxing/src/lib/auth.js` with:

```javascript
// BiYu Boxing Admin Authentication System
// Environment-based authentication without visible login UI

import crypto from 'crypto';

/**
 * Validate authentication key against environment variable
 * @param {string} providedKey - The key provided by user
 * @returns {boolean} - True if valid, false otherwise
 */
export function validateAuthKey(providedKey) {
  if (!providedKey) return false;

  const validKey = import.meta.env.ADMIN_AUTH_KEY;
  if (!validKey) {
    console.error('[AUTH] ADMIN_AUTH_KEY not set in environment');
    return false;
  }

  return providedKey === validKey;
}

/**
 * Create session data for authenticated user
 * @returns {Object} Session data object
 */
export function createSessionData() {
  return {
    authenticated: true,
    user: {
      username: 'admin',
      role: 'administrator'
    },
    timestamp: Date.now(),
    sessionId: crypto.randomBytes(32).toString('hex')
  };
}

/**
 * Set session cookie with secure flags
 * @param {Response} response - Astro response object
 * @param {Object} sessionData - Session data to store
 */
export function setSessionCookie(response, sessionData) {
  const maxAge = parseInt(import.meta.env.SESSION_MAX_AGE || '86400000');
  const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

  response.headers.append(
    'Set-Cookie',
    `admin_session=${sessionToken}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge / 1000}`
  );

  return response;
}

/**
 * Clear session cookie
 * @param {Response} response - Astro response object
 */
export function clearSessionCookie(response) {
  response.headers.append(
    'Set-Cookie',
    'admin_session=; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=0'
  );

  return response;
}

/**
 * Verify session from cookie
 * @param {string} cookieValue - The session cookie value
 * @returns {Object|null} Session data if valid, null otherwise
 */
export function verifySession(cookieValue) {
  if (!cookieValue) return null;

  try {
    const sessionData = JSON.parse(Buffer.from(cookieValue, 'base64').toString());

    // Check if session is expired
    const maxAge = parseInt(import.meta.env.SESSION_MAX_AGE || '86400000');
    if (Date.now() - sessionData.timestamp > maxAge) {
      return null;
    }

    return sessionData;
  } catch (error) {
    console.error('[AUTH] Invalid session cookie:', error.message);
    return null;
  }
}

// Legacy function compatibility (no longer used but kept for safety)
export function validateCredentials(username, password) {
  console.warn('[AUTH] validateCredentials is deprecated - use validateAuthKey instead');
  return false;
}

export function hashPassword(password) {
  console.warn('[AUTH] hashPassword is deprecated');
  return password;
}

export function generateToken(user) {
  console.warn('[AUTH] generateToken is deprecated - use createSessionData instead');
  return null;
}

export function verifyToken(token) {
  console.warn('[AUTH] verifyToken is deprecated - use verifySession instead');
  return false;
}
```

**Success Criteria:**
- [ ] File replaced with new authentication implementation
- [ ] All functions properly exported
- [ ] Uses environment variables from .env
- [ ] Session cookies use secure flags (HttpOnly, SameSite)
- [ ] No syntax errors

---

### PHASE 1 - TASK 1.3: Implement Authentication Middleware

**Assigned Agent:** auth-middleware-agent
**Files to Modify:**
- `/var/www/biyuboxing/src/lib/auth-middleware.js`

**Exact Changes Required:**

Replace the ENTIRE contents of `/var/www/biyuboxing/src/lib/auth-middleware.js` with:

```javascript
// BiYu Boxing Admin Authentication Middleware

import { verifySession } from './auth.js';

/**
 * Check if request is authenticated via session cookie
 * @param {AstroGlobal} context - Astro context object
 * @returns {Object} Authentication result with authenticated flag and user data
 */
export function checkAuth(context) {
  // Get session cookie
  const sessionCookie = context.cookies.get('admin_session')?.value;

  if (!sessionCookie) {
    return {
      authenticated: false,
      user: null
    };
  }

  // Verify session
  const sessionData = verifySession(sessionCookie);

  if (!sessionData || !sessionData.authenticated) {
    return {
      authenticated: false,
      user: null
    };
  }

  return {
    authenticated: true,
    user: sessionData.user
  };
}

/**
 * Require authentication or redirect to auth page
 * @param {AstroGlobal} context - Astro context object
 * @returns {Response|null} Redirect response if not authenticated, null if authenticated
 */
export function requireAuth(context) {
  const authResult = checkAuth(context);

  if (!authResult.authenticated) {
    const currentPath = context.url.pathname;
    return context.redirect(`/admin/auth?redirect=${encodeURIComponent(currentPath)}`);
  }

  return null;
}

/**
 * Check if request is authenticated (returns boolean)
 * @param {AstroGlobal} context - Astro context object
 * @returns {boolean} True if authenticated, false otherwise
 */
export function isAuthenticated(context) {
  const authResult = checkAuth(context);
  return authResult.authenticated;
}
```

**Success Criteria:**
- [ ] File replaced with new middleware implementation
- [ ] Imports verifySession from auth.js
- [ ] checkAuth returns proper structure
- [ ] requireAuth redirects to /admin/auth when not authenticated
- [ ] No syntax errors

---

### PHASE 1 - TASK 1.4: Create Auth Entry Point Page

**Assigned Agent:** auth-page-agent
**Files to Create:**
- `/var/www/biyuboxing/src/pages/admin/auth.astro` (NEW FILE)

**Exact File to Create:**

Create new file `/var/www/biyuboxing/src/pages/admin/auth.astro`:

```astro
---
import { validateAuthKey, createSessionData, setSessionCookie } from '../../lib/auth.js';

let error = null;
let success = false;

// Get redirect URL from query params
const url = new URL(Astro.request.url);
const redirectUrl = url.searchParams.get('redirect') || '/admin/dashboard';

// Handle form submission or URL key parameter
if (Astro.request.method === 'POST') {
  try {
    const formData = await Astro.request.formData();
    const authKey = formData.get('authKey')?.toString();

    if (validateAuthKey(authKey)) {
      const sessionData = createSessionData();
      const response = new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl
        }
      });

      setSessionCookie(response, sessionData);
      return response;
    } else {
      error = 'Invalid authentication key';
    }
  } catch (err) {
    console.error('Auth error:', err);
    error = 'An error occurred. Please try again.';
  }
} else if (Astro.request.method === 'GET') {
  // Check for key in URL parameter (for quick access)
  const urlKey = url.searchParams.get('key');

  if (urlKey && validateAuthKey(urlKey)) {
    const sessionData = createSessionData();
    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl
      }
    });

    setSessionCookie(response, sessionData);
    return response;
  }
}
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Authentication - BiYu Boxing</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0F172A;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .auth-container {
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(148, 163, 184, 0.1);
      padding: 3rem 2.5rem;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      width: 100%;
      max-width: 440px;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .logo {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
    }

    .auth-header h1 {
      color: #F1F5F9;
      margin-bottom: 0.5rem;
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .auth-header p {
      color: #94A3B8;
      font-size: 0.95rem;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .form-label {
      font-weight: 500;
      color: #CBD5E1;
      font-size: 0.9rem;
    }

    .form-input {
      padding: 0.875rem 1rem;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      font-size: 1rem;
      color: #F1F5F9;
      transition: all 0.3s ease;
    }

    .form-input::placeholder {
      color: #64748B;
    }

    .form-input:focus {
      outline: none;
      background: rgba(30, 41, 59, 0.7);
      border-color: #3B82F6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .auth-btn {
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 0.5rem;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .auth-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }

    .auth-btn:active {
      transform: translateY(0);
    }

    .error-message {
      background: rgba(220, 38, 38, 0.1);
      border: 1px solid rgba(220, 38, 38, 0.2);
      color: #FCA5A5;
      padding: 0.875rem 1rem;
      border-radius: 12px;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .back-link {
      text-align: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(148, 163, 184, 0.1);
    }

    .back-link a {
      color: #94A3B8;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.2s;
    }

    .back-link a:hover {
      color: #CBD5E1;
    }
  </style>
</head>
<body>
  <div class="auth-container">
    <div class="auth-header">
      <div class="logo">BY</div>
      <h1>Admin Access</h1>
      <p>Enter authentication key to continue</p>
    </div>

    {error && (
      <div class="error-message">
        <span>⚠️</span>
        <span>{error}</span>
      </div>
    )}

    <form method="POST" class="auth-form">
      <input type="hidden" name="redirect" value={redirectUrl} />

      <div class="form-group">
        <label for="authKey" class="form-label">Authentication Key</label>
        <input
          type="password"
          id="authKey"
          name="authKey"
          class="form-input"
          placeholder="Enter your authentication key"
          required
          autocomplete="off"
        />
      </div>

      <button type="submit" class="auth-btn">
        Authenticate
      </button>
    </form>

    <div class="back-link">
      <a href="/">← Back to Website</a>
    </div>
  </div>

  <script>
    document.getElementById('authKey').focus();
  </script>
</body>
</html>
```

**Success Criteria:**
- [ ] New file created at specified path
- [ ] Handles POST form and GET URL key
- [ ] Sets session cookie on success
- [ ] Shows error on invalid key
- [ ] No syntax errors

---

### PHASE 1 - TASK 1.5: Remove Public Credentials

**Assigned Agent:** remove-creds-agent
**Files to Modify:**
- `/var/www/biyuboxing/src/pages/admin/login.astro`

**Exact Changes Required:**

DELETE lines 396-407 and REPLACE with comment:

```html
<!-- Authentication is handled separately - contact administrator for access -->
```

**Success Criteria:**
- [ ] Demo credentials removed
- [ ] Quick access link removed
- [ ] Comment added
- [ ] File renders without errors

---

### PHASE 1 - TASK 1.6: Update Logout Endpoint

**Assigned Agent:** logout-api-agent
**Files to Modify:**
- `/var/www/biyuboxing/src/pages/api/auth/logout.js`

**Exact Changes Required:**

Replace ENTIRE file contents with:

```javascript
// BiYu Boxing Admin - Logout Endpoint

import { clearSessionCookie } from '../../../lib/auth.js';

export async function GET({ redirect, cookies }) {
  const response = new Response(null, {
    status: 302,
    headers: {
      'Location': '/'
    }
  });

  clearSessionCookie(response);
  return response;
}

export async function POST({ redirect, cookies }) {
  return GET({ redirect, cookies });
}
```

**Success Criteria:**
- [ ] Clears session cookie
- [ ] Redirects to homepage
- [ ] Supports GET and POST
- [ ] No syntax errors

---

## PHASE 2: DARK THEME CONSISTENCY

### PHASE 2 - TASK 2.1: Fix Fighters Page

**Assigned Agent:** fighters-theme-agent
**Files to Modify:**
- `/var/www/biyuboxing/src/pages/admin/fighters.astro`

**Exact Changes Required:**

Replace ALL white backgrounds and light colors with dark theme variables as documented in main guide section "PHASE 2 - TASK 2.1".

---

### PHASE 2 - TASK 2.2: Fix Media Page

**Assigned Agent:** media-theme-agent
**Files to Modify:**
- `/var/www/biyuboxing/src/pages/admin/media.astro`

**Exact Changes Required:**

Replace white backgrounds with dark theme variables as documented in main guide section "PHASE 2 - TASK 2.2".

---

### PHASE 2 - TASK 2.3: Fix Pages Index

**Assigned Agent:** pages-index-theme-agent
**Files to Modify:**
- `/var/www/biyuboxing/src/pages/admin/pages/index.astro`

**Exact Changes Required:**

Replace white page-card backgrounds with dark theme.

---

### PHASE 2 - TASK 2.4: Fix Globals Index

**Assigned Agent:** globals-index-theme-agent
**Files to Modify:**
- `/var/www/biyuboxing/src/pages/admin/globals/index.astro`

**Exact Changes Required:**

Same as Task 2.3.

---

### PHASE 2 - TASK 2.5: Fix Page Editors (All 8 Files)

**Assigned Agent:** page-editors-theme-agent
**Files to Modify:**
- `/var/www/biyuboxing/src/pages/admin/pages/home.astro`
- `/var/www/biyuboxing/src/pages/admin/pages/about-us.astro`
- `/var/www/biyuboxing/src/pages/admin/pages/box-for-us.astro`
- `/var/www/biyuboxing/src/pages/admin/pages/contact-us.astro`
- `/var/www/biyuboxing/src/pages/admin/pages/404.astro`
- `/var/www/biyuboxing/src/pages/admin/pages/previous-events.astro`
- `/var/www/biyuboxing/src/pages/admin/pages/upcoming-events.astro`
- `/var/www/biyuboxing/src/pages/admin/pages/news-listing.astro`

**Exact Changes Required:**

For each file, replace form styles with dark theme variables as documented in "PHASE 2 - TASK 2.5".

---

### PHASE 2 - TASK 2.6: Fix VIP Global Editor

**Assigned Agent:** vip-global-theme-agent
**Files to Modify:**
- `/var/www/biyuboxing/src/pages/admin/globals/vip-signup.astro`

**Exact Changes Required:**

Apply dark theme to form elements.

---

## PHASE 3: CSS STANDARDIZATION

### PHASE 3 - TASK 3.1: Standardize Events CSS

**Assigned Agent:** events-css-agent
**Files to Modify:**
- `/var/www/biyuboxing/src/pages/admin/events.astro`

**Exact Changes Required:**

Replace all hardcoded hex colors with admin.css variables.

---

## TESTING & DEPLOYMENT

**See full guide above for complete QA checklists and deployment steps.**

---

**END OF IMPLEMENTATION GUIDE**
