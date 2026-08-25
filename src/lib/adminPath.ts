import { headers } from 'next/headers';

/**
 * The admin area lives at whatever ADMIN_PATH is set to, so the URL can be
 * changed from Vercel at any time without touching the code. Internally the
 * routes still live under /admin; middleware rewrites the public path onto
 * them and blocks /admin itself whenever a custom path is in use.
 *
 * ADMIN_PATH is a server-only variable. It is never bundled into the browser,
 * so the address does not leak through the JavaScript.
 */
export const ADMIN_PATH_HEADER = 'x-admin-base';
export const DEFAULT_ADMIN_PATH = '/admin';

export function normaliseAdminPath(value: string | undefined | null): string {
  if (!value) return DEFAULT_ADMIN_PATH;
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed || trimmed === '/') return DEFAULT_ADMIN_PATH;
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  // Only a single, simple segment. Keeps the rewrite predictable.
  return /^\/[A-Za-z0-9._~-]+$/.test(withSlash) ? withSlash : DEFAULT_ADMIN_PATH;
}

export function configuredAdminPath(): string {
  return normaliseAdminPath(process.env.ADMIN_PATH);
}

/** The base the visitor actually typed, for building links inside the admin. */
export async function getAdminBase(): Promise<string> {
  const store = await headers();
  return normaliseAdminPath(store.get(ADMIN_PATH_HEADER) ?? configuredAdminPath());
}

/** Builds a link inside the admin area, e.g. adminHref(base, '/photos'). */
export function adminHref(base: string, path = ''): string {
  return `${base}${path}`;
}
