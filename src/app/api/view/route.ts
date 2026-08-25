import { NextResponse } from 'next/server';
import { query, hasDatabase } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Counts a visit. Fire-and-forget: a failure here must never affect a visitor. */
export async function POST() {
  if (!hasDatabase()) return NextResponse.json({ views: 0 });
  try {
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
