import { CFP_ALLOWED_PATHS } from './constants';
import { getHostValidationResponse, type AuthEnv } from './editor-shared';
import { getConfiguredPassword, hasValidAuthCookie, sanitizeRedirectPath } from './utils';
import { getTemplate } from './template';

export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
  env: AuthEnv;
}): Promise<Response> {
  const { request, next, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const cookie = request.headers.get('cookie') || '';
  const hostValidationResponse = getHostValidationResponse(request);

  if (hostValidationResponse) {
    return hostValidationResponse;
  }

  const password = getConfiguredPassword(env);
  const isLoginPost = request.method === 'POST' && pathname === '/cfp_login';

  if (!password && !isLoginPost && !CFP_ALLOWED_PATHS.includes(pathname)) {
    return new Response('PASSWORD is missing.', {
      status: 500,
      headers: {
        'cache-control': 'no-cache, no-store',
        'content-type': 'text/plain; charset=utf-8',
      },
    });
  }

  if (
    CFP_ALLOWED_PATHS.includes(pathname) ||
    isLoginPost ||
    (await hasValidAuthCookie(cookie, password))
  ) {
    return await next();
  }

  const error = searchParams.get('error') ?? '';
  const waitParam = searchParams.get('wait') ?? '0';
  const waitSeconds =
    error === 'rate' ? Math.max(0, Math.min(60, parseInt(waitParam, 10) || 0)) : 0;
  const redirectPath = sanitizeRedirectPath(pathname);

  return new Response(
    getTemplate({
      redirectPath,
      withError: error === '1',
      waitSeconds: error === 'rate' ? waitSeconds : undefined,
    }),
    {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-cache, no-store',
      },
    }
  );
}
