import 'server-only';
import { safeQuery } from './content';
import { sanitizeHtml, htmlToText, readingMinutes } from './sanitizeHtml';

export type Chapter = {
  id: number;
  slug: string;
  heading: string;
  subheading: string;
  periodLabel: string;
  bodyHtml: string;
  pullQuote: string;
  quoteAttribution: string;
  imageUrl: string;
  imageAlt: string;
  imageCaption: string;
  focalX: number;
  focalY: number;
  layout: 'auto' | 'image-left' | 'image-right' | 'full-width' | 'text-only';
  showInRail: boolean;
  minutes: number;
};

type Row = {
  id: number; heading: string; subheading: string | null; period_label: string | null; body: string | null;
  pull_quote: string | null; quote_attribution: string | null; image_url: string | null; image_alt: string | null;
  image_caption: string | null; focal_x: number | null; focal_y: number | null; layout: string | null;
  show_in_rail: boolean | null;
};

const LAYOUTS = ['auto', 'image-left', 'image-right', 'full-width', 'text-only'] as const;

/** URL-safe anchor from a heading, unique within the list. */
export function chapterSlugs(headings: string[]): string[] {
  const seen = new Map<string, number>();
  return headings.map((h) => {
    const base = h.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'chapter';
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  });
}

const clamp = (n: number | null | undefined) => Math.min(100, Math.max(0, Number.isFinite(n as number) ? (n as number) : 50));

/** Published, not-deleted chapters in the family's chosen order. */
export async function getPublishedChapters(): Promise<Chapter[]> {
  const rows = await safeQuery<Row>(
    `SELECT id, heading, subheading, period_label, body, pull_quote, quote_attribution, image_url, image_alt,
            image_caption, focal_x, focal_y, layout, show_in_rail
       FROM bio_sections
      WHERE status = 'published' AND deleted_at IS NULL
      ORDER BY sort_order, id`
  );
  const slugs = chapterSlugs(rows.map((r) => r.heading));
  return rows.map((r, i) => {
    const bodyHtml = sanitizeHtml(r.body ?? '');
    const layout = (LAYOUTS as readonly string[]).includes(r.layout ?? '') ? (r.layout as Chapter['layout']) : 'auto';
    return {
      id: r.id,
      slug: slugs[i],
      heading: r.heading,
      subheading: r.subheading ?? '',
      periodLabel: r.period_label ?? '',
      bodyHtml,
      pullQuote: r.pull_quote ?? '',
      quoteAttribution: r.quote_attribution ?? '',
      imageUrl: r.image_url ?? '',
      imageAlt: r.image_alt || r.heading,
      imageCaption: r.image_caption ?? '',
      focalX: clamp(r.focal_x),
      focalY: clamp(r.focal_y),
      layout,
      showInRail: r.show_in_rail !== false,
      minutes: readingMinutes(r.body ?? ''),
    };
  });
}

export function totalReadingMinutes(chapters: Chapter[]): number {
  return Math.max(1, chapters.reduce((n, c) => n + c.minutes, 0));
}

export function firstSentences(html: string, max = 200): string {
  const t = htmlToText(html).replace(/\s+/g, ' ');
  return t.length <= max ? t : `${t.slice(0, max).replace(/\s+\S*$/, '')}…`;
}
