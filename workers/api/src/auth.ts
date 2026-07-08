import type { Env } from './utils';

const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    KEY_LENGTH * 8,
  );
  const hashArray = new Uint8Array(hash);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  return btoa(String.fromCharCode(...combined));
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
    const salt = combined.slice(0, SALT_LENGTH);
    const hash = combined.slice(SALT_LENGTH);
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits'],
    );
    const newHash = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
      key,
      KEY_LENGTH * 8,
    );
    const newHashArray = new Uint8Array(newHash);
    if (hash.length !== newHashArray.length) return false;
    return hash.every((v, i) => v === newHashArray[i]);
  } catch {
    return false;
  }
}

function generateToken(): string {
  return crypto.randomUUID();
}

// Verify token from Authorization header, return user_id or null
async function verifyToken(env: Env, request: Request): Promise<number | null> {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const row: any = await env.DB.prepare(
    'SELECT user_id as userId FROM session WHERE token = ?'
  ).bind(token).first();
  return row?.userId ?? null;
}

const PUBLIC_PATHS = ['/api/auth/register', '/api/auth/login', '/api/doc', '/api/hello'];

export function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(p => path.startsWith(p));
}

export async function authMiddleware(env: Env, request: Request): Promise<number | null> {
  const path = new URL(request.url).pathname;
  if (isPublicPath(path)) return null; // null means "no auth needed"
  return verifyToken(env, request);
}

export { hashPassword, verifyPassword, generateToken, verifyToken };
