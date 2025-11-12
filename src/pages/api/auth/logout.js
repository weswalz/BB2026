// BiYu Boxing Admin - Logout Endpoint

import { clearSessionCookie } from '../../../lib/auth.js';
import { getClientIP, checkRateLimit } from '../../../lib/security.js';

export async function GET({ redirect, cookies, request }) {
  // Check rate limit
  const ipAddress = getClientIP(request);
  const rateCheck = checkRateLimit(ipAddress, 'auth');

  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ message: rateCheck.message }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateCheck.retryAfter.toString()
        }
      }
    );
  }

  const response = new Response(null, {
    status: 302,
    headers: {
      'Location': '/'
    }
  });

  clearSessionCookie(response);
  return response;
}

export async function POST({ redirect, cookies, request }) {
  return GET({ redirect, cookies, request });
}
