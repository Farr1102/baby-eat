import { json, noContent, Env } from './utils';
import { handleGetBaby, handleCreateBaby, handleUpdateBaby } from './handlers/baby';
import { handleGetEvents, handleCreateEvent, handleUpdateEvent } from './handlers/event';
import {
  handleGetEventLog,
  handleGetEventLogDistinct,
  handleCreateEventLog,
  handleUpdateEventLog,
  handleDeleteEventLog,
} from './handlers/event-log';
import { handleGetMoments, handleCreateMoment, handleUpdateMoment, handleDeleteMoment } from './handlers/moment';
import { handleGetBucket, handleCreateBucket } from './handlers/bucket';
import { handleUpload } from './handlers/upload';
import { handleCompress, handleCompressOld } from './handlers/compress';
import { handleHelloGeminiPro, handleHelloPhoton } from './handlers/hello';

export { Env };

const ALLOW_ORIGINS = '*';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOW_ORIGINS,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function corsJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

function corsNoContent() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const body = method === 'GET' || method === 'DELETE' ? null : await request.text();

    try {
      // Helper: wrap handler response with CORS headers
      const handle = async (handler: () => Promise<Response>) => {
        const res = await handler();
        // Add CORS headers to existing response
        const newHeaders = new Headers(res.headers);
        for (const [key, value] of Object.entries(corsHeaders())) {
          newHeaders.set(key, value);
        }
        return new Response(res.body, { status: res.status, headers: newHeaders });
      };

      // /api/hello (local Nitro health check — keep it alive)
      if (path === '/api/hello') {
        return handle(() => Promise.resolve(new Response('Hello World!')));
      }

      // /api/doc — OpenAPI spec
      if (path === '/api/doc') {
        return handle(() => Promise.resolve(json({ openapi: '3.0.0', info: { title: 'Baby Eat API', version: '1.0.0' } })));
      }

      // /api/baby/:id — GET
      const babyIdMatch = path.match(/^\/api\/baby\/(\d+)$/);
      if (babyIdMatch && method === 'GET') {
        return handle(() => handleGetBaby(env, babyIdMatch[1]));
      }

      // /api/baby — POST, PATCH
      if (path === '/api/baby') {
        if (method === 'POST') return handle(() => handleCreateBaby(env, body));
        if (method === 'PATCH') return handle(() => handleUpdateBaby(env, body));
      }

      // /api/event — GET, POST, PATCH
      if (path === '/api/event') {
        if (method === 'GET') return handle(() => handleGetEvents(env));
        if (method === 'POST') return handle(() => handleCreateEvent(env, body));
        if (method === 'PATCH') return handle(() => handleUpdateEvent(env, body));
      }

      // /api/event-log/distinct — GET
      if (path === '/api/event-log/distinct' && method === 'GET') {
        return handle(() => handleGetEventLogDistinct(env, url));
      }

      // /api/event-log/:id — DELETE
      const eventLogIdMatch = path.match(/^\/api\/event-log\/(\d+)$/);
      if (eventLogIdMatch && method === 'DELETE') {
        return handle(() => handleDeleteEventLog(env, eventLogIdMatch[1]));
      }

      // /api/event-log — GET, POST, PATCH
      if (path === '/api/event-log') {
        if (method === 'GET') return handle(() => handleGetEventLog(env, url));
        if (method === 'POST') return handle(() => handleCreateEventLog(env, body));
        if (method === 'PATCH') return handle(() => handleUpdateEventLog(env, body));
      }

      // /api/moment — GET, POST, PUT
      if (path === '/api/moment') {
        if (method === 'GET') return handle(() => handleGetMoments(env, url));
        if (method === 'POST') return handle(() => handleCreateMoment(env, body));
        if (method === 'PUT') return handle(() => handleUpdateMoment(env, body));
      }

      // /api/moment/:id — DELETE
      const momentIdMatch = path.match(/^\/api\/moment\/(\d+)$/);
      if (momentIdMatch && method === 'DELETE') {
        return handle(() => handleDeleteMoment(env, momentIdMatch[1]));
      }

      // /api/bucket/:name — GET
      const bucketNameMatch = path.match(/^\/api\/bucket\/(.+)$/);
      if (bucketNameMatch && method === 'GET') {
        return handle(() => handleGetBucket(env, bucketNameMatch[1]));
      }

      // /api/bucket — POST
      if (path === '/api/bucket' && method === 'POST') {
        return handle(() => handleCreateBucket(env, body));
      }

      // /api/upload — POST
      if (path === '/api/upload' && method === 'POST') {
        return handle(() => handleUpload());
      }

      // /api/compress — POST
      if (path === '/api/compress' && method === 'POST') {
        return handle(() => handleCompress());
      }

      // /api/compress-old — POST
      if (path === '/api/compress-old' && method === 'POST') {
        return handle(() => handleCompressOld());
      }

      // /api/hello/gemini-pro — POST
      if (path === '/api/hello/gemini-pro' && method === 'POST') {
        return handle(() => handleHelloGeminiPro());
      }

      // /api/hello/photon — POST
      if (path === '/api/hello/photon' && method === 'POST') {
        return handle(() => handleHelloPhoton());
      }

      return corsJson({ error: 'Not Found' }, 404);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      return corsJson({ error: message }, 500);
    }
  },
};
