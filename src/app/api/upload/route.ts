import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { firebaseConfigured, uploadToFirebase } from '@/lib/firebase';
import { sameOrigin } from '@/lib/csrf';
import { rateLimit, tooManyResponse } from '@/lib/rateLimit';
import { sniffImageType } from '@/lib/imageSafety';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'audio/mpeg'];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB — larger images are resized in the browser first

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });
  }

  const store = await headers();
  if (!sameOrigin((n) => store.get(n))) {
    return NextResponse.json({ error: 'That request was not accepted.' }, { status: 403 });
  }
  // Generous (a batch upload sends many files) but not unlimited.
  const limited = await rateLimit(`upload:admin:${session.email}`, 200, 3600);
  if (!limited.ok) return tooManyResponse(limited.retryAfter, 'Too many uploads. Please wait a little and try again.');

  const usingFirebase = firebaseConfigured();
  const usingBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  if (!usingFirebase && !usingBlob) {
    return NextResponse.json(
      {
        error:
          'File storage is not connected. Add the Firebase service-account variables to the project, or paste a link to an image instead.',
      },
      { status: 501 }
    );
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file was received.' }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Use a JPG, PNG, WebP, GIF or MP3 file.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error:
          'That file is larger than 2 MB. Images are resized automatically before upload — if you are seeing this, the original was extremely large.',
      },
      { status: 400 }
    );
  }

  // Trust the file's own bytes, not the Content-Type the browser claimed.
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const isMp3 = file.type === 'audio/mpeg'
    && ((head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0));
  if (!isMp3 && !sniffImageType(head)) {
    return NextResponse.json({ error: 'That file does not look like a real image or MP3.' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-80);
  const key = `memorial/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  try {
    if (usingFirebase) {
      const { url, path } = await uploadToFirebase(file, key);
      return NextResponse.json({ url, path, storage: 'firebase' });
    }

    // Kept as a fallback so the admin keeps working if Firebase is ever unavailable.
    const { put } = await import('@vercel/blob');
    const blob = await put(key, file, { access: 'public', addRandomSuffix: true });
    return NextResponse.json({ url: blob.url, path: blob.pathname, storage: 'blob' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'The upload failed.' },
      { status: 500 }
    );
  }
}
