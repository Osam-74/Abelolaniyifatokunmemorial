import AdminShell, { type AdminNavSection } from '@/components/admin/AdminShell';
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

// One icon per collection, picked to read at a glance in the sidebar —
// matches AdminIcon's shared dictionary (see AdminIcon.tsx).
const COLLECTION_ICON: Record<string, string> = {
  biography: 'book',
  timeline: 'clock',
  legacy: 'book',
  photos: 'image',
  videos: 'play',
  events: 'calendar',
  quotes: 'quote',
  media: 'image',
  tributes: 'heart',
  stories: 'message',
  guestbook: 'message',
  candles: 'flame',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // The sign-in and reset pages render on their own.
  if (!session) return <>{children}</>;

  const [counts, base] = await Promise.all([pendingCounts(), getAdminBase()]);
  const groups = ['Moderation', 'Content'] as const;

  const sections: AdminNavSection[] = [
    {
      label: 'Dashboard',
      items: [
        { href: base, label: 'Overview', icon: 'grid' },
        { href: `${base}/settings`, label: 'Website settings', icon: 'settings' },
      ],
    },
    ...groups.map((group) => ({
      label: group,
      items: COLLECTIONS.filter((c) => c.group === group).map((collection) => ({
        href: `${base}/${collection.slug}`,
        label: collection.label,
        icon: COLLECTION_ICON[collection.slug] ?? 'grid',
        badge: counts[collection.slug] > 0 ? counts[collection.slug] : undefined,
      })),
    })),
  ];

  return (
    <AdminShell base={base} email={session.email} sections={sections} loginHref={`${base}/login`}>
      {children}
    </AdminShell>
  );
}
