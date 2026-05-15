export interface AuthEnv {
  PASSWORD?: string;
  CF_PASSWORD?: string;
}

const ALLOWED_HOST_ROOT = 'amion.uk';
const ALLOWED_HOST_SUFFIX = '.amion.uk';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function getHostValidationResponse(request: Request): Response | null {
  const hostname = new URL(request.url).hostname.toLowerCase();

  if (isAllowedHost(hostname)) {
    return null;
  }

  return new Response('Not found', {
    status: 404,
    headers: {
      'cache-control': 'no-cache, no-store',
      'content-type': 'text/plain; charset=utf-8',
    },
  });
}

export function isAllowedHost(hostname: string): boolean {
  if (!hostname) {
    return false;
  }

  if (LOCAL_HOSTS.has(hostname)) {
    return true;
  }

  if (hostname.endsWith('.pages.dev')) {
    return false;
  }

  return hostname === ALLOWED_HOST_ROOT || hostname.endsWith(ALLOWED_HOST_SUFFIX);
}
