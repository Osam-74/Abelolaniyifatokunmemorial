import 'server-only';
import { createHash } from 'node:crypto';

/**
 * The visitor's IP as seen by Vercel. Vercel sets x-forwarded-for itself and
 * the left-most entry is the real client, so only the first hop is trusted,
 * and only if it parses as an IPv4/IPv6 address. Anything else is "unknown".
 */
const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-f:]+$/i;

export function clientIpFrom(get: (name: string) => string | null): string {
  const first = get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const candidate = first || get('x-real-ip')?.trim() || '';
  if (IPV4.test(candidate) || (candidate.includes(':') && IPV6.test(candidate))) return candidate;
  return 'unknown';
}

/** One-way hash so raw IP addresses are never stored. */
export function hashIp(ip: string): string {
  const salt = process.env.AUTH_SECRET || 'memorial';
  return createHash('sha256').update(`${ip}:${salt}`).digest('hex').slice(0, 32);
}
