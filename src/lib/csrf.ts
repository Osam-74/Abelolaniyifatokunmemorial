import 'server-only';

/**
 * Origin/Host check for state-changing requests, on top of SameSite=Lax.
 * Requests with no Origin header (older browsers, same-origin GET-like fetches)
 * are allowed only when the Referer, if present, matches; a request that
 * carries an Origin must match the host exactly.
 */
export function sameOrigin(get: (name: string) => string | null): boolean {
  const host = (get('x-forwarded-host') || get('host') || '').toLowerCase();
  if (!host) return false;
  const origin = get('origin');
  if (origin) {
    try {
      return new URL(origin).host.toLowerCase() === host;
    } catch {
      return false;
    }
  }
  const referer = get('referer');
  if (referer) {
    try {
      return new URL(referer).host.toLowerCase() === host;
    } catch {
      return false;
    }
  }
  return true;
}
