import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE = 'memorial_admin';
const MAX_AGE = 60 * 60 * 8; // 8 hours

export type Session = { uid: string; email: string; name: string; picture: string };

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 24) {
    throw new Error('AUTH_SECRET is missing or too short (needs 24+ characters).');
  }
  return new TextEncoder().encode(value);
}

/**
 * Who is allowed in. Firebase verifies *that* someone is who they say they are;
 * this decides whether that person may touch the memorial.
 *
 * Sign-up is also disabled in the Firebase console, but this list is the part
 * that still holds if that switch is ever flipped back on by accident.
 */
export function allowedEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowed(email: string | undefined | null): boolean {
  if (!email) return false;
  const list = allowedEmails();
  if (list.length === 0) return false; // fail closed: no list means nobody gets in
  return list.includes(email.toLowerCase());
}

export async function createSession(session: Session): Promise<void> {
  const token = await new SignJWT({ ...session, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.uid)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    if (payload.role !== 'admin' || typeof payload.sub !== 'string') return null;

    // Revoking access is as simple as removing the address from ADMIN_EMAILS —
    // it takes effect on the next request, not in eight hours.
    const email = String(payload.email ?? '');
    if (!isAllowed(email)) return null;

    return {
      uid: payload.sub,
      email,
      name: String(payload.name ?? ''),
      picture: String(payload.picture ?? ''),
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHORISED');
  return session;
}
