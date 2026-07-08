import { json, error, noContent, parseJson } from '../utils';
import type { Env } from '../utils';

export async function handleGetEventLog(env: Env, url: URL) {
  const date = url.searchParams.get('date');
  const eventName = url.searchParams.get('eventName');

  let sql = `SELECT el.id, el.event_name as "eventName", el.event_time as "eventTime",
                    el.comment, el.extra, el.created_at as "createdAt", el.updated_at as "updatedAt",
                    e.id as "event.id", e.name as "event.name", e.display_name as "event.displayName",
                    e.icon as "event.icon", e.extra_fields as "event.extraFields",
                    e.created_at as "event.createdAt", e.updated_at as "event.updatedAt"
             FROM event_log el
             LEFT JOIN event e ON el.event_name = e.name`;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (date) {
    conditions.push('date(el.event_time) = date(?)');
    values.push(date);
  }
  if (eventName) {
    conditions.push('el.event_name = ?');
    values.push(eventName);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY el.event_time DESC, el.id DESC';

  const { results } = await env.DB.prepare(sql).bind(...values).all();

  const logs = results.map((row: any) => ({
    id: row.id,
    eventName: row.eventName,
    eventTime: row.eventTime,
    comment: row.comment,
    extra: row.extra ? JSON.parse(row.extra) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    event: {
      id: row['event.id'],
      name: row['event.name'],
      displayName: row['event.displayName'],
      icon: row['event.icon'],
      extraFields: row['event.extraFields'] ? JSON.parse(row['event.extraFields']) : undefined,
      createdAt: row['event.createdAt'],
      updatedAt: row['event.updatedAt'],
    },
  }));

  return json(logs);
}

export async function handleGetEventLogDistinct(env: Env, url: URL) {
  const date = url.searchParams.get('date');

  let sql = `SELECT el.event_name as "eventName", e.display_name as "displayName", COUNT(*) as count
             FROM event_log el
             JOIN event e ON el.event_name = e.name`;

  if (date) {
    sql += ' WHERE date(el.event_time) = date(?)';
  }

  sql += ' GROUP BY el.event_name, e.display_name ORDER BY count DESC';

  const values = date ? [date] : [];
  const { results } = await env.DB.prepare(sql).bind(...values).all();

  return json(results);
}

export async function handleCreateEventLog(env: Env, body: string | null) {
  const data = parseJson(body);
  if (!data || !data.eventName) {
    return error('eventName is required', 400);
  }

  const extra = data.extra ? JSON.stringify(data.extra) : null;

  const result = await env.DB.prepare(
    `INSERT INTO event_log (event_name, event_time, comment, extra)
     VALUES (?, ?, ?, ?)
     RETURNING id, event_name as "eventName", event_time as "eventTime", comment, extra,
              created_at as "createdAt", updated_at as "updatedAt"`
  ).bind(data.eventName, data.eventTime || null, data.comment || null, extra).first();

  return json({
    ...result,
    extra: result ? ((result as any).extra ? JSON.parse((result as any).extra) : undefined) : undefined,
  }, 201);
}

export async function handleUpdateEventLog(env: Env, body: string | null) {
  const data = parseJson(body);
  if (!data || !data.id) {
    return error('id is required', 400);
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.eventTime !== undefined) { fields.push('event_time = ?'); values.push(data.eventTime); }
  if (data.comment !== undefined) { fields.push('comment = ?'); values.push(data.comment); }
  if (data.extra !== undefined) { fields.push('extra = ?'); values.push(JSON.stringify(data.extra)); }
  fields.push('updated_at = datetime(\'now\')');
  values.push(data.id);

  await env.DB.prepare(
    `UPDATE event_log SET ${fields.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  const result = await env.DB.prepare(
    `SELECT id, event_name as "eventName", event_time as "eventTime", comment, extra,
            created_at as "createdAt", updated_at as "updatedAt"
     FROM event_log WHERE id = ?`
  ).bind(data.id).first();

  return json({
    ...result,
    extra: result ? ((result as any).extra ? JSON.parse((result as any).extra) : undefined) : undefined,
  });
}

export async function handleDeleteEventLog(env: Env, id: string) {
  await env.DB.prepare('DELETE FROM event_log WHERE id = ?').bind(id).run();
  return noContent();
}
