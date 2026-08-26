import { NextResponse } from 'next/server';
import { adminConfigProblem, resolveBucketName } from '@/lib/firebase';
import { firebaseProjectId } from '@/lib/verifyFirebaseToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Reports which settings are present — never their values.
 * Visit /api/health to find out what is missing without reading server logs.
 */
export async function GET() {
  const storage = await resolveBucketName().catch(() => ({ name: null, tried: [] as string[] }));
  const secret = process.env.AUTH_SECRET ?? '';
  const emails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean);

  return NextResponse.json({
    database: { set: Boolean(process.env.DATABASE_URL) },
    authSecret: {
      set: Boolean(secret),
      longEnough: secret.length >= 24,
      length: secret.length,
    },
    adminEmails: { count: emails.length, ok: emails.length > 0 },
    signIn: {
      projectId: Boolean(firebaseProjectId()),
      ready: Boolean(firebaseProjectId()) && secret.length >= 24 && emails.length > 0,
    },
    firebaseStorage: {
      ok: adminConfigProblem() === null,
      problem: adminConfigProblem(),
      configuredBucket: process.env.FIREBASE_STORAGE_BUCKET ?? null,
      bucketFound: storage.name,
      bucketsTried: storage.tried,
    },
    firebaseBrowser: {
      // These are inlined at BUILD time. If any read false after you set them
      // in Vercel, you added them after the last deploy — redeploy to apply.
      apiKey: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
      authDomain: Boolean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
      projectId: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      appId: Boolean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
    },
    siteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
  });
}
