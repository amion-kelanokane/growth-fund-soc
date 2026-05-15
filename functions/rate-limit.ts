import {
  CFP_RATE_COOKIE_KEY,
  RATE_COOKIE_MAX_AGE,
  RATE_FAST_DELAY_MS,
  RATE_SLOW_DELAY_MS,
  RATE_FAST_MAX_ATTEMPTS,
} from './constants';
import { hmacSign, hmacVerify } from './utils';

export interface RateLimitState {
  attempts: number;
  lastAttemptMs: number;
}

export interface RateLimitResult {
  limited: boolean;
  /** Remaining milliseconds the caller must wait (0 when not limited). */
  waitMs: number;
}

/**
 * Parse and cryptographically verify the rate-limit cookie.
 * Returns a zeroed state if the cookie is absent, tampered, or malformed.
 */
export async function parseRateLimitState(
  cookieHeader: string,
  secret: string
): Promise<RateLimitState> {
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${CFP_RATE_COOKIE_KEY}=([^;]+)`)
  );
  if (!match) return { attempts: 0, lastAttemptMs: 0 };

  const parts = match[1].split('|');
  if (parts.length !== 3) return { attempts: 0, lastAttemptMs: 0 };

  const [attemptsStr, lastMsStr, sig] = parts;
  const message = `${attemptsStr}|${lastMsStr}`;

  // Constant-time HMAC verification — prevents forgery
  const valid = await hmacVerify(message, sig, secret);
  if (!valid) return { attempts: 0, lastAttemptMs: 0 };

  const attempts = parseInt(attemptsStr, 10);
  const lastAttemptMs = parseInt(lastMsStr, 10);
  if (!Number.isFinite(attempts) || !Number.isFinite(lastAttemptMs)) {
    return { attempts: 0, lastAttemptMs: 0 };
  }

  return { attempts, lastAttemptMs };
}

/**
 * Build a signed Set-Cookie header value for the rate-limit state.
 */
export async function buildRateLimitCookie(
  state: RateLimitState,
  secret: string
): Promise<string> {
  const message = `${state.attempts}|${state.lastAttemptMs}`;
  const sig = await hmacSign(message, secret);
  const value = `${message}|${sig}`;
  return (
    `${CFP_RATE_COOKIE_KEY}=${value}; ` +
    `Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${RATE_COOKIE_MAX_AGE}`
  );
}

/**
 * Determine whether the caller is currently rate-limited.
 */
export function checkRateLimit(state: RateLimitState, nowMs: number): RateLimitResult {
  if (state.attempts === 0) return { limited: false, waitMs: 0 };

  // First RATE_FAST_MAX_ATTEMPTS failures → 1 s cooldown;
  // subsequent failures → 30 s cooldown.
  const delay =
    state.attempts < RATE_FAST_MAX_ATTEMPTS ? RATE_FAST_DELAY_MS : RATE_SLOW_DELAY_MS;
  const elapsed = nowMs - state.lastAttemptMs;

  if (elapsed < delay) {
    return { limited: true, waitMs: delay - elapsed };
  }
  return { limited: false, waitMs: 0 };
}

/**
 * Return the next state after a failed attempt.
 */
export function incrementAttempts(state: RateLimitState, nowMs: number): RateLimitState {
  return { attempts: state.attempts + 1, lastAttemptMs: nowMs };
}

/**
 * Build a Set-Cookie header that immediately expires the rate-limit cookie.
 * Call this on a successful login.
 */
export function clearRateLimitCookie(): string {
  return `${CFP_RATE_COOKIE_KEY}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
