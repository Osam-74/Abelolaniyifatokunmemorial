import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { firebaseConfigured, uploadToFirebase } from '@/lib/firebase';
import { query, queryOne, hasDatabase } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 30;

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 2 * 1024 * 1024;
const PER_HOUR = 8;

/**
 * Anyone may send a photograph, so this is deliberately tighter than the
 * admin endpoint: images only, no audio, and a per-visitor hourly cap.
 * Nothing uploaded here appears on the site until the family approves it.
 */
export async function POST(request: Request) {
  if (!firebaseConfigured()) {
    return NextResponse.json(
      { error: 'Photograph uploads are not available at the moment.' },
      { status: 503 }
    );
  }
  if (!hasDatabase()) {
    return NextResponse.json({ error: 'Not available at the moment.' }, { status: 503 });
  }

  try {
    const store = await headers();
    const ip =
      store.get('x-forwarded-for')?.split(',')[0]?.trim() || store.get('x-real-ip') || 'unknown';
    const hash = createHash('sha256').update(`${ip}:memorial`).digest('hex').slice(0, 32);

    const recent = await queryOne<{ n: number }>(
      `SELECT count(*)::int AS n FROM submission_log
       WHERE ip_hash = $1 AND kind = 'photo' AND created_at > now() - interval '1 hour'`,
      [hash]
    );
    if ((recent?.n ?? 0) >= PER_HOUR) {
      return NextResponse.json(
        { error: 'You have sent several photographs already. Please come back later today.' },
        { status: 429 }
      );
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No photograph was received.' }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: 'Use a JPG, PNG or WebP image.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'That image is larger than 2 MB.' }, { status: 400 });
    }

    await query('INSERT INTO submission_log (ip_hash, kind) VALUES ($1, $2)', [hash, 'photo']);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-80);
    const key = `memorial/contributed/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { url } = await uploadToFirebase(file, key);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[public upload]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'The upload failed. Please try again.' }, { status: 500 });
  }
}
