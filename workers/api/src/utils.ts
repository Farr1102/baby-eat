export interface Env {
  DB: D1Database;
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function noContent() {
  return new Response(null, { status: 204 });
}

export function error(msg: string, status = 500) {
  return json({ error: msg }, status);
}

export function parseJson(body: string | null) {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

// Parse ISO datetime returned by D1 to the format the frontend expects
export function formatRow(row: Record<string, unknown> | null) {
  if (!row) return null;
  return row;
}
