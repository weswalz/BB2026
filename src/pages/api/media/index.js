import { getAllMedia, deleteMedia } from '../../../lib/media.js';
import { getClientIP, checkRateLimit } from '../../../lib/security.js';

export const GET = async ({ request }) => {
  try {
    // Check rate limit (100 requests per minute)
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

    const media = await getAllMedia();
    return new Response(JSON.stringify(media), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    return new Response(JSON.stringify({ message: 'Failed to fetch media', error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const DELETE = async ({ request }) => {
  try {
    // Check rate limit (100 requests per minute)
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

    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ message: 'Media ID is required' }), { status: 400 });
    }

    const deleted = await deleteMedia(id);
    if (deleted) {
      // TODO: Also delete the physical file from the /public/uploads directory
      return new Response(JSON.stringify({ message: 'Media item deleted successfully' }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ message: 'Media item not found or could not be deleted' }), { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting media:', error);
    return new Response(JSON.stringify({ message: 'Failed to delete media', error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
