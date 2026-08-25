import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminApp, firebaseAdminConfigured, adminConfigProblem } from '@/lib/firebase';
import { mintSessionToken, isAllowed, allowedEmails, SESSION_COOKIE, cookieOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Visitors never see the reason; it goes to the server log for whoever runs the site. */
function refuse(status: number, publicMessage: string, logDetail: string) {
  console.error(`[sign-in] ${logDetail}`);
  // Set DEBUG_AUTH=1 in the environment to see the cause in the browser too.
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
    if (!firebaseAdminConfigured()) {
      return refuse(503, UNAVAILABLE, `Firebase Admin not configured. ${adminConfigProblem() ?? ''}`);
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

    let decoded;
    try {
      decoded = await getAuth(adminApp()).verifyIdToken(idToken, true);
    } catch (error) {
      const code = (error as { code?: string })?.code ?? '';
      const detail = error instanceof Error ? error.message : String(error);

      if (code === 'auth/id-token-expired' || code === 'auth/id-token-revoked') {
        return refuse(401, 'That sign-in has expired. Please try again.', `Token rejected: ${code}`);
      }
      // A malformed service account shows up here rather than at start-up.
      if (/PEM|DECODER|private key|credential/i.test(detail)) {
        return refuse(503, UNAVAILABLE, `Service account rejected by Google: ${detail}`);
      }
      return refuse(401, 'Sign-in could not be verified. Please try again.', `verifyIdToken failed: ${detail}`);
    }

    if (!isAllowed(decoded.email)) {
      return refuse(
        403,
        'That account is not permitted to manage this memorial.',
        `Refused ${decoded.email ?? 'unknown address'} — not in ADMIN_EMAILS.`
      );
    }

    const token = await mintSessionToken({
      uid: decoded.uid,
      email: decoded.email ?? '',
      name: decoded.name ?? decoded.email ?? '',
      picture: decoded.picture ?? '',
    });

    // Attaching the cookie to the response is the reliable way to do this
    // inside a Route Handler.
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
