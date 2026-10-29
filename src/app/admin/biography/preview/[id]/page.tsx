import { notFound } from 'next/navigation';
import BiographyChapter from '@/components/BiographyChapter';
import { queryOne } from '@/lib/db';
import { sanitizeHtml, readingMinutes } from '@/lib/sanitizeHtml';
import type { Chapter } from '@/lib/biography';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Chapter preview', robots: { index: false, follow: false } };

type Row = Record<string, string | number | boolean | null> & { id: number };

/** Shows one chapter exactly as visitors will see it, even if it is still a draft. Admin only (the admin layout enforces sign-in). */
export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n)) notFound();
  const r = await queryOne<Row>('SELECT * FROM bio_sections WHERE id = $1', [n]);
  if (!r) notFound();

  const layouts = ['auto', 'image-left', 'image-right', 'full-width', 'text-only'];
  const chapter: Chapter = {
    id: r.id, slug: 'preview', heading: String(r.heading ?? ''), subheading: String(r.subheading ?? ''),
    periodLabel: String(r.period_label ?? ''), bodyHtml: sanitizeHtml(String(r.body ?? '')), pullQuote: String(r.pull_quote ?? ''),
    quoteAttribution: String(r.quote_attribution ?? ''), imageUrl: String(r.image_url ?? ''),
    imageAlt: String(r.image_alt || r.heading || ''), imageCaption: String(r.image_caption ?? ''),
    focalX: Number(r.focal_x ?? 50), focalY: Number(r.focal_y ?? 50),
    layout: (layouts.includes(String(r.layout)) ? r.layout : 'auto') as Chapter['layout'],
    showInRail: true, minutes: readingMinutes(String(r.body ?? '')),
  };

  return (
    <div className="space-y-5">
      <div className="rounded-sm border border-flame/50 bg-flame/15 px-4 py-3 text-[0.9rem] text-[#6b3a00]">
        Preview only. {r.status === 'published' && !r.deleted_at ? 'This chapter is live on the About page.' : 'Visitors cannot see this chapter yet.'}
      </div>
      <div className="max-w-5xl rounded-sm border border-ink/10 bg-paper p-6 md:p-10">
        <BiographyChapter chapter={chapter} index={0} />
      </div>
    </div>
  );
}
