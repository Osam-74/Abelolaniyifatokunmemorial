import Image from 'next/image';
import RichText from '@/components/RichText';
import MemorialSidebar from '@/components/MemorialSidebar';
import Reveal from '@/components/Reveal';
import { safeQuery, formatDate } from '@/lib/content';
import { ensureSchema, hasDatabase } from '@/lib/db';

// Always rendered fresh from the database — this page was once cached as a
// static snapshot (revalidate) taken before the "flyer" column existed, so a
// build-time query failure could bake an empty page in until the next
// deploy. force-dynamic means every visit re-reads the database directly.
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Funeral & Events' };

type EventRow = {
  id: number; title: string; event_date: string | null; time_label: string;
  venue: string; address: string; map_query: string; livestream_url: string; description: string;
  flyer_url: string;
};

export default async function EventsPage() {
  // Belt-and-suspenders: make sure the schema (including newer columns like
  // flyer_url) is applied before the query below ever runs, rather than
  // relying only on the reactive retry-after-error path.
  if (hasDatabase()) await ensureSchema().catch(() => undefined);

  const events = await safeQuery<EventRow>(
    `SELECT id, title, event_date, time_label, venue, address, map_query, livestream_url, description, flyer_url
     FROM events ORDER BY event_date NULLS LAST, sort_order, id`
  );

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => !e.event_date || e.event_date >= today);
  const past = events.filter((e) => e.event_date && e.event_date < today);

  const renderEvent = (event: EventRow, isPast: boolean) => (
    <Reveal key={event.id}>
      <article className={`border-t border-ink/12 py-10 ${isPast ? 'opacity-70' : ''}`}>
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
          <h2 className="mt-3 text-[length:var(--text-title)] leading-tight">{event.title}</h2>
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
      </article>
    </Reveal>
  );

  return (
    <>
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-10 md:px-10 md:py-14 lg:grid-cols-[1fr_300px] lg:gap-12">
        <div className="min-w-0">
          <h1 className="text-[length:var(--text-title)]">
            Where family, friends and loved ones gather
          </h1>
          <div className="mt-8">
          {events.length === 0 ? (
            <p className="text-ink/60">Details will appear here once they are confirmed.</p>
          ) : (
            <>
              {upcoming.length > 0 && <div>{upcoming.map((e) => renderEvent(e, false))}</div>}
              {past.length > 0 && (
                <>
                  <p className="eyebrow mt-16 text-ink/40">Already held</p>
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
