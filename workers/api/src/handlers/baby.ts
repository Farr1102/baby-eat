import { json, error, parseJson } from '../utils';
import type { Env } from '../utils';

const BOY_AVATAR = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#dbeafe" width="100" height="100" rx="50"/><text x="50" y="68" text-anchor="middle" font-size="52">👦</text></svg>')
const GIRL_AVATAR = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#fce7f3" width="100" height="100" rx="50"/><text x="50" y="68" text-anchor="middle" font-size="52">👧</text></svg>')

function makeAvatar(gender: number) {
  const hash = gender === 1 ? BOY_AVATAR : GIRL_AVATAR
  return {
    id: 0,
    hash,
    thumbnailHash: hash,
    mediaType: 'image/svg+xml',
    bucketName: '',
    bucket: { id: 0, name: '', domain: '', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
}

export async function handleGetBaby(env: Env, _id: string, userId: number) {
  let result: any = await env.DB.prepare(
    `SELECT id, name, gender, born_at as "bornAt",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM baby WHERE user_id = ? ORDER BY id ASC LIMIT 1`
  ).bind(userId).first();

  if (!result) {
    result = await env.DB.prepare(
      `INSERT INTO baby (name, gender, born_at, user_id, created_at, updated_at)
       VALUES (?, 0, ?, ?, datetime('now', '+8 hours'), datetime('now', '+8 hours'))
       RETURNING id, name, gender, born_at as "bornAt",
                created_at as "createdAt", updated_at as "updatedAt"`
    ).bind('宝宝', new Date().toISOString(), userId).first();
  }

  return json({ ...result, avatar: makeAvatar(result.gender) });
}

export async function handleCreateBaby(env: Env, body: string | null, userId: number) {
  const data = parseJson(body);
  if (!data || !data.name || !data.bornAt) return error('name and bornAt are required', 400);

  const result: any = await env.DB.prepare(
    `INSERT INTO baby (name, gender, born_at, user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, datetime('now', '+8 hours'), datetime('now', '+8 hours'))
     RETURNING id, name, gender, born_at as "bornAt",
              created_at as "createdAt", updated_at as "updatedAt"`
  ).bind(data.name, data.gender ?? 0, data.bornAt, userId).first();

  return json({ ...result, avatar: makeAvatar(result.gender) }, 201);
}

export async function handleUpdateBaby(env: Env, body: string | null, userId: number) {
  const data = parseJson(body);
  if (!data) return error('invalid body', 400);

  const baby: any = await env.DB.prepare(
    'SELECT id FROM baby WHERE user_id = ? ORDER BY id ASC LIMIT 1'
  ).bind(userId).first();

  if (!baby) return error('no baby found', 404);

  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.gender !== undefined) { fields.push('gender = ?'); values.push(data.gender); }
  if (data.bornAt !== undefined) { fields.push('born_at = ?'); values.push(data.bornAt); }

  if (fields.length === 0) return error('No fields to update', 400);

  fields.push('updated_at = datetime(\'now\', \'+8 hours\')');
  values.push(baby.id, userId);

  await env.DB.prepare(
    `UPDATE baby SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...values).run();

  const result: any = await env.DB.prepare(
    `SELECT id, name, gender, born_at as "bornAt",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM baby WHERE id = ? AND user_id = ?`
  ).bind(baby.id, userId).first();

  return json({ ...result, avatar: makeAvatar(result.gender) });
}
