import { getClientIP, checkRateLimit } from '../../lib/security.js';

export async function POST({ request }) {
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

    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    console.log('New VIP signup:', data);

    // In a real application, you would save this to a database, send an email, etc.
    // For now, we'll just return a success message.

    return new Response(JSON.stringify({ message: 'VIP signup successful!' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error with VIP signup:', error);
    return new Response(JSON.stringify({ message: 'Failed to sign up for VIP list.' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
