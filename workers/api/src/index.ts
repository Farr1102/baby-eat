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
import { handleRegister, handleLogin, handleMe, handleLogout } from './handlers/auth';
import { isPublicPath, authMiddleware } from './auth';

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
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
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

    // Auth middleware
    const userId = await authMiddleware(env, request);
    if (userId === null && !isPublicPath(path)) {
      return corsJson({ error: 'Unauthorized' }, 401);
    }

    const body = method === 'GET' || method === 'DELETE' ? null : await request.text();

    try {
      const handle = async (handler: () => Promise<Response>) => {
        const res = await handler();
        const newHeaders = new Headers(res.headers);
        for (const [key, value] of Object.entries(corsHeaders())) {
          newHeaders.set(key, value);
        }
        return new Response(res.body, { status: res.status, headers: newHeaders });
      };

      // --- Auth routes (public) ---
      if (path === '/api/auth/register' && method === 'POST') {
        return handle(() => handleRegister(env, body));
      }
      if (path === '/api/auth/login' && method === 'POST') {
        return handle(() => handleLogin(env, body));
      }

      // --- Auth routes (protected) ---
      if (path === '/api/auth/me' && method === 'GET') {
        return handle(() => handleMe(env, body, userId!));
      }
      if (path === '/api/auth/logout' && method === 'POST') {
        return handle(() => handleLogout(env, body, userId!));
      }

      // --- Health / Doc ---
      if (path === '/api/hello') {
        return handle(() => Promise.resolve(new Response('Hello World!')));
      }
      if (path === '/api/doc') {
        return handle(() => Promise.resolve(json({ openapi: '3.0.0', info: { title: 'Baby Eat API', version: '1.0.0' } })));
      }

      // /api/baby/:id — GET
      const babyIdMatch = path.match(/^\/api\/baby\/(\d+)$/);
      if (babyIdMatch && method === 'GET') {
        return handle(() => handleGetBaby(env, babyIdMatch[1], userId!));
      }
      if (path === '/api/baby') {
        if (method === 'POST') return handle(() => handleCreateBaby(env, body, userId!));
        if (method === 'PATCH') return handle(() => handleUpdateBaby(env, body, userId!));
      }

      // /api/event — GET, POST, PATCH
      if (path === '/api/event') {
        if (method === 'GET') return handle(() => handleGetEvents(env));
        if (method === 'POST') return handle(() => handleCreateEvent(env, body));
        if (method === 'PATCH') return handle(() => handleUpdateEvent(env, body));
      }

      // /api/event-log/distinct — GET
      if (path === '/api/event-log/distinct' && method === 'GET') {
        return handle(() => handleGetEventLogDistinct(env, url, userId!));
      }
      const eventLogIdMatch = path.match(/^\/api\/event-log\/(\d+)$/);
      if (eventLogIdMatch && method === 'DELETE') {
        return handle(() => handleDeleteEventLog(env, eventLogIdMatch[1], userId!));
      }
      if (path === '/api/event-log') {
        if (method === 'GET') return handle(() => handleGetEventLog(env, url, userId!));
        if (method === 'POST') return handle(() => handleCreateEventLog(env, body, userId!));
        if (method === 'PATCH') return handle(() => handleUpdateEventLog(env, body, userId!));
      }

      // /api/moment — GET, POST, PUT
      if (path === '/api/moment') {
        if (method === 'GET') return handle(() => handleGetMoments(env, url, userId!));
        if (method === 'POST') return handle(() => handleCreateMoment(env, body, userId!));
        if (method === 'PUT') return handle(() => handleUpdateMoment(env, body, userId!));
      }
      const momentIdMatch = path.match(/^\/api\/moment\/(\d+)$/);
      if (momentIdMatch && method === 'DELETE') {
        return handle(() => handleDeleteMoment(env, momentIdMatch[1], userId!));
      }

      // /api/bucket/:name — GET
      const bucketNameMatch = path.match(/^\/api\/bucket\/(.+)$/);
      if (bucketNameMatch && method === 'GET') {
        return handle(() => handleGetBucket(env, bucketNameMatch[1]));
      }
      if (path === '/api/bucket' && method === 'POST') {
        return handle(() => handleCreateBucket(env, body));
      }

      // Upload / Compress / Hello
      if (path === '/api/upload' && method === 'POST') {
        return handle(() => handleUpload());
      }
      if (path === '/api/compress' && method === 'POST') {
        return handle(() => handleCompress());
      }
      if (path === '/api/compress-old' && method === 'POST') {
        return handle(() => handleCompressOld());
      }
      if (path === '/api/hello/gemini-pro' && method === 'POST') {
        return handle(() => handleHelloGeminiPro());
      }
      if (path === '/api/hello/photon' && method === 'POST') {
        return handle(() => handleHelloPhoton());
      }

      return corsJson({ error: 'Not Found' }, 404);
    } catch (err) {
      return corsJson({ error: 'Internal Server Error' }, 500);
    }
  },
};
