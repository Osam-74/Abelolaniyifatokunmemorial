import 'server-only';

/**
 * Cloudflare Turnstile (free, privacy-friendly CAPTCHA).
 *
 * If TURNSTILE_SECRET_KEY is not set the check is skipped and the other layers
 * (honeypot, time-trap, rate limit, spam rules, mandatory approval) still apply,
 * so the site is protected before Turnstile is switched on.
 * Once the secret IS set it fails CLOSED: no valid token, no submission.
 */
export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export async function verifyTurnstile(token: string | null | undefined, ip: string): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token });
    if (ip && ip !== 'unknown') body.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(6000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false; // fail closed
  }
}
