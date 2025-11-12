import { getAllFighters } from '../../lib/fighters.js';
import { getClientIP, checkRateLimit } from '../../lib/security.js';

export async function GET({ request }) {
  try {
    // Check rate limit
    const ipAddress = getClientIP(request);
    const rateCheck = checkRateLimit(ipAddress, 'api');

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

    const fighters = await getAllFighters();
    return new Response(JSON.stringify(fighters), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching fighters:', error);
    return new Response(JSON.stringify({ message: 'Error fetching fighters' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
