import Link from 'next/link';
import SignOutButton from '@/components/admin/SignOutButton';
import { getSession } from '@/lib/auth';
import { COLLECTIONS } from '@/lib/collections';
import { safeQuery } from '@/lib/content';
import { getAdminBase } from '@/lib/adminPath';

export const metadata = { title: 'Admin', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

async function pendingCounts(): Promise<Record<string, number>> {
  const moderated = COLLECTIONS.filter((c) => c.moderated);
  const counts: Record<string, number> = {};
  await Promise.all(
    moderated.map(async (collection) => {
      const rows = await safeQuery<{ n: number }>(
        `SELECT count(*)::int AS n FROM ${collection.table} WHERE status = 'pending'`
      );
      counts[collection.slug] = rows[0]?.n ?? 0;
    })
  );
  return counts;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // The sign-in page renders on its own.
  if (!session) return <>{children}</>;

  const [counts, base] = await Promise.all([pendingCounts(), getAdminBase()]);
  const groups = ['Moderation', 'Content'] as const;

  return (
    <div className="min-h-screen bg-[#eef7fb] text-ink">
      <header className="border-b border-ink/12 bg-paper">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <Link href={base} className="font-display text-lg leading-none">
              Memorial admin
            </Link>
            <span className="hidden font-util text-[0.68rem] uppercase tracking-[0.12em] text-ink/40 sm:inline">
              {session.username}
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/"
              target="_blank"
              className="font-util text-[0.68rem] uppercase tracking-[0.12em] text-ink/50 transition-colors hover:text-ink"
            >
              View the website ↗
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-8 md:px-8 lg:grid-cols-[220px_1fr] lg:gap-12">
        <nav aria-label="Admin sections" className="lg:sticky lg:top-8 lg:self-start">
          <Link
            href={base}
            className="block rounded-sm px-3 py-2 font-util text-sm transition-colors hover:bg-ink/[0.06]"
          >
            Overview
          </Link>
          <Link
            href={`${base}/settings`}
            className="block rounded-sm px-3 py-2 font-util text-sm transition-colors hover:bg-ink/[0.06]"
          >
            Website settings
          </Link>

          {groups.map((group) => (
            <div key={group} className="mt-6">
              <p className="px-3 font-util text-[0.62rem] uppercase tracking-[0.16em] text-ink/35">
                {group}
              </p>
              <div className="mt-1.5">
                {COLLECTIONS.filter((c) => c.group === group).map((collection) => (
                  <Link
                    key={collection.slug}
                    href={`${base}/${collection.slug}`}
                    className="flex items-center justify-between gap-2 rounded-sm px-3 py-2 font-util text-sm transition-colors hover:bg-ink/[0.06]"
                  >
                    <span>{collection.label}</span>
                    {counts[collection.slug] > 0 && (
                      <span className="rounded-full bg-deep px-1.5 py-0.5 text-[0.62rem] font-medium text-mist">
                        {counts[collection.slug]}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
