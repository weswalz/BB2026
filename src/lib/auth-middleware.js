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

  // Verify session (with automatic rotation)
  const sessionData = verifySession(sessionCookie, true);

  if (!sessionData || !sessionData.authenticated) {
    return {
      authenticated: false,
      user: null
    };
  }

  // If session was rotated, update the cookie
  if (sessionData.rotated && sessionData.sessionId !== sessionCookie) {
    const maxAge = parseInt(process.env.SESSION_MAX_AGE || '86400000') / 1000;
    context.cookies.set('admin_session', sessionData.sessionId, {
      path: '/admin',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: maxAge,
      secure: process.env.NODE_ENV === 'production'
    });
  }

  return {
    authenticated: true,
    user: sessionData.user,
    sessionData: sessionData
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

/**
 * Check if user has administrator role
 * @param {AstroGlobal} context - Astro context object
 * @returns {boolean} True if user is administrator
 */
export function isAdministrator(context) {
  const authResult = checkAuth(context);
  return authResult.authenticated && authResult.user?.role === 'administrator';
}

/**
 * Require administrator role or redirect
 * @param {AstroGlobal} context - Astro context object
 * @returns {Response|null} Redirect response if not administrator, null if authorized
 */
export function requireAdministrator(context) {
  const authResult = checkAuth(context);

  if (!authResult.authenticated) {
    return context.redirect(`/admin/auth?redirect=${encodeURIComponent(context.url.pathname)}`);
  }

  if (authResult.user?.role !== 'administrator') {
    return context.redirect('/admin/dashboard?error=unauthorized');
  }

  return null;
}
