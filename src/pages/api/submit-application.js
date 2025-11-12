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

    console.log('New application submitted:', data);

    // In a real application, you would save this to a database, send an email, etc.
    // For now, we'll just return a success message.

    return new Response(JSON.stringify({ message: 'Application submitted successfully!' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return new Response(JSON.stringify({ message: 'Failed to submit application.' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
