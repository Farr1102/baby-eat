import { json, error, parseJson } from '../utils';
import { hashPassword, verifyPassword, generateToken } from '../auth';
import type { Env } from '../utils';

export async function handleRegister(env: Env, body: string | null) {
  const data = parseJson(body);
  if (!data || !data.username || !data.password) {
    return error('username and password are required', 400);
  }

  const username = String(data.username).trim();
  const password = String(data.password);

  if (username.length < 2 || username.length > 30) {
    return error('username must be 2-30 characters', 400);
  }
  if (password.length < 6) {
    return error('password must be at least 6 characters', 400);
  }

  // Check if user exists
  const existing = await env.DB.prepare(
    'SELECT id FROM user WHERE username = ?'
  ).bind(username).first();
  if (existing) {
    return error('username already exists', 409);
  }

  const passwordHash = await hashPassword(password);

  const user = await env.DB.prepare(
    'INSERT INTO user (username, password_hash) VALUES (?, ?) RETURNING id, username, created_at as createdAt'
  ).bind(username, passwordHash).first();

  const token = generateToken();
  await env.DB.prepare(
    'INSERT INTO session (user_id, token) VALUES (?, ?)'
  ).bind((user as any).id, token).run();

  return json({ token, user: { id: (user as any).id, username: (user as any).username } }, 201);
}

export async function handleLogin(env: Env, body: string | null) {
  const data = parseJson(body);
  if (!data || !data.username || !data.password) {
    return error('username and password are required', 400);
  }

  const username = String(data.username).trim();

  const user: any = await env.DB.prepare(
    'SELECT id, username, password_hash as passwordHash FROM user WHERE username = ?'
  ).bind(username).first();

  if (!user) {
    return error('invalid username or password', 401);
  }

  const valid = await verifyPassword(String(data.password), user.passwordHash);
  if (!valid) {
    return error('invalid username or password', 401);
  }

  const token = generateToken();
  await env.DB.prepare(
    'INSERT INTO session (user_id, token) VALUES (?, ?)'
  ).bind(user.id, token).run();

  return json({ token, user: { id: user.id, username: user.username } });
}

export async function handleMe(env: Env, _body: string | null, userId: number) {
  const user: any = await env.DB.prepare(
    'SELECT id, username, created_at as createdAt FROM user WHERE id = ?'
  ).bind(userId).first();

  if (!user) {
    return error('user not found', 404);
  }

  return json({ id: user.id, username: user.username });
}

export async function handleLogout(env: Env, _body: string | null, userId: number) {
  await env.DB.prepare(
    'DELETE FROM session WHERE user_id = ?'
  ).bind(userId).run();

  return json({ ok: true });
}
