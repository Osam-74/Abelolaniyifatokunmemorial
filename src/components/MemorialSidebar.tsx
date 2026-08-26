import Link from 'next/link';
import ShareRow from './ShareRow';
import TributeIcon from './TributeIcon';
import FadingGallery from './FadingGallery';
import { safeQuery, getSetting, formatDate } from '@/lib/content';

type Photo = { id: number; url: string; caption: string };
type EventRow = {
  id: number; title: string; event_date: string | null;
  time_label: string; venue: string; upcoming: boolean;
};

export default async function MemorialSidebar() {
  const [photos, photoCount, counts, views, nextEvent, contact] = await Promise.all([
    safeQuery<Photo>('SELECT id, url, caption FROM photos ORDER BY featured DESC, sort_order, id LIMIT 12'),
    safeQuery<{ n: number }>('SELECT count(*)::int AS n FROM photos'),
    safeQuery<{ kind: string; n: number }>(
      `SELECT kind, count(*)::int AS n FROM tributes WHERE status = 'approved' GROUP BY kind`
    ),
    safeQuery<{ count: string }>("SELECT count FROM site_stats WHERE key = 'views'"),
    // Prefer the next gathering; if none is dated ahead, fall back to the most
    // recent one so the box never simply vanishes.
    safeQuery<EventRow>(
      `SELECT id, title, event_date, time_label, venue,
              (event_date IS NOT NULL AND event_date >= current_date) AS upcoming
       FROM events
       ORDER BY (event_date IS NOT NULL AND event_date >= current_date) DESC,
                CASE WHEN event_date >= current_date THEN event_date END ASC NULLS LAST,
                event_date DESC NULLS LAST,
                sort_order
       LIMIT 1`
    ),
    getSetting<{ contactEmail: string; phones: string[] }>('footer'),
  ]);

  const tally = (kind: string) => counts.find((row) => row.kind === kind)?.n ?? 0;
  const totals = [
    { kind: 'candle', label: 'Candles lit', value: tally('candle') },
    { kind: 'flower', label: 'Flowers laid', value: tally('flower') },
    { kind: 'note', label: 'Notes left', value: tally('note') },
  ];

  const totalPhotos = photoCount[0]?.n ?? 0;
  const viewCount = Number(views[0]?.count ?? 0);
  const event = nextEvent[0];

  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <div className="rounded-sm border border-ink/12 bg-paper p-5">
        <p className="eyebrow text-deep">In his memory</p>
        <ul className="mt-4 space-y-1">
          {totals.map((item) => (
            <li key={item.kind} className="flex items-center gap-3 border-b border-ink/8 py-2 last:border-0">
              <TributeIcon kind={item.kind} size={30} />
              <span className="font-display text-2xl leading-none text-ink">
                {item.value.toLocaleString('en-NG')}
              </span>
              <span className="font-util text-[0.72rem] uppercase tracking-[0.1em] text-ink/50">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
        <Link href="/about#tribute" className="btn btn-primary mt-5 w-full">
          Leave a tribute
        </Link>
      </div>

      {event && (
        <div className="rounded-sm border border-deep/25 bg-mist/60 p-5">
          <p className="eyebrow text-deep">{event.upcoming ? 'Next gathering' : 'Most recent gathering'}</p>
          <p className="mt-3 font-display text-lg leading-snug">{event.title}</p>
          <p className="mt-2 text-[0.9rem] text-ink/65">
            {formatDate(event.event_date)}
            {event.time_label && ` · ${event.time_label}`}
          </p>
          {event.venue && <p className="mt-0.5 text-[0.9rem] text-ink/55">{event.venue}</p>}
          <Link href="/events" className="btn btn-ghost mt-4 w-full">
            Details
          </Link>
        </div>
      )}

      {photos.length > 0 && (
        <div className="rounded-sm border border-ink/12 bg-mist/45 p-5">
          <p className="eyebrow text-deep">
            {totalPhotos} {totalPhotos === 1 ? 'photograph' : 'photographs'}
          </p>
          <div className="mt-4">
            <FadingGallery photos={photos} />
          </div>
          <Link href="/gallery" className="btn btn-ghost mt-4 w-full">
            Open the gallery
          </Link>
        </div>
      )}

      <div className="flex items-center gap-3 rounded-sm border border-ink/12 bg-mist/60 px-5 py-4">
        <svg width="20" height="14" viewBox="0 0 22 15" aria-hidden="true" fill="none">
          <path d="M11 1C5.5 1 1.8 5.3 1 7.5c.8 2.2 4.5 6.5 10 6.5s9.2-4.3 10-6.5C20.2 5.3 16.5 1 11 1z" stroke="#0077B6" strokeWidth="1.4" />
          <circle cx="11" cy="7.5" r="3" stroke="#0077B6" strokeWidth="1.4" />
        </svg>
        <span className="font-display text-2xl leading-none text-ink">
          {viewCount.toLocaleString('en-NG')}
        </span>
        <span className="font-util text-[0.72rem] uppercase tracking-[0.1em] text-ink/50">Views</span>
      </div>

      {(contact.phones?.length > 0 || contact.contactEmail) && (
        <div className="rounded-sm border border-ink/12 bg-paper p-5">
          <p className="eyebrow text-deep">Contact the family</p>
          <p className="mt-2.5 text-[0.88rem] leading-relaxed text-ink/60">
            His children welcome your call or message.
          </p>

          <div className="mt-4 space-y-2">
            {(contact.phones ?? []).map((phone) => (
              <a
                key={phone}
                href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                className="flex items-center gap-3 rounded-sm border border-ink/12 px-3.5 py-2.5 font-util text-[0.86rem] transition-colors hover:border-deep hover:bg-mist/50"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" fill="none">
                  <path
                    d="M3 1.5h2.2l1.1 3-1.5 1.1a9.5 9.5 0 0 0 4.6 4.6l1.1-1.5 3 1.1V12a2 2 0 0 1-2.2 2A12.5 12.5 0 0 1 1 3.7 2 2 0 0 1 3 1.5z"
                    stroke="#0077B6"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
                {phone}
              </a>
            ))}

            {contact.contactEmail && (
              <a
                href={`mailto:${contact.contactEmail}`}
                className="flex items-center gap-3 rounded-sm border border-ink/12 px-3.5 py-2.5 font-util text-[0.86rem] transition-colors hover:border-deep hover:bg-mist/50"
              >
                <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" fill="none">
                  <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="#0077B6" strokeWidth="1.3" />
                  <path d="M1.5 4 8 8.5 14.5 4" stroke="#0077B6" strokeWidth="1.3" />
                </svg>
                <span className="truncate">{contact.contactEmail}</span>
              </a>
            )}
          </div>
        </div>
      )}

      <div className="rounded-sm border border-ink/12 bg-paper p-5">
        <p className="eyebrow text-deep">Share this memorial</p>
        <ShareRow className="mt-4" />
      </div>
    </aside>
  );
}
