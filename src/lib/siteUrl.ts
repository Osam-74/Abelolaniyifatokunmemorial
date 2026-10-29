/**
 * The one public address of the memorial.
 *
 * The environment variable is trusted only when it is the real domain. In the
 * past it was set to the *.vercel.app address, which put that host into every
 * share image and sitemap entry; so any *.vercel.app value is ignored in favour
 * of the canonical domain.
 */
export const CANONICAL_ORIGIN = `https://${process.env.CANONICAL_HOST || 'www.abelolaniyifatokunmemorial.vip'}`;

export function siteOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/$/, '');
  if (!raw) return CANONICAL_ORIGIN;
  try {
    const u = new URL(raw);
    if (u.hostname.endsWith('.vercel.app')) return CANONICAL_ORIGIN;
    return u.origin;
  } catch {
    return CANONICAL_ORIGIN;
  }
}

/** Turns "/images/x.jpg" into a full address on the canonical host; leaves full URLs alone. */
export function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  try {
    return new URL(pathOrUrl, siteOrigin()).toString();
  } catch {
    return '';
  }
}
