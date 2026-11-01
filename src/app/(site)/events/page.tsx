import Image from 'next/image';
import RichText from '@/components/RichText';
import MemorialSidebar from '@/components/MemorialSidebar';
import Reveal from '@/components/Reveal';
import GalleryGrid, { type Photo } from '@/components/GalleryGrid';
import EventPhotoButton from '@/components/EventPhotoButton';
import { safeQuery, formatDate } from '@/lib/content';
import { isHeld } from '@/lib/eventState';
import { ensureSchema, hasDatabase } from '@/lib/db';

// Always rendered fresh from the database — this page was once cached as a
// static snapshot (revalidate) taken before the "flyer" column existed, so a
// build-time query failure could bake an empty page in until the next
// deploy. force-dynamic means every visit re-reads the database directly.
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Funeral & Events' };

type EventRow = {
  // Postgres `date` columns come back from `pg` as native Date objects, not
  // strings — the type here reflects that reality.
  id: number; title: string; event_date: string | Date | null; time_label: string;
  venue: string; address: string; map_query: string; livestream_url: string; description: string;
  flyer_url: string; held_state: string; held_note: string;
};
type EventPhoto = Photo & { event_id: number | null };

export default async function EventsPage() {
  // Belt-and-suspenders: make sure the schema (including newer columns like
  // flyer_url) is applied before the query below ever runs, rather than
  // relying only on the reactive retry-after-error path.
  if (hasDatabase()) await ensureSchema().catch(() => undefined);

  const events = await safeQuery<EventRow>(
    `SELECT id, title, event_date, time_label, venue, address, map_query, livestream_url, description, flyer_url,
            held_state, held_note
     FROM events ORDER BY event_date NULLS LAST, sort_order, id`
  );

  // Photographs belong to an event either by being linked to it, or by sitting in an album named after it.
  const photos = await safeQuery<EventPhoto>(
    `SELECT id, url, caption, album, taken_on, event_id FROM photos
      WHERE status = 'approved' AND (event_id IS NOT NULL OR album IN (SELECT title FROM events))
      ORDER BY sort_order, id`
  );
  const photosFor = (event: EventRow): Photo[] =>
    photos.filter((p) => p.event_id === event.id || (p.event_id === null && p.album === event.title));

  const upcoming = events.filter((e) => !isHeld(e));
  // Most recent first: the service everyone is looking for should not sit at the bottom.
  const past = events.filter((e) => isHeld(e)).reverse();

  const renderEvent = (event: EventRow, isPast: boolean) => (
    <Reveal key={event.id}>
      <article className="border-t border-ink/12 py-10">
        {event.flyer_url && (
          <div className="relative mb-8 aspect-[3/2] max-w-2xl overflow-hidden rounded-sm border border-ink/10 bg-paper">
            <Image
              src={event.flyer_url}
              alt={`Flyer for ${event.title}`}
              fill
              sizes="(max-width: 1024px) 90vw, 640px"
              className="object-contain"
            />
          </div>
        )}
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        <div>
          {event.event_date && (
            <p className="font-util text-[0.72rem] uppercase tracking-[0.16em] text-deep">
              {formatDate(event.event_date)}
              {event.time_label && ` · ${event.time_label}`}
            </p>
          )}
          {isPast && (
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 font-util text-[0.64rem] uppercase tracking-[0.14em] text-mist">
              <span className="h-1.5 w-1.5 rounded-full bg-flame" aria-hidden="true" />
              This service has been held
            </p>
          )}
          <h2 className="mt-3 text-[length:var(--text-title)] leading-tight">{event.title}</h2>
          {isPast && event.held_note && <p className="mt-3 font-display text-lg italic text-deep">{event.held_note}</p>}
          {event.venue && <p className="mt-4 font-display text-xl text-ink/80">{event.venue}</p>}
          {event.address && <p className="mt-1 text-[0.95rem] text-ink/60">{event.address}</p>}

          {event.description && (
            <RichText value={event.description} className="mt-6 leading-relaxed text-ink/70" />
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            {(event.map_query || event.address) && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  event.map_query || `${event.venue} ${event.address}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                Open in Maps
              </a>
            )}
            {event.livestream_url && (
              <a href={event.livestream_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                {isPast ? 'Watch the recording' : 'Watch the livestream'}
              </a>
            )}
          </div>
        </div>

        {(event.map_query || event.address) && (
          <div className="overflow-hidden rounded-sm border border-ink/12 bg-mist">
            <iframe
              title={`Map of ${event.venue || event.title}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[260px] w-full md:h-[340px]"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                event.map_query || `${event.venue} ${event.address}`
              )}&output=embed`}
            />
          </div>
        )}
        </div>

        {isPast && (
          <div className="mt-12" id={`photos-${event.id}`}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <h3 className="font-display text-2xl">Photographs from the day</h3>
              <EventPhotoButton eventId={event.id} eventTitle={event.title} />
            </div>
            {photosFor(event).length > 0 ? (
              <GalleryGrid photos={photosFor(event)} />
            ) : (
              <p className="rounded-sm border border-dashed border-ink/20 bg-mist/25 px-5 py-8 text-center text-[0.95rem] text-ink/55">
                Photographs from this day will be added here. If you were there, you are welcome to share yours.
              </p>
            )}
          </div>
        )}
      </article>
    </Reveal>
  );

  return (
    <>
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-10 md:px-10 md:py-14 lg:grid-cols-[1fr_300px] lg:gap-12">
        <div className="min-w-0">
          <h2 className="text-[length:var(--text-title)]">
            {upcoming.length === 0 && past.length > 0
              ? 'Remembering the day'
              : 'Where family, friends and loved ones gather'}
          </h2>
          <div className="mt-8">
          {events.length === 0 ? (
            <p className="text-ink/60">Details will appear here once they are confirmed.</p>
          ) : (
            <>
              {upcoming.length > 0 && <div>{upcoming.map((e) => renderEvent(e, false))}</div>}
              {past.length > 0 && (
                <>
                  <p className={`eyebrow text-ink/40 ${upcoming.length > 0 ? 'mt-16' : 'mt-2'}`}>Already held</p>
                  <div className="mt-4">{past.map((e) => renderEvent(e, true))}</div>
                </>
              )}
            </>
          )}
          </div>
        </div>

        <MemorialSidebar />
      </div>
    </>
  );
}
