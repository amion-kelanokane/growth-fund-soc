import { CFP_COOKIE_KEY, CFP_COOKIE_MAX_AGE } from './constants';

export interface PasswordEnv {
  PASSWORD?: string;
  CF_PASSWORD?: string;
}

export function getConfiguredPassword(env: PasswordEnv): string {
  return (env.PASSWORD ?? env.CF_PASSWORD ?? '').trim();
}

export async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str ?? ''));
  return Array.prototype.map
    .call(new Uint8Array(buf), (x: number) => ('00' + x.toString(16)).slice(-2))
    .join('');
}

export async function buildAuthCookie(password: string, nowMs: number = Date.now()): Promise<string> {
  const expiresAtMs = nowMs + CFP_COOKIE_MAX_AGE * 1000;
  const payload = `${expiresAtMs}`;
  const signature = await hmacSign(payload, password);
  const value = `${payload}.${signature}`;

  return (
    `${CFP_COOKIE_KEY}=${value}; ` +
    `Max-Age=${CFP_COOKIE_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Strict`
  );
}

export async function hasValidAuthCookie(
  cookieHeader: string,
  password?: string,
  nowMs: number = Date.now()
): Promise<boolean> {
  const secret = password?.trim() ?? '';

  if (!secret) {
    return false;
  }

  const values = getCookieValues(cookieHeader, CFP_COOKIE_KEY);

  if (values.length === 0) {
    return false;
  }

  for (const value of values) {
    const [expiresAtRaw, signature] = value.split('.');
    const expiresAtMs = Number(expiresAtRaw);

    if (!expiresAtRaw || !signature || !Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) {
      continue;
    }

    if (await hmacVerify(expiresAtRaw, signature, secret)) {
      return true;
    }
  }

  return false;
}

function getCookieValues(cookieHeader: string, key: string): string[] {
  return cookieHeader
    .split(';')
    .map(part => part.trim())
    .filter(part => part.startsWith(`${key}=`))
    .map(part => part.slice(key.length + 1));
}

export function clearAuthCookie(): string {
  return `${CFP_COOKIE_KEY}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isTrustedOrigin(request: Request): boolean {
  const requestUrl = new URL(request.url);
  const requestOrigin = requestUrl.origin;
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  try {
    if (origin) {
      return new URL(origin).origin === requestOrigin;
    }

    if (referer) {
      return new URL(referer).origin === requestOrigin;
    }
  } catch {
    return false;
  }

  return true;
}

export function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}

/**
 * HMAC-SHA-256 sign a message with a secret. Returns lowercase hex.
 */
export async function hmacSign(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.prototype.map
    .call(new Uint8Array(sig), (x: number) => ('00' + x.toString(16)).slice(-2))
    .join('');
}

/**
 * Constant-time HMAC-SHA-256 verification.
 */
export async function hmacVerify(message: string, sigHex: string, secret: string): Promise<boolean> {
  if (!/^[0-9a-f]{64}$/i.test(sigHex)) {
    return false;
  }

  try {
    const expectedSig = await hmacSign(message, secret);
    return constantTimeEqual(sigHex.toLowerCase(), expectedSig);
  } catch {
    return false;
  }
}

/**
 * Escape a string for safe interpolation into HTML attribute values and text.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Ensure a redirect path is relative and safe (prevents open redirect).
 * Returns '/' for anything that looks like an external URL.
 */
export function sanitizeRedirectPath(path: string): string {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    return '/';
  }
  return path;
}
