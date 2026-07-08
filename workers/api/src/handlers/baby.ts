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

export async function handleGetBaby(env: Env, id: string) {
  const result = await env.DB.prepare(
    'SELECT id, name, gender, born_at as "bornAt", avatar, created_at as "createdAt", updated_at as "updatedAt" FROM baby WHERE id = ?'
  ).bind(id).first();

  if (!result) {
    return error('Baby not found', 404);
  }

  return json({
    ...result,
    avatar: MOCK_AVATAR,
  });
}

export async function handleCreateBaby(env: Env, body: string | null) {
  const data = parseJson(body);
  if (!data || !data.name || !data.bornAt) {
    return error('name and bornAt are required', 400);
  }

  const result = await env.DB.prepare(
    'INSERT INTO baby (name, gender, born_at) VALUES (?, ?, ?) RETURNING id, name, gender, born_at as "bornAt", avatar, created_at as "createdAt", updated_at as "updatedAt"'
  ).bind(data.name, data.gender ?? 0, data.bornAt).first();

  return json({ ...result, avatar: MOCK_AVATAR }, 201);
}

export async function handleUpdateBaby(env: Env, body: string | null) {
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
  values.push(data.id);

  await env.DB.prepare(
    `UPDATE baby SET ${fields.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  const result = await env.DB.prepare(
    'SELECT id, name, gender, born_at as "bornAt", avatar, created_at as "createdAt", updated_at as "updatedAt" FROM baby WHERE id = ?'
  ).bind(data.id).first();

  return json({ ...result, avatar: MOCK_AVATAR });
}
