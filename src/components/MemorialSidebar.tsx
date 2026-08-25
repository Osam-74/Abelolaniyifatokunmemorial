import Image from 'next/image';
import Link from 'next/link';
import ShareRow from './ShareRow';
import { safeQuery, formatDate } from '@/lib/content';

type Photo = { id: number; url: string; caption: string };
type EventRow = { id: number; title: string; event_date: string | null; time_label: string; venue: string };

export default async function MemorialSidebar() {
  const [photos, photoCount, candleCount, nextEvent] = await Promise.all([
    safeQuery<Photo>('SELECT id, url, caption FROM photos ORDER BY featured DESC, sort_order, id LIMIT 4'),
    safeQuery<{ n: number }>('SELECT count(*)::int AS n FROM photos'),
    safeQuery<{ n: number }>("SELECT count(*)::int AS n FROM candles WHERE status = 'approved'"),
    safeQuery<EventRow>(
      `SELECT id, title, event_date, time_label, venue FROM events
       WHERE event_date >= current_date ORDER BY event_date LIMIT 1`
    ),
  ]);

  const totalPhotos = photoCount[0]?.n ?? 0;
  const candles = candleCount[0]?.n ?? 0;
  const event = nextEvent[0];

  return (
    <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
      {event && (
        <div className="rounded-sm border border-deep/25 bg-mist/60 p-6">
          <p className="eyebrow text-deep">Next gathering</p>
          <p className="mt-3 font-display text-xl leading-snug">{event.title}</p>
          <p className="mt-2 text-[0.92rem] text-ink/65">
            {formatDate(event.event_date)}
            {event.time_label && ` · ${event.time_label}`}
          </p>
          {event.venue && <p className="mt-0.5 text-[0.92rem] text-ink/55">{event.venue}</p>}
          <Link href="/events" className="btn btn-ghost mt-5 w-full">
            Details &amp; directions
          </Link>
        </div>
      )}

      <div className="rounded-sm border border-ink/12 bg-paper p-6">
        <p className="eyebrow text-deep">Remembrance</p>
        <p className="mt-3 font-display text-4xl leading-none text-ink">
          {candles.toLocaleString('en-NG')}
        </p>
        <p className="mt-1.5 text-[0.9rem] text-ink/55">
          {candles === 1 ? 'candle lit' : 'candles lit'} in his memory
        </p>
        <Link href="/candles" className="btn btn-primary mt-5 w-full">
          Light a candle
        </Link>
      </div>

      {photos.length > 0 && (
        <div className="rounded-sm border border-ink/12 bg-mist/45 p-6">
          <p className="eyebrow text-deep">
            {totalPhotos} {totalPhotos === 1 ? 'photograph' : 'photographs'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {photos.map((photo) => (
              <Link
                key={photo.id}
                href="/gallery"
                className="relative aspect-square overflow-hidden rounded-sm bg-paper"
              >
                <Image
                  src={photo.url}
                  alt={photo.caption || ''}
                  fill
                  sizes="140px"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </Link>
            ))}
          </div>
          <Link href="/gallery" className="btn btn-ghost mt-5 w-full">
            Open the gallery
          </Link>
        </div>
      )}

      <div className="rounded-sm border border-ink/12 bg-paper p-6">
        <p className="eyebrow text-deep">Share this memorial</p>
        <ShareRow className="mt-4" />
      </div>
    </aside>
  );
}
