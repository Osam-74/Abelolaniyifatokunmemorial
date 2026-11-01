import Link from 'next/link';
import Reveal from '@/components/Reveal';
import MemorialSidebar from '@/components/MemorialSidebar';
import TributeComposer from '@/components/TributeComposer';
import TributeIcon from '@/components/TributeIcon';
import RichText from '@/components/RichText';
import { getProfile, getSetting, safeQuery, formatDate } from '@/lib/content';
import { isHeld } from '@/lib/eventState';

export const revalidate = 30;
export const metadata = { title: 'Tributes' };

type Tribute = {
  id: number; name: string; relationship: string; location: string;
  message: string; kind: string; created_at: string;
};
type EventRow = {
  id: number; title: string; event_date: string | null; time_label: string;
  venue: string; address: string; livestream_url: string; held_state: string;
};

export default async function TributesPage() {
  const [profile, intro, tributes, events] = await Promise.all([
    getProfile(),
    getSetting<{ heading: string; body: string; quote: string }>('intro'),
    safeQuery<Tribute>(
      `SELECT id, name, relationship, location, message, kind, created_at FROM tributes
       WHERE status = 'approved' ORDER BY featured DESC, created_at DESC LIMIT 60`
    ),
    safeQuery<EventRow>(
      `SELECT id, title, event_date, time_label, venue, address, livestream_url, held_state
       FROM events ORDER BY event_date NULLS LAST, sort_order LIMIT 3`
    ),
  ]);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-10 md:px-10 md:py-14 lg:grid-cols-[1fr_300px] lg:gap-12">
      <div className="min-w-0 space-y-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-util text-[0.72rem] uppercase tracking-[0.16em] text-deep">In his memory</p>
            <h2 className="mt-1 text-[length:var(--text-display)] leading-[1.05]">Tributes</h2>
            <p className="mt-2 max-w-xl text-[0.98rem] text-ink/60">
              Words from family and friends who knew him. Add your own so it can be kept with the rest.
            </p>
          </div>
          <a href="#tribute" className="btn btn-primary shrink-0">Write a tribute</a>
        </header>

        {intro.quote && (
          <Reveal>
            <blockquote className="relative pl-10">
              <span
                className="absolute left-0 top-0 font-display text-6xl leading-none text-soft"
                aria-hidden="true"
              >
                “
              </span>
              <p className="font-display text-[clamp(1.3rem,3vw,2rem)] italic leading-[1.35] text-deep">
                {intro.quote}
              </p>
            </blockquote>
          </Reveal>
        )}

        <Reveal>
          <div className="space-y-5">
            {profile.deathDate && (
              <p className="flex items-start gap-3 text-[0.98rem] text-ink/75">
                <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-deep" aria-hidden="true" />
                <span>
                  Passed away on {formatDate(profile.deathDate)}
                  {profile.birthPlace && ` · ${profile.birthPlace}`}
                </span>
              </p>
            )}

            {intro.heading && (
              <h2 className="text-[length:var(--text-title)] leading-tight">{intro.heading}</h2>
            )}

            <RichText value={intro.body} className="leading-relaxed text-ink/80" />
          </div>
        </Reveal>

        {events.length > 0 && (
          <Reveal>
            <div className="space-y-6">
              {events.map((event) => (
                <div key={event.id} className="border-l-2 border-bright pl-5">
                  <p className="font-display text-lg text-ink">
                    {event.title}
                    {isHeld(event) && (
                      <span className="ml-3 rounded-full bg-ink/8 px-2.5 py-0.5 align-middle font-util text-[0.6rem] uppercase tracking-[0.12em] text-ink/55">
                        Held
                      </span>
                    )}
                  </p>
                  <dl className="mt-2 space-y-1 text-[0.95rem] text-deep">
                    {event.event_date && (
                      <div className="flex gap-2">
                        <dt className="font-medium">Date:</dt>
                        <dd>{formatDate(event.event_date)}</dd>
                      </div>
                    )}
                    {event.time_label && (
                      <div className="flex gap-2">
                        <dt className="font-medium">Time:</dt>
                        <dd>{event.time_label}</dd>
                      </div>
                    )}
                    {(event.venue || event.address) && (
                      <div className="flex gap-2">
                        <dt className="font-medium">Location:</dt>
                        <dd>{[event.venue, event.address].filter(Boolean).join(', ')}</dd>
                      </div>
                    )}
                  </dl>
                  {event.livestream_url && (
                    <a
                      href={event.livestream_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-[0.9rem] text-bright underline underline-offset-4"
                    >
                      {isHeld(event) ? 'Watch the recorded service' : 'Link to the service'}
                    </a>
                  )}
                </div>
              ))}
              <Link href="/events" className="inline-block font-util text-[0.7rem] uppercase tracking-[0.12em] text-deep">
                Services &amp; photographs from the day →
              </Link>
            </div>
          </Reveal>
        )}

        <Reveal>
          <p className="font-medium leading-relaxed text-ink">
            The Fatokun family would like to thank you for your presence, fortifying prayers,
            comforting messages and outpouring of love.
          </p>
        </Reveal>

        <section className="scroll-mt-28">
          <h3 className="font-display text-xl text-ink/80">
            {tributes.length > 0 ? `${tributes.length} ${tributes.length === 1 ? 'tribute' : 'tributes'} so far` : 'Be the first to write'}
          </h3>

          {tributes.length === 0 ? (
            <p className="mt-5 text-ink/60">No tributes yet. Yours would be the first.</p>
          ) : (
            <ul className="mt-7 space-y-3">
              {tributes.map((tribute, i) => (
                <li key={tribute.id}>
                  <Reveal delay={Math.min(i, 8) * 40}>
                    <article className="lift flex gap-4 rounded-sm border border-ink/10 bg-mist/35 p-5">
                      <div className="shrink-0 pt-0.5">
                        <TributeIcon kind={tribute.kind} size={40} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-util text-[0.9rem] font-medium text-deep">{tribute.name}</p>
                        <p className="font-util text-[0.72rem] text-ink/45">
                          {formatDate(tribute.created_at)}
                          {tribute.relationship && ` · ${tribute.relationship}`}
                        </p>
                        <p className="mt-2.5 whitespace-pre-line leading-relaxed text-ink/80">
                          {tribute.message}
                        </p>
                      </div>
                    </article>
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </section>

        <TributeComposer />
      </div>

      <MemorialSidebar />
    </div>
  );
}
