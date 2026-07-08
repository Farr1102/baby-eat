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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;
    const body = method === 'GET' || method === 'DELETE' ? null : await request.text();

    try {
      // /api/hello (local Nitro health check — keep it alive)
      if (path === '/api/hello') {
        return new Response('Hello World!');
      }

      // /api/doc — OpenAPI spec (for orval, mostly a health indicator)
      if (path === '/api/doc') {
        return json({ openapi: '3.0.0', info: { title: 'Baby Eat API', version: '1.0.0' } });
      }

      // /api/baby/:id — GET
      const babyIdMatch = path.match(/^\/api\/baby\/(\d+)$/);
      if (babyIdMatch && method === 'GET') {
        return handleGetBaby(env, babyIdMatch[1]);
      }

      // /api/baby — POST, PATCH
      if (path === '/api/baby') {
        if (method === 'POST') return handleCreateBaby(env, body);
        if (method === 'PATCH') return handleUpdateBaby(env, body);
      }

      // /api/event — GET, POST, PATCH
      if (path === '/api/event') {
        if (method === 'GET') return handleGetEvents(env);
        if (method === 'POST') return handleCreateEvent(env, body);
        if (method === 'PATCH') return handleUpdateEvent(env, body);
      }

      // /api/event-log/distinct — GET (must be before /api/event-log/:id)
      if (path === '/api/event-log/distinct' && method === 'GET') {
        return handleGetEventLogDistinct(env, url);
      }

      // /api/event-log/:id — DELETE
      const eventLogIdMatch = path.match(/^\/api\/event-log\/(\d+)$/);
      if (eventLogIdMatch && method === 'DELETE') {
        return handleDeleteEventLog(env, eventLogIdMatch[1]);
      }

      // /api/event-log — GET, POST, PATCH
      if (path === '/api/event-log') {
        if (method === 'GET') return handleGetEventLog(env, url);
        if (method === 'POST') return handleCreateEventLog(env, body);
        if (method === 'PATCH') return handleUpdateEventLog(env, body);
      }

      // /api/moment — GET, POST, PUT
      if (path === '/api/moment') {
        if (method === 'GET') return handleGetMoments(env, url);
        if (method === 'POST') return handleCreateMoment(env, body);
        if (method === 'PUT') return handleUpdateMoment(env, body);
      }

      // /api/moment/:id — DELETE
      const momentIdMatch = path.match(/^\/api\/moment\/(\d+)$/);
      if (momentIdMatch && method === 'DELETE') {
        return handleDeleteMoment(env, momentIdMatch[1]);
      }

      // /api/bucket/:name — GET
      const bucketNameMatch = path.match(/^\/api\/bucket\/(.+)$/);
      if (bucketNameMatch && method === 'GET') {
        return handleGetBucket(env, bucketNameMatch[1]);
      }

      // /api/bucket — POST
      if (path === '/api/bucket' && method === 'POST') {
        return handleCreateBucket(env, body);
      }

      // /api/upload — POST
      if (path === '/api/upload' && method === 'POST') {
        return handleUpload();
      }

      // /api/compress — POST
      if (path === '/api/compress' && method === 'POST') {
        return handleCompress();
      }

      // /api/compress-old — POST
      if (path === '/api/compress-old' && method === 'POST') {
        return handleCompressOld();
      }

      // /api/hello/gemini-pro — POST
      if (path === '/api/hello/gemini-pro' && method === 'POST') {
        return handleHelloGeminiPro();
      }

      // /api/hello/photon — POST
      if (path === '/api/hello/photon' && method === 'POST') {
        return handleHelloPhoton();
      }

      return json({ error: 'Not Found' }, 404);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      return json({ error: message }, 500);
    }
  },
};
