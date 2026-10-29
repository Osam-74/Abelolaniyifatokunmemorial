import Link from 'next/link';
import SetupPanel from '@/components/admin/SetupPanel';
import { COLLECTIONS } from '@/lib/collections';
import { getProfile, getSetting, safeQuery } from '@/lib/content';
import { hasDatabase } from '@/lib/db';
import { resolveAudio } from '@/lib/resolveAudio';
import { getAdminBase } from '@/lib/adminPath';
import { formatDate } from '@/lib/content';
import { mailProvider, notifyRecipients } from '@/lib/mail';
import { turnstileEnabled } from '@/lib/turnstile';
import { findPublishedSpam } from './tools-actions';
import { TestEmailButton, RejectSpamButton } from '@/components/admin/ToolButtons';

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
  const audio = await getSetting<{ trackUrl: string; title: string }>('audio');
  const track = resolveAudio(audio.trackUrl, audio.title);
  const intro = await getSetting<{ body: string }>('intro');

  const tablesReady = Object.keys(counts).length > 0;

  // Biography health, recent activity and protection stats (all best-effort: a failure shows nothing, never an error).
  const [chapterStats, noAlt, recent, blocked, outbox, publishedSpam] = connected
    ? await Promise.all([
        safeQuery<{ published: number; drafts: number }>(
          `SELECT count(*) FILTER (WHERE status = 'published' AND deleted_at IS NULL)::int AS published,
                  count(*) FILTER (WHERE status <> 'published' AND deleted_at IS NULL)::int AS drafts FROM bio_sections`
        ),
        safeQuery<{ n: number }>(
          `SELECT count(*)::int AS n FROM bio_sections WHERE deleted_at IS NULL AND image_url <> '' AND coalesce(image_alt, '') = ''`
        ),
        safeQuery<{ admin_email: string; action: string; entity: string; detail: string; created_at: string }>(
          `SELECT admin_email, action, entity, detail, created_at FROM admin_audit_log ORDER BY id DESC LIMIT 8`
        ),
        safeQuery<{ kind: string; n: number }>(
          `SELECT kind, count(*)::int AS n FROM security_events WHERE created_at > now() - interval '7 days' GROUP BY kind`
        ),
        safeQuery<{ status: string; n: number }>(`SELECT status, count(*)::int AS n FROM email_outbox GROUP BY status`),
        findPublishedSpam().catch(() => []),
      ])
    : [[], [], [], [], [], []];

  const published = chapterStats[0]?.published ?? 0;
  const drafts = chapterStats[0]?.drafts ?? 0;
  const blockedTotal = (blocked as { n: number }[]).reduce((a, b) => a + b.n, 0);
  const queued = (outbox as { status: string; n: number }[]).find((o) => o.status === 'queued')?.n ?? 0;
  const failedMail = (outbox as { status: string; n: number }[]).find((o) => o.status === 'failed')?.n ?? 0;
  const provider = mailProvider();

  const todo = [
    !profile.birthDate && { label: 'Add his date of birth', href: `${base}/settings#profile` },
    !profile.deathDate && { label: 'Add his date of passing', href: `${base}/settings#profile` },
    (counts.photos?.total ?? 0) < 3 && { label: 'Upload family photographs', href: `${base}/photos` },
    (counts.timeline?.total ?? 0) < 3 && { label: 'Build out the timeline', href: `${base}/timeline` },
    published === 0 && { label: 'Publish the first chapter of his life story', href: `${base}/biography` },
    drafts > 0 && { label: `Review ${drafts} unpublished ${drafts === 1 ? 'chapter' : 'chapters'}`, href: `${base}/biography` },
    (noAlt[0] as { n: number } | undefined)?.n ? { label: `Describe ${(noAlt[0] as { n: number }).n} chapter ${(noAlt[0] as { n: number }).n === 1 ? 'photograph' : 'photographs'} for screen readers`, href: `${base}/biography` } : false,
    provider === 'none' && { label: 'Connect email so you are told about new tributes', href: `${base}/settings#email` },
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

      <SetupPanel connected={connected} tablesReady={tablesReady} />

      {track.warning && (
        <div className="rounded-sm border border-flame/50 bg-flame/10 px-6 py-5">
          <h2 className="font-display text-xl">Background music</h2>
          <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-ink/75">{track.warning}</p>
        </div>
      )}

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

      {(publishedSpam as unknown[]).length > 0 && (
        <div className="rounded-sm border border-flame/50 bg-flame/10 px-6 py-5">
          <h2 className="font-display text-xl">
            {(publishedSpam as unknown[]).length} published {(publishedSpam as unknown[]).length === 1 ? 'message looks' : 'messages look'} like advertising
          </h2>
          <p className="mt-1 max-w-2xl text-[0.9rem] text-ink/65">
            These were posted before approval was switched on. They are not removed automatically, so a real tribute is never hidden by mistake. Open each list and choose Reject on the ones you agree are spam.
          </p>
          <ul className="mt-3 space-y-1.5 text-[0.85rem] text-ink/70">
            {(publishedSpam as Array<{ table: string; id: number; name: string; preview: string }>).slice(0, 12).map((x) => (
              <li key={`${x.table}-${x.id}`}>
                <Link href={`${base}/${x.table}`} className="underline decoration-ink/20 underline-offset-4 hover:text-deep">
                  {x.name || 'Unknown'} ({x.table})
                </Link>
                <span className="text-ink/45">: {x.preview}…</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tablesReady && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 rounded-sm border border-ink/12 bg-paper p-5">
            <h2 className="font-display text-lg">Life story</h2>
            <p className="text-[0.9rem] text-ink/65">{published} published · {drafts} {drafts === 1 ? 'draft' : 'drafts'}</p>
            <Link href={`${base}/biography`} className="font-util text-[0.7rem] uppercase tracking-[0.1em] text-deep underline underline-offset-4">Manage chapters</Link>
          </div>
          <div className="space-y-3 rounded-sm border border-ink/12 bg-paper p-5">
            <h2 className="font-display text-lg">Email notices</h2>
            <p className="text-[0.9rem] text-ink/65">
              {provider === 'none'
                ? 'Not connected yet. New tributes are saved and will be emailed once it is.'
                : `Connected (${provider}). Sending to ${notifyRecipients().length} ${notifyRecipients().length === 1 ? 'address' : 'addresses'}.`}
              {queued > 0 && ` ${queued} waiting to send.`}
              {failedMail > 0 && ` ${failedMail} could not be sent.`}
            </p>
            <TestEmailButton />
          </div>
          <div className="space-y-3 rounded-sm border border-ink/12 bg-paper p-5">
            <h2 className="font-display text-lg">Spam protection</h2>
            <p className="text-[0.9rem] text-ink/65">
              {blockedTotal} automatic {blockedTotal === 1 ? 'block' : 'blocks'} in the last 7 days.
              {turnstileEnabled() ? ' The “I am a person” check is on.' : ' The “I am a person” check is not switched on yet.'}
            </p>
            <RejectSpamButton />
          </div>
        </div>
      )}

      {(recent as unknown[]).length > 0 && (
        <div className="rounded-sm border border-ink/12 bg-paper p-6">
          <h2 className="font-display text-xl">Recent changes</h2>
          <ul className="mt-3 space-y-1.5 text-[0.88rem] text-ink/70">
            {(recent as Array<{ admin_email: string; action: string; entity: string; detail: string; created_at: string }>).map((r, i) => (
              <li key={i}>
                <span className="text-ink/45">{formatDate(String(r.created_at))}</span> · {r.admin_email.split('@')[0]} · {r.action.replace(/[:_-]/g, ' ')} ({r.entity}){r.detail ? `: ${r.detail}` : ''}
              </li>
            ))}
          </ul>
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
