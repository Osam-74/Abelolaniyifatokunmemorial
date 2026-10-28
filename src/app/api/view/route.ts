import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { query, hasDatabase } from '@/lib/db';
import { clientIpFrom, hashIp } from '@/lib/clientIp';
import { rateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Counts a visit. Fire-and-forget: a failure here must never affect a visitor.
 * One count per visitor per 30 minutes, so refreshing or scripting the endpoint
 * cannot inflate the number. Extra hits are answered normally but not counted.
 */
export async function POST() {
  if (!hasDatabase()) return NextResponse.json({ views: 0 });
  try {
    const store = await headers();
    const hash = hashIp(clientIpFrom((n) => store.get(n)));
    const seen = await rateLimit(`view:${hash}`, 1, 1800);

    if (!seen.ok) {
      const rows = await query<{ count: string }>(`SELECT count FROM site_stats WHERE key = 'views'`);
      return NextResponse.json({ views: Number(rows[0]?.count ?? 0) });
    }
    const rows = await query<{ count: string }>(
      `INSERT INTO site_stats (key, count, updated_at) VALUES ('views', 1, now())
       ON CONFLICT (key) DO UPDATE SET count = site_stats.count + 1, updated_at = now()
       RETURNING count`
    );
    return NextResponse.json({ views: Number(rows[0]?.count ?? 0) });
  } catch {
    return NextResponse.json({ views: 0 });
  }
}
