import { json, error, parseJson } from '../utils';
import type { Env } from '../utils';

export async function handleGetEvents(env: Env) {
  const rows = await env.DB.prepare(
    `SELECT id, name, display_name as "displayName", icon, extra_fields as "extraFields",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM event ORDER BY id ASC`
  ).all();

  const events = rows.results.map((row: any) => ({
    ...row,
    extraFields: row.extraFields ? JSON.parse(row.extraFields) : undefined,
  }));

  return json(events);
}

export async function handleCreateEvent(env: Env, body: string | null) {
  const data = parseJson(body);
  if (!data) return error('Invalid JSON', 400);

  const items = Array.isArray(data) ? data : [data];

  const created: any[] = [];
  for (const item of items) {
    if (!item.name || !item.displayName) {
      return error('name and displayName are required', 400);
    }
    const extraFields = item.extraFields ? JSON.stringify(item.extraFields) : null;
    const result = await env.DB.prepare(
      `INSERT INTO event (name, display_name, icon, extra_fields)
       VALUES (?, ?, ?, ?)
       RETURNING id, name, display_name as "displayName", icon, extra_fields as "extraFields",
                created_at as "createdAt", updated_at as "updatedAt"`
    ).bind(item.name, item.displayName, item.icon || '', extraFields).first();
    created.push(result);
  }

  return json(created.map((r: any) => ({
    ...r,
    extraFields: r.extraFields ? JSON.parse(r.extraFields) : undefined,
  })));
}

export async function handleUpdateEvent(env: Env, body: string | null) {
  const data = parseJson(body);
  if (!data) return error('Invalid JSON', 400);

  const items = Array.isArray(data) ? data : [data];
  const updated: any[] = [];

  for (const item of items) {
    if (!item.id) return error('id is required', 400);

    const fields: string[] = [];
    const values: unknown[] = [];

    if (item.name !== undefined) { fields.push('name = ?'); values.push(item.name); }
    if (item.displayName !== undefined) { fields.push('display_name = ?'); values.push(item.displayName); }
    if (item.icon !== undefined) { fields.push('icon = ?'); values.push(item.icon); }
    if (item.extraFields !== undefined) { fields.push('extra_fields = ?'); values.push(JSON.stringify(item.extraFields)); }
    fields.push('updated_at = datetime(\'now\', \'+8 hours\')');
    values.push(item.id);

    await env.DB.prepare(
      `UPDATE event SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    const result = await env.DB.prepare(
      `SELECT id, name, display_name as "displayName", icon, extra_fields as "extraFields",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM event WHERE id = ?`
    ).bind(item.id).first();

    updated.push({
      ...result,
      extraFields: result ? ((result as any).extraFields ? JSON.parse((result as any).extraFields) : undefined) : undefined,
    });
  }

  return json(updated.length === 1 ? updated[0] : updated);
}
