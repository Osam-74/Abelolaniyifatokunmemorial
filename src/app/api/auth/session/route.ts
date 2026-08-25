import { NextResponse } from 'next/server';
import { verifyFirebaseIdToken, firebaseProjectId } from '@/lib/verifyFirebaseToken';
import { mintSessionToken, isAllowed, allowedEmails, SESSION_COOKIE, cookieOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function refuse(status: number, publicMessage: string, logDetail: string) {
  console.error(`[sign-in] ${logDetail}`);
  const body: Record<string, unknown> = { error: publicMessage };
  if (process.env.DEBUG_AUTH === '1') body.debug = logDetail;
  return NextResponse.json(body, { status });
}

const UNAVAILABLE =
  'Sign-in is temporarily unavailable. Please try again in a moment, or contact whoever set up this website.';

export async function POST(request: Request) {
  try {
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 24) {
      return refuse(503, UNAVAILABLE, 'AUTH_SECRET is missing or shorter than 24 characters.');
    }
    if (!firebaseProjectId()) {
      return refuse(503, UNAVAILABLE, 'No Firebase project id found in the environment.');
    }
    if (allowedEmails().length === 0) {
      return refuse(503, UNAVAILABLE, 'ADMIN_EMAILS is empty, so no one can sign in.');
    }

    let idToken = '';
    try {
      const body = await request.json();
      idToken = String(body?.idToken ?? '');
    } catch {
      /* handled below */
    }
    if (!idToken) {
      return refuse(400, 'Sign-in could not be completed. Please try again.', 'No ID token in request body.');
    }

    let user;
    try {
      user = await verifyFirebaseIdToken(idToken);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      if (/expired/i.test(detail)) {
        return refuse(401, 'That sign-in has expired. Please try again.', `Token expired: ${detail}`);
      }
      return refuse(401, 'Sign-in could not be verified. Please try again.', `Verification failed: ${detail}`);
    }

    if (!isAllowed(user.email)) {
      return refuse(
        403,
        'That account is not permitted to manage this memorial.',
        `Refused ${user.email || 'unknown address'} — not in ADMIN_EMAILS.`
      );
    }

    const token = await mintSessionToken({
      uid: user.uid,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, token, cookieOptions);
    return response;
  } catch (error) {
    return refuse(
      500,
      UNAVAILABLE,
      `Unexpected failure: ${error instanceof Error ? `${error.message}\n${error.stack}` : String(error)}`
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return response;
}
