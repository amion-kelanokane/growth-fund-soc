import {
  buildAuthCookie,
  clearAuthCookie,
  constantTimeEqual,
  getConfiguredPassword,
  isTrustedOrigin,
  sha256,
  sanitizeRedirectPath,
} from './utils';
import {
  parseRateLimitState,
  buildRateLimitCookie,
  checkRateLimit,
  incrementAttempts,
  clearRateLimitCookie,
} from './rate-limit';

export async function onRequestPost(context: {
  request: Request;
  env: { PASSWORD?: string; CF_PASSWORD?: string };
}): Promise<Response> {
  const { request, env } = context;
  const body = await request.formData();

  const redirectRaw = body.get('redirect');
  const redirectPath = sanitizeRedirectPath(
    typeof redirectRaw === 'string' ? redirectRaw : '/'
  );
  const nowMs = Date.now();
  const secret = getConfiguredPassword(env);
  const cookieHeader = request.headers.get('cookie') ?? '';

  if (!secret) {
    return new Response('PASSWORD is missing.', {
      status: 500,
      headers: {
        'cache-control': 'no-cache, no-store',
        'content-type': 'text/plain; charset=utf-8',
      },
    });
  }

  if (!isTrustedOrigin(request)) {
    return new Response('Invalid request origin.', {
      status: 403,
      headers: {
        'cache-control': 'no-cache, no-store',
        'content-type': 'text/plain; charset=utf-8',
      },
    });
  }

  const rlState = await parseRateLimitState(cookieHeader, secret);
  const rlResult = checkRateLimit(rlState, nowMs);

  if (rlResult.limited) {
    const waitSecs = Math.ceil(rlResult.waitMs / 1000);
    const rateCookie = await buildRateLimitCookie(rlState, secret);
    const headers = new Headers();

    headers.append('Set-Cookie', rateCookie);
    headers.set('cache-control', 'no-cache, no-store');
    headers.set('location', `${redirectPath}?error=rate&wait=${waitSecs}`);

    return new Response('', { status: 302, headers });
  }

  const passwordEntry = body.get('password');
  const password = typeof passwordEntry === 'string' ? passwordEntry : '';
  const hashedPassword = await sha256(password);
  const hashedConfiguredPassword = await sha256(secret);

  if (constantTimeEqual(hashedPassword, hashedConfiguredPassword)) {
    const authCookie = await buildAuthCookie(secret, nowMs);
    const headers = new Headers();

    headers.append('Set-Cookie', authCookie);
    headers.append('Set-Cookie', clearRateLimitCookie());
    headers.set('cache-control', 'no-cache, no-store');
    headers.set('location', redirectPath);

    return new Response('', { status: 302, headers });
  }

  const newState = incrementAttempts(rlState, nowMs);
  const rateCookie = await buildRateLimitCookie(newState, secret);
  const headers = new Headers();

  headers.append('Set-Cookie', rateCookie);
  headers.append('Set-Cookie', clearAuthCookie());
  headers.set('cache-control', 'no-cache, no-store');
  headers.set('location', `${redirectPath}?error=1`);

  return new Response('', { status: 302, headers });
}
