import { json, error, noContent, parseJson } from '../utils';
import type { Env } from '../utils';

export async function handleGetEventLog(env: Env, url: URL, userId: number) {
  const date = url.searchParams.get('date');
  const eventName = url.searchParams.get('eventName');

  let sql = `SELECT el.id, el.event_name as eventName, el.event_time as eventTime,
                    el.comment, el.extra, el.created_at as createdAt, el.updated_at as updatedAt
             FROM event_log el
             WHERE el.user_id = ?`;
  const values: unknown[] = [userId];

  if (date) {
    values.push(date);
    sql += ' AND date(el.event_time, "+8 hours") = date(?)';
  }
  if (eventName) {
    values.push(eventName);
    sql += ' AND el.event_name = ?';
  }

  sql += ' ORDER BY el.event_time DESC, el.id DESC';

  const { results: logs } = await env.DB.prepare(sql).bind(...values).all();

  const { results: events } = await env.DB.prepare(
    `SELECT id, name, display_name as displayName, icon, extra_fields as extraFields,
            created_at as createdAt, updated_at as updatedAt FROM event`
  ).all();

  const eventMap = new Map(events.map((e: any) => [e.name, {
    ...e,
    extraFields: e.extraFields ? JSON.parse(e.extraFields) : undefined,
  }]));

  const result = logs.map((row: any) => ({
    id: row.id,
    eventName: row.eventName,
    eventTime: row.eventTime,
    comment: row.comment,
    extra: row.extra ? JSON.parse(row.extra) : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    event: eventMap.get(row.eventName) || {
      id: 0,
      name: row.eventName,
      displayName: row.eventName,
      icon: '',
      extraFields: undefined,
      createdAt: '',
      updatedAt: '',
    },
  }));

  return json(result);
}

export async function handleGetEventLogDistinct(env: Env, url: URL, userId: number) {
  const date = url.searchParams.get('date');

  let sql = `SELECT el.event_name as eventName, e.display_name as displayName, COUNT(*) as count
             FROM event_log el
             LEFT JOIN event e ON el.event_name = e.name
             WHERE el.user_id = ?`;
  const values: unknown[] = [userId];

  if (date) {
    values.push(date);
    sql += ' AND date(el.event_time, "+8 hours") = date(?)';
  }

  sql += ' GROUP BY el.event_name, e.display_name ORDER BY count DESC';

  const { results } = await env.DB.prepare(sql).bind(...values).all();

  return json(results);
}

export async function handleCreateEventLog(env: Env, body: string | null, userId: number) {
  const data = parseJson(body);
  if (!data || !data.eventName) {
    return error('eventName is required', 400);
  }

  // Auto-stop any open Sleep event when feeding or sleeping starts
  if (data.eventName === 'Feed' || data.eventName === 'Sleep') {
    const openSleep = await env.DB.prepare(
      `SELECT id, extra FROM event_log
       WHERE user_id = ? AND event_name = 'Sleep'
       AND (extra IS NULL OR extra NOT LIKE '%"endTime"%')
       ORDER BY event_time DESC LIMIT 1`
    ).bind(userId).first();

    if (openSleep) {
      const sleepExtra = (openSleep as any).extra ? JSON.parse((openSleep as any).extra) : {};
      sleepExtra.endTime = new Date().toISOString();
      await env.DB.prepare(
        `UPDATE event_log SET extra = ?, updated_at = datetime('now', '+8 hours')
         WHERE id = ?`
      ).bind(JSON.stringify(sleepExtra), (openSleep as any).id).run();
    }
  }

  const extra = data.extra ? JSON.stringify(data.extra) : null;

  const result = await env.DB.prepare(
    `INSERT INTO event_log (event_name, event_time, comment, extra, user_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now', '+8 hours'), datetime('now', '+8 hours'))
     RETURNING id, event_name as eventName, event_time as eventTime, comment, extra,
              created_at as createdAt, updated_at as updatedAt`
  ).bind(data.eventName, data.eventTime || null, data.comment || null, extra, userId).first();

  return json({
    ...result,
    extra: result ? ((result as any).extra ? JSON.parse((result as any).extra) : undefined) : undefined,
  }, 201);
}

export async function handleUpdateEventLog(env: Env, body: string | null, userId: number) {
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
  values.push(data.id, userId);

  await env.DB.prepare(
    `UPDATE event_log SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...values).run();

  const result = await env.DB.prepare(
    `SELECT id, event_name as eventName, event_time as eventTime, comment, extra,
            created_at as createdAt, updated_at as updatedAt
     FROM event_log WHERE id = ? AND user_id = ?`
  ).bind(data.id, userId).first();

  return json({
    ...result,
    extra: result ? ((result as any).extra ? JSON.parse((result as any).extra) : undefined) : undefined,
  });
}

export async function handleDeleteEventLog(env: Env, id: string, userId: number) {
  await env.DB.prepare('DELETE FROM event_log WHERE id = ? AND user_id = ?').bind(id, userId).run();
  return noContent();
}

export async function handleGetEventLogHeatmap(env: Env, url: URL, userId: number) {
  const weeks = Math.min(parseInt(url.searchParams.get('weeks') || '20') || 20, 52);
  const endDate = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const startDate = new Date(endDate.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

  const { results } = await env.DB.prepare(
    `SELECT date(event_time, '+8 hours') as date, COUNT(*) as count
     FROM event_log
     WHERE user_id = ? AND event_time >= ? AND event_time <= ?
     GROUP BY date(event_time, '+8 hours')
     ORDER BY date ASC`
  ).bind(userId, startDate.toISOString(), endDate.toISOString()).all();

  // Build a map of date -> count
  const countMap = new Map((results as any[]).map(r => [r.date, r.count]));

  // Fill in all dates in range
  const data: { date: string; count: number }[] = [];
  const d = new Date(startDate);
  while (d <= endDate) {
    const dateStr = d.toISOString().slice(0, 10);
    data.push({ date: dateStr, count: countMap.get(dateStr) || 0 });
    d.setDate(d.getDate() + 1);
  }

  return json(data);
}
