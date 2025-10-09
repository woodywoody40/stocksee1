// cloudflare-worker.js

/**
 * A map of allowed origins. Use '*' for development or to allow all origins.
 * For production, it's better to restrict this to your app's domain.
 * @type {string}
 */
const ALLOWED_ORIGIN = '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function handleOptions(request) {
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS preflight requests.
    return new Response(null, {
      headers: corsHeaders,
    });
  } else {
    // Handle non-CORS options requests.
    return new Response(null, {
      headers: {
        Allow: 'GET, HEAD, POST, OPTIONS',
      },
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Please provide a target URL in the "url" query parameter.', { status: 400, headers: corsHeaders });
    }

    // Use Cloudflare's cache to store responses.
    const cache = caches.default;
    // We use the target URL as the cache key.
    const cacheKey = new Request(targetUrl, { method: 'GET' });
    let response = await cache.match(cacheKey);

    if (response) {
      // Return cached response with fresh CORS headers.
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      newHeaders.set('X-Proxy-Cache', 'HIT');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    // Fetch from the target URL.
    const originResponse = await fetch(targetUrl, {
        headers: {
            // Some APIs might require a user-agent.
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    // Make the response mutable.
    response = new Response(originResponse.body, originResponse);
    
    // Set CORS headers.
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    response.headers.set('X-Proxy-Cache', 'MISS');

    // Cache the response. For stock data, a short TTL is appropriate.
    // For historical/daily data, this could be longer, but a single TTL is simpler here.
    if (response.status === 200) {
      response.headers.set('Cache-Control', 'public, max-age=15');
      // Use waitUntil to cache response without blocking the return to the client.
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }
    
    return response;
  },
};
