/**
 * Key for the auth cookie.
 */
export const CFP_COOKIE_KEY = 'CFP-Auth-Key';

/**
 * Max age of the auth cookie in seconds.
 * Default: 1 week.
 */
export const CFP_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Paths that don't require authentication.
 */
export const CFP_ALLOWED_PATHS: string[] = [];

/**
 * Key for the rate-limit tracking cookie.
 */
export const CFP_RATE_COOKIE_KEY = 'CFP-RL';

/**
 * Max age of the rate-limit cookie in seconds (1 hour).
 * After this, the attempt counter resets naturally.
 */
export const RATE_COOKIE_MAX_AGE = 60 * 60;

/**
 * Minimum delay between the first N failed attempts (milliseconds).
 */
export const RATE_FAST_DELAY_MS = 1_000; // 1 second

/**
 * Minimum delay after RATE_FAST_MAX_ATTEMPTS failures (milliseconds).
 */
export const RATE_SLOW_DELAY_MS = 30_000; // 30 seconds

/**
 * Number of attempts that use the fast delay before switching to the slow delay.
 * i.e. attempts 1–3 → 1 s cooldown; attempt 4 onwards → 30 s cooldown.
 */
export const RATE_FAST_MAX_ATTEMPTS = 3;
