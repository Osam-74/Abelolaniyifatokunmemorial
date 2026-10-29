import Link from 'next/link';
import Disclosure from '@/components/admin/Disclosure';
import ChapterForm, { type ChapterRow } from '@/components/admin/ChapterForm';
import { ChapterToolbar, TrashToolbar, RevisionList, type Revision } from '@/components/admin/ChapterActions';
import { safeQuery, formatDate } from '@/lib/content';
import { getAdminBase } from '@/lib/adminPath';
import { htmlToText } from '@/lib/sanitizeHtml';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Biography sections', robots: { index: false } };

type Row = ChapterRow & { sort_order: number; deleted_at: string | null; updated_at: string | null; updated_by: string | null };
type Rev = Revision & { section_id: number };

export default async function BiographyAdmin() {
  const base = await getAdminBase();
  const rows = await safeQuery<Row>('SELECT * FROM bio_sections ORDER BY sort_order, id');
  const revs = await safeQuery<Rev>(
    `SELECT r.id, r.section_id, r.created_at, r.saved_by, coalesce(r.snapshot->>'heading', '') AS heading
       FROM bio_revisions r ORDER BY r.created_at DESC, r.id DESC`
  );

  const live = rows.filter((r) => !r.deleted_at);
  const trash = rows.filter((r) => r.deleted_at);
  const published = live.filter((r) => r.status === 'published').length;
  const drafts = live.length - published;
  const revFor = (id: number) => revs.filter((r) => r.section_id === id).slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Biography sections</h1>
        <p className="mt-2 max-w-2xl text-ink/60">
          The chapters of his life story, shown on the About page. Write a chapter, check how it looks, then publish it.
          Nothing appears on the website until you press Publish.
        </p>
        <p className="mt-3 font-util text-[0.78rem] text-ink/50">
          {published} published · {drafts} {drafts === 1 ? 'draft' : 'drafts'}{trash.length > 0 && ` · ${trash.length} in the trash`}
        </p>
      </div>

      <Disclosure defaultOpen={live.length === 0} summary={<span className="font-display text-lg">Add a new chapter</span>}>
        <ChapterForm onDoneReset />
      </Disclosure>

      {live.length === 0 ? (
        <div className="rounded-sm border border-dashed border-ink/20 bg-paper px-6 py-12 text-center">
          <p className="font-display text-lg text-ink/75">No chapters yet</p>
          <p className="mt-1.5 text-[0.9rem] text-ink/50">
            Use the panel above to write the first one. A good place to start is where and when he was born.
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {live.map((row, i) => {
            const excerpt = htmlToText(row.body ?? '').slice(0, 140);
            const isPub = row.status === 'published';
            return (
              <li key={row.id} className="rounded-sm border border-ink/12 bg-white">
                <Disclosure
                  tone="plain"
                  summary={
                    <span className="block">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-util text-[0.7rem] tabular-nums text-ink/40">{String(i + 1).padStart(2, '0')}</span>
                        <span className="font-display text-lg leading-snug">{row.heading || 'Untitled chapter'}</span>
                        <span className={`rounded-full px-2.5 py-0.5 font-util text-[0.6rem] uppercase tracking-[0.1em] ${isPub ? 'bg-deep/12 text-deep' : 'bg-flame/25 text-[#8a4b00]'}`}>
                          {isPub ? 'Published' : 'Draft (hidden)'}
                        </span>
                      </span>
                      <span className="mt-1 block font-util text-[0.72rem] text-ink/45">
                        {[row.period_label, row.updated_at ? `Edited ${formatDate(String(row.updated_at))}` : '', row.updated_by ? `by ${row.updated_by}` : ''].filter(Boolean).join(' · ')}
                      </span>
                      {excerpt && <span className="mt-1 block text-[0.85rem] text-ink/55">{excerpt}{excerpt.length >= 140 ? '…' : ''}</span>}
                    </span>
                  }
                >
                  <div className="space-y-7">
                    <ChapterToolbar id={row.id} status={row.status} first={i === 0} last={i === live.length - 1} previewHref={`${base}/biography/preview/${row.id}`} />
                    <ChapterForm chapter={row} />
                    <div>
                      <h3 className="mb-2 font-display text-lg">Earlier versions</h3>
                      <RevisionList revisions={revFor(row.id)} />
                    </div>
                  </div>
                </Disclosure>
              </li>
            );
          })}
        </ol>
      )}

      {trash.length > 0 && (
        <Disclosure summary={<span className="font-display text-lg">Trash ({trash.length})</span>}>
          <ul className="space-y-4">
            {trash.map((row) => (
              <li key={row.id} className="space-y-2 border-b border-ink/10 pb-4 last:border-0 last:pb-0">
                <p className="font-display text-lg">{row.heading}</p>
                <p className="font-util text-[0.72rem] text-ink/45">Moved to trash {row.deleted_at ? formatDate(String(row.deleted_at)) : ''}</p>
                <TrashToolbar id={row.id} />
              </li>
            ))}
          </ul>
        </Disclosure>
      )}

      <p className="font-util text-[0.78rem] text-ink/45">
        <Link href={`${base}`} className="underline underline-offset-4">Back to the overview</Link>
      </p>
    </div>
  );
}
