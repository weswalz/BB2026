import { getAllEvents, getEventBySlug } from '../../lib/database.js';
import { getClientIP, checkRateLimit } from '../../lib/security.js';

export async function GET({ url, request }) {
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

    // Parse query parameters
    const searchParams = url.searchParams;
    const status = searchParams.get('status') || 'upcoming';
    const limit = parseInt(searchParams.get('limit')) || 10;
    const slug = searchParams.get('slug');
    
    let events;
    
    if (slug) {
      // Get single event by slug
      const event = getEventBySlug(slug);
      events = event ? [event] : [];
    } else {
      // Get all events and filter
      const allEvents = getAllEvents();
      
      // Filter by status if not 'all'
      events = status === 'all' 
        ? allEvents 
        : allEvents.filter(event => event.status === status);
      
      // Apply limit
      events = events.slice(0, limit);
    }
    
    return new Response(JSON.stringify(events), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('Events API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}