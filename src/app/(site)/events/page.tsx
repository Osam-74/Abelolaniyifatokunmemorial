import Image from 'next/image';
import PageHeader from '@/components/PageHeader';
import Reveal from '@/components/Reveal';
import EmptyState from '@/components/EmptyState';
import { safeQuery, formatDate } from '@/lib/content';

export const revalidate = 60;
export const metadata = { title: 'Funeral & Events' };

type EventRow = {
  id: number; title: string; event_date: string | null; time_label: string;
  venue: string; address: string; map_query: string; livestream_url: string; description: string;
};

export default async function EventsPage() {
  const events = await safeQuery<EventRow>(
    `SELECT id, title, event_date, time_label, venue, address, map_query, livestream_url, description
     FROM events ORDER BY event_date NULLS LAST, sort_order, id`
  );

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => !e.event_date || e.event_date >= today);
  const past = events.filter((e) => e.event_date && e.event_date < today);

  const renderEvent = (event: EventRow, isPast: boolean) => (
    <Reveal key={event.id}>
      <article
        className={`grid gap-8 border-t border-ink/12 py-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14 ${
          isPast ? 'opacity-70' : ''
        }`}
      >
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
            <div className="prose-memorial mt-6 leading-relaxed text-ink/70">
              {event.description.split('\n\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
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
      </article>
    </Reveal>
  );

  return (
    <>
      <PageHeader
        eyebrow="Funeral & Events"
        title="Where the family gathers"
        intro="Service details, venues and directions. Once a gathering has passed, it stays here as part of the record."
      />

      <section className="bg-paper py-[length:var(--spacing-section)]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          {events.length === 0 ? (
            <EmptyState
              title="No events have been listed yet"
              hint="The family can add services, venues, times and livestream links from the admin dashboard."
            />
          ) : (
            <>
              {upcoming.length > 0 && (
                <>
                  <p className="eyebrow text-deep">Upcoming</p>
                  <div className="mt-6">{upcoming.map((e) => renderEvent(e, false))}</div>
                </>
              )}
              {past.length > 0 && (
                <>
                  <p className="eyebrow mt-20 text-ink/40">Already held</p>
                  <div className="mt-6">{past.map((e) => renderEvent(e, true))}</div>
                </>
              )}
            </>
          )}
        </div>
      </section>

      <section className="border-t border-ink/10 bg-mist/40 py-16">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 md:px-10 lg:grid-cols-[1fr_1.4fr]">
          <div className="relative aspect-[3/2] overflow-hidden rounded-sm border border-ink/10 bg-paper">
            <Image
              src="/images/burial-flier.jpg"
              alt="Announcement of the final burial ceremony and thanksgiving service"
              fill
              sizes="(max-width: 1024px) 90vw, 460px"
              className="object-contain"
            />
          </div>
          <div>
            <p className="eyebrow text-deep">The announcement</p>
            <h2 className="mt-3 text-[length:var(--text-title)]">The family's invitation</h2>
            <p className="mt-4 max-w-lg leading-relaxed text-ink/65">
              The original announcement of the final burial ceremony and thanksgiving service,
              kept here as part of the record.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
