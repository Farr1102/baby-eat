import { json, error, parseJson } from '../utils';
import type { Env } from '../utils';

const MOCK_AVATAR = {
  id: 0,
  hash: '',
  thumbnailHash: '',
  mediaType: '',
  bucketName: '',
  bucket: {
    id: 0,
    name: '',
    domain: 'via.placeholder.com',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export async function handleGetBaby(env: Env, id: string, userId: number) {
  let result = await env.DB.prepare(
    `SELECT id, name, gender, born_at as "bornAt", avatar,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM baby WHERE id = ? AND user_id = ?`
  ).bind(id, userId).first();

  if (!result) {
    const defaultName = '宝宝';
    const defaultBornAt = new Date().toISOString();
    result = await env.DB.prepare(
      `INSERT INTO baby (name, gender, born_at, user_id, created_at, updated_at)
       VALUES (?, 0, ?, ?, datetime('now', '+8 hours'), datetime('now', '+8 hours'))
       RETURNING id, name, gender, born_at as "bornAt", avatar,
                created_at as "createdAt", updated_at as "updatedAt"`
    ).bind(defaultName, defaultBornAt, userId).first();
  }

  return json({ ...result, avatar: MOCK_AVATAR });
}

export async function handleCreateBaby(env: Env, body: string | null, userId: number) {
  const data = parseJson(body);
  if (!data || !data.name || !data.bornAt) {
    return error('name and bornAt are required', 400);
  }

  const result = await env.DB.prepare(
    `INSERT INTO baby (name, gender, born_at, user_id)
     VALUES (?, ?, ?, ?)
     RETURNING id, name, gender, born_at as "bornAt", avatar,
              created_at as "createdAt", updated_at as "updatedAt"`
  ).bind(data.name, data.gender ?? 0, data.bornAt, userId).first();

  return json({ ...result, avatar: MOCK_AVATAR }, 201);
}

export async function handleUpdateBaby(env: Env, body: string | null, userId: number) {
  const data = parseJson(body);
  if (!data || !data.id) {
    return error('id is required', 400);
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.gender !== undefined) { fields.push('gender = ?'); values.push(data.gender); }
  if (data.bornAt !== undefined) { fields.push('born_at = ?'); values.push(data.bornAt); }
  if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar); }

  if (fields.length === 0) {
    return error('No fields to update', 400);
  }

  fields.push('updated_at = datetime(\'now\')');
  values.push(data.id, userId);

  await env.DB.prepare(
    `UPDATE baby SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...values).run();

  const result = await env.DB.prepare(
    `SELECT id, name, gender, born_at as "bornAt", avatar,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM baby WHERE id = ? AND user_id = ?`
  ).bind(data.id, userId).first();

  return json({ ...result, avatar: MOCK_AVATAR });
}
