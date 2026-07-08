import { json, error, noContent, parseJson } from '../utils';
import type { Env } from '../utils';

export async function handleGetMoments(env: Env, url: URL) {
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
  const type = url.searchParams.get('type');

  let sql = `SELECT id, content, type, attachments, created_at as "createdAt", updated_at as "updatedAt"
             FROM moment`;
  const countSql = 'SELECT COUNT(*) as total FROM moment';

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (type) {
    conditions.push('type = ?');
    values.push(type);
  }

  const where = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

  const countRow: any = await env.DB.prepare('SELECT COUNT(*) as total FROM moment' + where).bind(...values).first();
  const totalCount = countRow?.total ?? 0;

  const offset = (page - 1) * pageSize;
  sql += where + ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

  const { results } = await env.DB.prepare(sql).bind(...values, pageSize, offset).all();

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

export async function handleCreateMoment(env: Env, body: string | null) {
  const data = parseJson(body);
  if (!data || !data.content) {
    return error('content is required', 400);
  }

  const attachments = data.attachments ? JSON.stringify(data.attachments) : '[]';

  const result = await env.DB.prepare(
    `INSERT INTO moment (content, type, attachments)
     VALUES (?, ?, ?)
     RETURNING id, content, type, attachments, created_at as "createdAt", updated_at as "updatedAt"`
  ).bind(data.content, data.type || 'moment', attachments).first();

  return json({
    ...result,
    attachments: result ? JSON.parse((result as any).attachments) : [],
  }, 201);
}

export async function handleUpdateMoment(env: Env, body: string | null) {
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
  values.push(data.id);

  await env.DB.prepare(
    `UPDATE moment SET ${fields.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  const result = await env.DB.prepare(
    `SELECT id, content, type, attachments, created_at as "createdAt", updated_at as "updatedAt"
     FROM moment WHERE id = ?`
  ).bind(data.id).first();

  return json({
    ...result,
    attachments: result ? JSON.parse((result as any).attachments) : [],
  });
}

export async function handleDeleteMoment(env: Env, id: string) {
  await env.DB.prepare('DELETE FROM moment WHERE id = ?').bind(id).run();
  return noContent();
}
