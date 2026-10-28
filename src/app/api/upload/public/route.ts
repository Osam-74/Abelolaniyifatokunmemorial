import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { firebaseConfigured, uploadToFirebase } from '@/lib/firebase';
import { hasDatabase } from '@/lib/db';
import { clientIpFrom, hashIp } from '@/lib/clientIp';
import { rateLimit, logSecurityEvent, tooManyResponse } from '@/lib/rateLimit';
import { sameOrigin } from '@/lib/csrf';
import { cleanVisitorImage, randomObjectName } from '@/lib/imageSafety';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_BYTES = 2 * 1024 * 1024;
const PER_HOUR = 5;
const PER_DAY = 15;

/**
 * Anyone may send a photograph, so this is deliberately tighter than the
 * admin endpoint. Every file is checked by its real bytes (not the extension
 * or Content-Type), size- and dimension-limited, re-encoded (which strips
 * EXIF/GPS) and stored under a random name. Nothing uploaded here appears on
 * the site until the family approves it.
 */
export async function POST(request: Request) {
  if (!firebaseConfigured()) {
    return NextResponse.json({ error: 'Photograph uploads are not available at the moment.' }, { status: 503 });
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: 'Not available at the moment.' }, { status: 503 });
  }

  const store = await headers();
  if (!sameOrigin((n) => store.get(n))) {
    return NextResponse.json({ error: 'That request was not accepted.' }, { status: 403 });
  }

  const hash = hashIp(clientIpFrom((n) => store.get(n)));
  const hour = await rateLimit(`upload:public:${hash}:h`, PER_HOUR, 3600);
  const day = hour.ok ? await rateLimit(`upload:public:${hash}:d`, PER_DAY, 86400) : hour;
  if (!hour.ok || !day.ok) {
    await logSecurityEvent('rate_limited', 'api:upload/public', hash);
    return tooManyResponse(
      (!hour.ok ? hour : day).retryAfter,
      'You have sent several photographs already. Please come back later today.'
    );
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No photograph was received.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'That image is larger than 2 MB.' }, { status: 400 });
    }

    let clean;
    try {
      clean = await cleanVisitorImage(Buffer.from(await file.arrayBuffer()));
    } catch (error) {
      await logSecurityEvent('bad_image', 'api:upload/public', hash);
      return NextResponse.json({ error: error instanceof Error ? error.message : 'That file was not accepted.' }, { status: 400 });
    }

    const safe = new File([new Uint8Array(clean.buffer)], randomObjectName(clean.ext), { type: clean.contentType });
    const { url } = await uploadToFirebase(safe, `memorial/contributed/${safe.name}`);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[public upload]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'The upload failed. Please try again.' }, { status: 500 });
  }
}
