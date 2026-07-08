import { json, error, noContent, parseJson } from '../utils';
import type { Env } from '../utils';

export async function handleGetMoments(env: Env, url: URL, userId: number) {
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
  const type = url.searchParams.get('type');

  let sql = `SELECT id, content, type, attachments, created_at as "createdAt", updated_at as "updatedAt"
             FROM moment WHERE user_id = ?`;
  const values: unknown[] = [userId];

  if (type) {
    sql += ' AND type = ?';
    values.push(type);
  }

  const countRow: any = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM moment WHERE user_id = ?${type ? ' AND type = ?' : ''}`
  ).bind(userId, ...(type ? [type] : [])).first();
  const totalCount = countRow?.total ?? 0;

  const offset = (page - 1) * pageSize;
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  values.push(pageSize, offset);

  const { results } = await env.DB.prepare(sql).bind(...values).all();

  const moments = results.map((row: any) => ({
    id: row.id,
    content: row.content,
    type: row.type,
    attachments: row.attachments ? JSON.parse(row.attachments) : [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  return json({ data: moments, total: totalCount });
}

export async function handleCreateMoment(env: Env, body: string | null, userId: number) {
  const data = parseJson(body);
  if (!data || !data.content) {
    return error('content is required', 400);
  }

  const attachments = data.attachments ? JSON.stringify(data.attachments) : '[]';

  const result = await env.DB.prepare(
    `INSERT INTO moment (content, type, attachments, user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, datetime('now', '+8 hours'), datetime('now', '+8 hours'))
     RETURNING id, content, type, attachments, created_at as "createdAt", updated_at as "updatedAt"`
  ).bind(data.content, data.type || 'moment', attachments, userId).first();

  return json({
    ...result,
    attachments: result ? JSON.parse((result as any).attachments) : [],
  }, 201);
}

export async function handleUpdateMoment(env: Env, body: string | null, userId: number) {
  const data = parseJson(body);
  if (!data || !data.id) {
    return error('id is required', 400);
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }
  if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
  if (data.attachments !== undefined) { fields.push('attachments = ?'); values.push(JSON.stringify(data.attachments)); }
  fields.push('updated_at = datetime(\'now\')');
  values.push(data.id, userId);

  await env.DB.prepare(
    `UPDATE moment SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...values).run();

  const result = await env.DB.prepare(
    `SELECT id, content, type, attachments, created_at as "createdAt", updated_at as "updatedAt"
     FROM moment WHERE id = ? AND user_id = ?`
  ).bind(data.id, userId).first();

  return json({
    ...result,
    attachments: result ? JSON.parse((result as any).attachments) : [],
  });
}

export async function handleDeleteMoment(env: Env, id: string, userId: number) {
  await env.DB.prepare('DELETE FROM moment WHERE id = ? AND user_id = ?').bind(id, userId).run();
  return noContent();
}
