import 'server-only';
import { cert, getApp, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

/**
 * Firebase Admin, initialised from environment variables only.
 * Nothing Firebase-related is ever sent to the browser: uploads go through
 * /api/upload, which runs on the server and is behind the admin session.
 */

function serviceAccount(): ServiceAccount | null {
  // Preferred: the whole service-account JSON in one variable.
  const blob = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (blob) {
    try {
      const parsed = JSON.parse(blob);
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: String(parsed.private_key).replace(/\\n/g, '\n'),
      };
    } catch {
      return null;
    }
  }

  // Alternative: the three fields separately.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') };
  }

  return null;
}

export function firebaseConfigured(): boolean {
  return Boolean(serviceAccount() && process.env.FIREBASE_STORAGE_BUCKET);
}

/** Auth only needs the service account; storage additionally needs a bucket. */
export function firebaseAdminConfigured(): boolean {
  return Boolean(serviceAccount());
}

export function adminApp() {
  if (getApps().length) return getApp();
  const credential = serviceAccount();
  if (!credential) throw new Error('Firebase service account credentials are missing.');
  return initializeApp({
    credential: cert(credential),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export function bucket() {
  return getStorage(adminApp()).bucket(process.env.FIREBASE_STORAGE_BUCKET);
}

/**
 * Uploads a file and returns a permanently readable URL.
 * Files are made public rather than signed, so the links never expire —
 * a memorial should still work in twenty years without a token refresh.
 */
export async function uploadToFirebase(
  file: File,
  path: string
): Promise<{ url: string; path: string }> {
  const target = bucket().file(path);
  const buffer = Buffer.from(await file.arrayBuffer());

  await target.save(buffer, {
    contentType: file.type || 'application/octet-stream',
    resumable: false,
    metadata: {
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  await target.makePublic();

  return {
    url: `https://storage.googleapis.com/${bucket().name}/${encodeURI(path)}`,
    path,
  };
}

export async function deleteFromFirebase(path: string): Promise<void> {
  await bucket().file(path).delete({ ignoreNotFound: true });
}
