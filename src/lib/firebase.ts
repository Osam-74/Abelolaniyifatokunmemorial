import 'server-only';
import { cert, getApp, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

/**
 * Firebase Admin, initialised from environment variables only.
 * Nothing Firebase-related is ever sent to the browser: uploads and token
 * checks run on the server.
 */

/** Environment panels mangle multi-line keys in several predictable ways. */
function normalisePrivateKey(raw: string): string {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
  return key.endsWith('\n') ? key : `${key}\n`;
}

function serviceAccount(): ServiceAccount | null {
  const blob = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (blob) {
    try {
      const parsed = JSON.parse(blob.trim());
      if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: normalisePrivateKey(String(parsed.private_key)),
      };
    } catch {
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey: normalisePrivateKey(privateKey) };
  }

  return null;
}

/** Says exactly what is missing, for the server log only. */
export function adminConfigProblem(): string | null {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.trim());
      const missing = ['project_id', 'client_email', 'private_key'].filter((k) => !parsed[k]);
      return missing.length ? `FIREBASE_SERVICE_ACCOUNT is missing: ${missing.join(', ')}` : null;
    } catch {
      return 'FIREBASE_SERVICE_ACCOUNT is not valid JSON. Paste the whole downloaded file as one line.';
    }
  }
  if (process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_PRIVATE_KEY) {
    const missing = (
      [
        ['FIREBASE_PROJECT_ID', process.env.FIREBASE_PROJECT_ID],
        ['FIREBASE_CLIENT_EMAIL', process.env.FIREBASE_CLIENT_EMAIL],
        ['FIREBASE_PRIVATE_KEY', process.env.FIREBASE_PRIVATE_KEY],
      ] as const
    )
      .filter(([, value]) => !value)
      .map(([name]) => name);
    return missing.length ? `Missing: ${missing.join(', ')}` : null;
  }
  return 'FIREBASE_SERVICE_ACCOUNT is not set.';
}

export function firebaseConfigured(): boolean {
  return Boolean(serviceAccount() && process.env.FIREBASE_STORAGE_BUCKET);
}

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

/**
 * Firebase reports two different names for the same store and it is easy to
 * set the wrong one. Projects created before October 2024 use
 * <project>.appspot.com; newer ones use <project>.firebasestorage.app. The
 * console shows the download domain, which is not always the bucket name.
 */
function bucketCandidates(): string[] {
  const configured = (process.env.FIREBASE_STORAGE_BUCKET ?? '').trim().replace(/^gs:\/\//, '');
  const names: string[] = [];
  if (configured) names.push(configured);

  const base = configured.replace(/\.(appspot\.com|firebasestorage\.app)$/, '');
  if (base && base !== configured) {
    for (const suffix of ['firebasestorage.app', 'appspot.com']) {
      const alternate = `${base}.${suffix}`;
      if (!names.includes(alternate)) names.push(alternate);
    }
  }

  const project = serviceAccount()?.projectId;
  if (project) {
    for (const suffix of ['firebasestorage.app', 'appspot.com']) {
      const guess = `${project}.${suffix}`;
      if (!names.includes(guess)) names.push(guess);
    }
  }
  return names;
}

export function bucket(name?: string) {
  return getStorage(adminApp()).bucket(name ?? bucketCandidates()[0]);
}

/** Returns the first candidate that actually exists. */
export async function resolveBucketName(): Promise<{ name: string | null; tried: string[] }> {
  const tried = bucketCandidates();
  for (const name of tried) {
    try {
      const [exists] = await getStorage(adminApp()).bucket(name).exists();
      if (exists) return { name, tried };
    } catch {
      /* try the next candidate */
    }
  }
  return { name: null, tried };
}

export async function uploadToFirebase(
  file: File,
  path: string
): Promise<{ url: string; path: string }> {
  const { name, tried } = await resolveBucketName();
  if (!name) {
    throw new Error(
      `No Firebase Storage bucket could be found. Tried: ${tried.join(', ') || '(nothing configured)'}. ` +
        'Open the Firebase console, go to Storage, and check the bucket has been created — ' +
        'then copy its exact name into FIREBASE_STORAGE_BUCKET.'
    );
  }

  const target = bucket(name).file(path);
  const buffer = Buffer.from(await file.arrayBuffer());

  await target.save(buffer, {
    contentType: file.type || 'application/octet-stream',
    resumable: false,
    metadata: { cacheControl: 'public, max-age=31536000, immutable' },
  });
  await target.makePublic();

  return { url: `https://storage.googleapis.com/${name}/${encodeURI(path)}`, path };
}

export async function deleteFromFirebase(path: string): Promise<void> {
  await bucket().file(path).delete({ ignoreNotFound: true });
}
