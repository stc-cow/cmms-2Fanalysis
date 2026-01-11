// Simplified API handler - no serverless-http
require('dotenv').config();

console.log('[API] Handler loaded, environment variables:', {
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID ? 'SET' : 'MISSING',
  GOOGLE_SHEET_GID: process.env.GOOGLE_SHEET_GID ? 'SET' : 'MISSING',
  NODE_ENV: process.env.NODE_ENV,
});

exports.handler = async (event, context) => {
  try {
    const { path: eventPath, httpMethod, body } = event;
    
    console.log(`[API] ${httpMethod} ${eventPath}`);

    // Simple ping endpoint
    if (eventPath === '/api/ping' || eventPath === '/.netlify/functions/api/ping') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'pong',
          timestamp: new Date().toISOString(),
          path: eventPath,
        }),
      };
    }

    // Data routes - temporary stub
    if (eventPath.includes('/api/data/')) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movements: [],
          cows: [],
          locations: [],
          events: [],
          source: 'api.js handler',
        }),
      };
    }

    // Catch all
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Not found',
        path: eventPath,
      }),
    };
  } catch (error) {
    console.error('[API] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: String(error),
      }),
    };
  }
};
