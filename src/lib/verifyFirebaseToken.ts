import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * Verifies a Firebase ID token directly against Google's public keys.
 *
 * firebase-admin/auth is deliberately not used here: it depends on jwks-rsa,
 * which is CommonJS but requires jose v6, which is ESM only. That combination
 * throws ERR_REQUIRE_ESM inside a serverless bundle. A Firebase ID token is an
 * ordinary RS256 JWT, so verifying it with jose is both simpler and one fewer
 * moving part. firebase-admin is still used for Storage, which does not touch
 * that dependency.
 */

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export type FirebaseUser = {
  uid: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string;
  signInProvider: string;
};

export function firebaseProjectId(): string | null {
  if (process.env.FIREBASE_PROJECT_ID) return process.env.FIREBASE_PROJECT_ID;
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.trim());
      if (parsed.project_id) return String(parsed.project_id);
    } catch {
      /* handled by the caller */
    }
  }
  return null;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseUser> {
  const projectId = firebaseProjectId();
  if (!projectId) throw new Error('No Firebase project id is configured.');

  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ['RS256'],
  });

  const uid = String(payload.sub ?? payload.user_id ?? '');
  if (!uid) throw new Error('Token carries no user id.');

  const firebase = payload.firebase as { sign_in_provider?: string } | undefined;

  return {
    uid,
    email: String(payload.email ?? ''),
    emailVerified: payload.email_verified === true,
    name: String(payload.name ?? payload.email ?? ''),
    picture: String(payload.picture ?? ''),
    signInProvider: firebase?.sign_in_provider ?? 'unknown',
  };
}
