import 'server-only';
import { query, queryOne, hasDatabase } from './db';

/**
 * Fixed-window rate limiter backed by the existing Postgres database.
 *
 * Why Postgres and not Upstash/KV: the project does not use either, adding one
 * means a new paid dependency and new secrets, and this site's traffic is low.
 * One atomic upsert per check is cheap and works on serverless because the
 * counter lives in the database, not in process memory. If Upstash is added
 * later, only this file needs to change.
 *
 * Fails OPEN on a database error (a broken limiter must never take the
 * memorial offline), but the admin-login limiter fails CLOSED via `strict`.
 */
export type RateResult = { ok: boolean; retryAfter: number; remaining: number };

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  opts: { strict?: boolean } = {}
): Promise<RateResult> {
  if (!hasDatabase()) return { ok: !opts.strict, retryAfter: windowSeconds, remaining: 0 };

  const nowMs = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(nowMs / windowMs) * windowMs);
  const retryAfter = Math.max(1, Math.ceil((windowStart.getTime() + windowMs - nowMs) / 1000));

  try {
    const row = await queryOne<{ hits: number }>(
      `INSERT INTO rate_limits (key, window_start, hits) VALUES ($1, $2, 1)
       ON CONFLICT (key, window_start) DO UPDATE SET hits = rate_limits.hits + 1
       RETURNING hits`,
      [key, windowStart.toISOString()]
    );
    const hits = row?.hits ?? 1;
    // Opportunistic cleanup (about 1 in 50 calls) keeps the table small.
    if (Math.random() < 0.02) {
      void query(`DELETE FROM rate_limits WHERE window_start < now() - interval '2 days'`).catch(() => undefined);
    }
    return { ok: hits <= limit, retryAfter, remaining: Math.max(0, limit - hits) };
  } catch (error) {
    console.error('[rateLimit] check failed:', error instanceof Error ? error.message : error);
    return { ok: !opts.strict, retryAfter, remaining: 0 };
  }
}

/** Records a blocked event with no personal data (only a hashed IP). */
export async function logSecurityEvent(kind: string, route: string, ipHash: string): Promise<void> {
  if (!hasDatabase()) return;
  try {
    await query('INSERT INTO security_events (kind, route, ip_hash) VALUES ($1, $2, $3)', [kind, route, ipHash]);
    if (Math.random() < 0.05) {
      void query(`DELETE FROM security_events WHERE created_at < now() - interval '60 days'`).catch(() => undefined);
    }
  } catch {
    /* logging must never break a request */
  }
}

export function tooManyResponse(retryAfter: number, message = 'Too many requests. Please wait a little and try again.') {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) },
  });
}
