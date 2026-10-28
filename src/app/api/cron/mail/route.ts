import { NextResponse } from 'next/server';
import { query, hasDatabase } from '@/lib/db';
import { flushOutbox, enqueueNotice, buildDigestNotice } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Scheduled job (see vercel.json). Does two things:
 *   1. Retries any email that could not be sent earlier.
 *   2. Once a day (?digest=1), sends ONE summary of what is still waiting for
 *      review, so nothing sits unseen. Sends nothing when nothing is waiting.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Without a matching
 * secret the route refuses, so strangers cannot trigger it.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization') ?? '';
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }
  if (!hasDatabase()) return NextResponse.json({ ok: false, error: 'No database.' }, { status: 503 });

  const url = new URL(request.url);
  let queuedDigest = false;

  if (url.searchParams.get('digest') === '1') {
    const rows = await query<{ label: string; n: number; path: string }>(
      `SELECT 'tributes' AS label, count(*)::int AS n, '/tributes' AS path FROM tributes WHERE status = 'pending'
       UNION ALL SELECT 'guestbook messages', count(*)::int, '/guestbook' FROM guestbook WHERE status = 'pending'
       UNION ALL SELECT 'stories', count(*)::int, '/stories' FROM stories WHERE status = 'pending'
       UNION ALL SELECT 'photographs', count(*)::int, '/photos' FROM photos WHERE status = 'pending'`
    );
    const waiting = rows.filter((r) => r.n > 0);
    if (waiting.length > 0) {
      await enqueueNotice(buildDigestNotice(waiting));
      queuedDigest = true;
    }
  }

  const result = await flushOutbox(40);
  return NextResponse.json({ ok: true, queuedDigest, ...result });
}
