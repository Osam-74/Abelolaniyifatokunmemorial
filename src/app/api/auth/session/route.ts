import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminApp, firebaseAdminConfigured } from '@/lib/firebase';
import { createSession, destroySession, isAllowed, allowedEmails } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * Exchanges a Firebase ID token for this site's own session cookie.
 *
 * Firebase proves identity; we decide authorisation here, then issue a short
 * JWT the Edge middleware can verify without the Admin SDK.
 */
export async function POST(request: Request) {
  if (!firebaseAdminConfigured()) {
    return NextResponse.json(
      { error: 'Firebase is not configured on the server. Add the service-account variables.' },
      { status: 501 }
    );
  }

  if (allowedEmails().length === 0) {
    return NextResponse.json(
      { error: 'No administrators are configured. Set ADMIN_EMAILS in the environment variables.' },
      { status: 501 }
    );
  }

  let idToken: string;
  try {
    const body = await request.json();
    idToken = String(body.idToken ?? '');
    if (!idToken) throw new Error('missing');
  } catch {
    return NextResponse.json({ error: 'No sign-in token was received.' }, { status: 400 });
  }

  try {
    // checkRevoked catches accounts disabled or signed out in the Firebase console.
    const decoded = await getAuth(adminApp()).verifyIdToken(idToken, true);

    if (!isAllowed(decoded.email)) {
      return NextResponse.json(
        {
          error:
            'That account is not permitted to manage this memorial. Ask for your address to be added.',
        },
        { status: 403 }
      );
    }

    if (decoded.firebase?.sign_in_provider === 'password' && decoded.email_verified === false) {
      // Not fatal, but worth knowing about; accounts are created by hand anyway.
      console.warn(`Sign-in by unverified email address: ${decoded.email}`);
    }

    await createSession({
      uid: decoded.uid,
      email: decoded.email ?? '',
      name: decoded.name ?? decoded.email ?? '',
      picture: decoded.picture ?? '',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = (error as { code?: string })?.code ?? '';
    if (code === 'auth/id-token-expired' || code === 'auth/id-token-revoked') {
      return NextResponse.json({ error: 'That sign-in has expired. Please try again.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Could not verify that sign-in.' }, { status: 401 });
  }
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
