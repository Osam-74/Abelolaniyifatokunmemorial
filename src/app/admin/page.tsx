import Link from 'next/link';
import SetupPanel from '@/components/admin/SetupPanel';
import { COLLECTIONS } from '@/lib/collections';
import { getProfile, getSetting, safeQuery } from '@/lib/content';
import { hasDatabase } from '@/lib/db';
import { getAdminBase } from '@/lib/adminPath';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const connected = hasDatabase();

  const counts: Record<string, { total: number; pending: number }> = {};
  if (connected) {
    await Promise.all(
      COLLECTIONS.map(async (collection) => {
        const rows = await safeQuery<{ total: number; pending: number }>(
          collection.moderated
            ? `SELECT count(*)::int AS total, count(*) FILTER (WHERE status = 'pending')::int AS pending FROM ${collection.table}`
            : `SELECT count(*)::int AS total, 0 AS pending FROM ${collection.table}`
        );
        counts[collection.slug] = rows[0] ?? { total: 0, pending: 0 };
      })
    );
  }

  const base = await getAdminBase();
  const profile = await getProfile();
  const intro = await getSetting<{ body: string }>('intro');

  const tablesReady = Object.keys(counts).length > 0;

  const todo = [
    !profile.birthDate && { label: 'Add his date of birth', href: `${base}/settings#profile` },
    !profile.deathDate && { label: 'Add his date of passing', href: `${base}/settings#profile` },
    (counts.photos?.total ?? 0) < 3 && { label: 'Upload family photographs', href: `${base}/photos` },
    (counts.timeline?.total ?? 0) < 3 && { label: 'Build out the timeline', href: `${base}/timeline` },
    intro.body.includes('Edit this section') && {
      label: 'Replace the placeholder biography text',
      href: `${base}/biography`,
    },
    (counts.videos?.total ?? 0) === 0 && { label: 'Add a tribute video', href: `${base}/videos` },
  ].filter(Boolean) as { label: string; href: string }[];

  const pendingTotal = Object.values(counts).reduce((sum, c) => sum + c.pending, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Overview</h1>
        <p className="mt-2 text-ink/60">
          Everything on the memorial is edited from here. Changes appear on the website within a minute.
        </p>
      </div>

      {(!connected || !tablesReady) && <SetupPanel connected={connected} />}

      {pendingTotal > 0 && (
        <div className="rounded-sm border border-deep/30 bg-bright/10 px-6 py-5">
          <p className="font-display text-xl">
            {pendingTotal} {pendingTotal === 1 ? 'submission is' : 'submissions are'} waiting for you
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {COLLECTIONS.filter((c) => c.moderated && (counts[c.slug]?.pending ?? 0) > 0).map((c) => (
              <Link
                key={c.slug}
                href={`${base}/${c.slug}`}
                className="rounded-full border border-deep/40 bg-paper px-4 py-1.5 font-util text-[0.7rem] uppercase tracking-[0.1em] text-deep transition-colors hover:bg-deep hover:text-mist"
              >
                {counts[c.slug].pending} {c.label.toLowerCase()}
              </Link>
            ))}
          </div>
        </div>
      )}

      {tablesReady && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((collection) => (
            <Link
              key={collection.slug}
              href={`${base}/${collection.slug}`}
              className="group rounded-sm border border-ink/12 bg-paper p-5 transition-colors hover:border-ink/35"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-lg transition-colors group-hover:text-deep">
                  {collection.label}
                </p>
                <span className="font-util text-sm text-ink/45">{counts[collection.slug]?.total ?? 0}</span>
              </div>
              <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink/55">{collection.description}</p>
              {(counts[collection.slug]?.pending ?? 0) > 0 && (
                <p className="mt-3 font-util text-[0.68rem] uppercase tracking-[0.11em] text-deep">
                  {counts[collection.slug].pending} waiting
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {todo.length > 0 && tablesReady && (
        <div className="rounded-sm border border-ink/12 bg-paper p-6">
          <h2 className="font-display text-xl">Still to do</h2>
          <p className="mt-1 text-[0.9rem] text-ink/55">
            The website works without these, but it will feel finished once they are in.
          </p>
          <ul className="mt-4 space-y-2">
            {todo.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="font-util text-sm text-ink/75 underline decoration-ink/20 underline-offset-4 transition-colors hover:text-deep"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
