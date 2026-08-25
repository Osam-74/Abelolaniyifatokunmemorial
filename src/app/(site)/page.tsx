import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import Flame from '@/components/Flame';
import { getProfile, getSetting, safeQuery, lifespan, formatDate } from '@/lib/content';

export const revalidate = 60;

type Photo = { id: number; url: string; caption: string; album: string };
type Tribute = { id: number; name: string; relationship: string; location: string; message: string };
type Story = { id: number; slug: string; title: string; author_name: string; relationship: string; body: string };
type Milestone = { id: number; year: string; title: string; body: string };
type Candle = { id: number; name: string; message: string; created_at: string };
type Quote = { id: number; text: string; source: string };
type EventRow = { id: number; title: string; event_date: string | null; time_label: string; venue: string };

export default async function HomePage() {
  const [profile, intro, legacyIntro] = await Promise.all([
    getProfile(),
    getSetting<{ heading: string; body: string; quote: string }>('intro'),
    getSetting<{ heading: string; body: string }>('legacyIntro'),
  ]);

  const [photos, tributes, stories, milestones, candles, candleCount, quotes, upcoming] = await Promise.all([
    safeQuery<Photo>(
      `SELECT id, url, caption, album FROM photos ORDER BY featured DESC, sort_order, id LIMIT 7`
    ),
    safeQuery<Tribute>(
      `SELECT id, name, relationship, location, message FROM tributes
       WHERE status = 'approved' ORDER BY featured DESC, created_at DESC LIMIT 3`
    ),
    safeQuery<Story>(
      `SELECT id, slug, title, author_name, relationship, body FROM stories
       WHERE status = 'approved' ORDER BY featured DESC, created_at DESC LIMIT 2`
    ),
    safeQuery<Milestone>(`SELECT id, year, title, body FROM timeline ORDER BY sort_order, year LIMIT 4`),
    safeQuery<Candle>(
      `SELECT id, name, message, created_at FROM candles WHERE status = 'approved'
       ORDER BY created_at DESC LIMIT 18`
    ),
    safeQuery<{ n: number }>(`SELECT count(*)::int AS n FROM candles WHERE status = 'approved'`),
    safeQuery<Quote>(`SELECT id, text, source FROM quotes WHERE featured = true ORDER BY sort_order LIMIT 1`),
    safeQuery<EventRow>(
      `SELECT id, title, event_date, time_label, venue FROM events
       WHERE event_date >= current_date ORDER BY event_date LIMIT 1`
    ),
  ]);

  const years = lifespan(profile);
  const featured = photos[0];
  const gallery = photos.slice(1, 7);
  const total = candleCount[0]?.n ?? 0;
  const heroQuote = quotes[0]?.text || profile.heroQuote;
  const nextEvent = upcoming[0];

  return (
    <>
      {/* ─────────── 1. Hero ─────────── */}
      <section className="relative isolate min-h-[100svh] overflow-hidden bg-ink text-mist">
        <div
          className="absolute inset-0 -z-10 opacity-[0.14]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 70% 15%, #0077B6 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, #00B4D8 0%, transparent 55%)',
          }}
        />

        <div className="mx-auto grid min-h-[100svh] max-w-[1400px] grid-cols-1 items-center gap-10 px-5 pb-20 pt-28 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-24">
          <div className="order-2 lg:order-1">
            <p className="eyebrow text-soft/80">In loving memory of</p>

            <h1 className="mt-5 font-display text-[length:var(--text-hero)] leading-[0.86] tracking-[-0.035em]">
              <span className="block">Abel</span>
              <span className="block text-soft">Olaniyi</span>
              <span className="block">Fatokun</span>
            </h1>

            {years && (
              <p className="mt-7 font-util text-sm uppercase tracking-[0.34em] text-mist/60">{years}</p>
            )}

            <p className="mt-4 font-util text-[0.78rem] uppercase tracking-[0.2em] text-mist/45">
              {profile.tagline}
            </p>

            <p className="mt-8 max-w-lg font-display text-xl italic leading-snug text-mist/85 sm:text-2xl">
              “{heroQuote}”
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/about" className="btn btn-onink">
                His life story
              </Link>
              <Link href="/candles" className="btn bg-mist text-ink hover:bg-soft">
                Light a candle
              </Link>
            </div>
          </div>

          {/* Arched portrait — the frame motif repeated across the site */}
          <div className="order-1 lg:order-2">
            <div className="relative mx-auto w-full max-w-[420px] lg:max-w-[520px]">
              <div className="absolute -inset-3 rounded-t-full border border-mist/15 [border-bottom-left-radius:6px] [border-bottom-right-radius:6px]" />
              <div className="relative aspect-[3/4.1] overflow-hidden rounded-t-full rounded-b-sm bg-ink-70">
                <Image
                  src={profile.heroImageUrl || '/images/portrait.jpg'}
                  alt={`Portrait of ${profile.fullName}`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 520px"
                  className="hero-drift object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <span className="eyebrow text-mist/35">Scroll to remember</span>
        </div>
      </section>

      {/* ─────────── 2. Introduction ─────────── */}
      <section className="bg-paper py-[length:var(--spacing-section)]">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 md:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow text-deep">Who he was</p>
            <h2 className="mt-4 text-[length:var(--text-display)]">{intro.heading}</h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="prose-memorial text-lg leading-relaxed text-ink/75">
              {intro.body.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            {intro.quote && (
              <p className="mt-8 border-l-2 border-bright pl-6 font-display text-2xl italic text-ink">
                {intro.quote}
              </p>
            )}
            <Link href="/about" className="btn btn-ghost mt-9">
              Read his full story
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─────────── 3. Key life dates ─────────── */}
      <section className="border-y border-ink/10 bg-mist/45">
        <div className="mx-auto grid max-w-[1400px] divide-y divide-ink/10 px-5 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-10">
          {[
            { label: 'Born', value: formatDate(profile.birthDate) || 'To be added', sub: profile.birthPlace },
            { label: 'Passed away', value: formatDate(profile.deathDate) || 'To be added', sub: '' },
            {
              label: nextEvent ? 'Next gathering' : 'Remembered at',
              value: nextEvent ? formatDate(nextEvent.event_date) : 'Ilora, Oyo State',
              sub: nextEvent ? `${nextEvent.venue}${nextEvent.time_label ? ` · ${nextEvent.time_label}` : ''}` : '',
            },
          ].map((item) => (
            <div key={item.label} className="px-0 py-10 md:px-10">
              <p className="eyebrow text-deep">{item.label}</p>
              <p className="mt-3 font-display text-2xl leading-tight">{item.value}</p>
              {item.sub && <p className="mt-1.5 text-[0.95rem] text-ink/55">{item.sub}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── 4 & 5. Featured photograph + brief life story ─────────── */}
      {featured && (
        <section className="bg-paper py-[length:var(--spacing-section)]">
          <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-5 md:px-10 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <figure className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-sm bg-mist">
                <Image
                  src={featured.url}
                  alt={featured.caption || profile.fullName}
                  fill
                  sizes="(max-width: 1024px) 90vw, 600px"
                  className="object-cover object-top"
                />
              </figure>
              {featured.caption && (
                <figcaption className="mt-4 font-util text-[0.72rem] uppercase tracking-[0.14em] text-ink/45">
                  {featured.caption}
                </figcaption>
              )}
            </Reveal>

            <Reveal delay={120}>
              <p className="eyebrow text-deep">Milestones</p>
              <h2 className="mt-4 text-[length:var(--text-title)]">The shape of a long life</h2>
              <ol className="mt-9 space-y-8">
                {milestones.length > 0 ? (
                  milestones.map((m) => (
                    <li key={m.id} className="grid grid-cols-[4.5rem_1fr] gap-5 border-t border-ink/10 pt-5">
                      <span className="font-util text-sm tracking-[0.1em] text-deep">{m.year}</span>
                      <div>
                        <p className="font-display text-xl leading-snug">{m.title}</p>
                        {m.body && (
                          <p className="mt-1.5 line-clamp-3 text-[0.95rem] leading-relaxed text-ink/60">{m.body}</p>
                        )}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="border-t border-ink/10 pt-5 text-ink/55">
                    The family is still gathering the milestones of his life.
                  </li>
                )}
              </ol>
              <Link href="/timeline" className="btn btn-ghost mt-9">
                See the full timeline
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ─────────── 6. A quote ─────────── */}
      <section className="bg-ink py-[length:var(--spacing-section)] text-mist">
        <div className="mx-auto max-w-4xl px-5 text-center md:px-10">
          <Reveal>
            <p className="font-display text-[clamp(1.6rem,4vw,3rem)] italic leading-[1.25]">
              “{heroQuote}”
            </p>
            {quotes[0]?.source && (
              <p className="eyebrow mt-8 text-mist/45">{quotes[0].source}</p>
            )}
          </Reveal>
        </div>
      </section>

      {/* ─────────── 8. Featured gallery ─────────── */}
      {gallery.length > 0 && (
        <section className="bg-paper py-[length:var(--spacing-section)]">
          <div className="mx-auto max-w-[1400px] px-5 md:px-10">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow text-deep">Photographs</p>
                <h2 className="mt-4 text-[length:var(--text-title)]">Moments kept</h2>
              </div>
              <Link href="/gallery" className="btn btn-ghost">
                Open the gallery
              </Link>
            </Reveal>

            <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
              {gallery.map((photo, i) => (
                <Reveal key={photo.id} delay={i * 60}>
                  <Link
                    href="/gallery"
                    className="group relative block aspect-[4/5] overflow-hidden rounded-sm bg-mist"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.caption || `${profile.fullName} — photograph`}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 font-util text-[0.68rem] uppercase tracking-[0.13em] text-mist opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {photo.album}
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────── 9. Tributes ─────────── */}
      <section className="border-t border-ink/10 bg-mist/40 py-[length:var(--spacing-section)]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-deep">Tributes</p>
              <h2 className="mt-4 text-[length:var(--text-title)]">What people are saying</h2>
            </div>
            <Link href="/tributes" className="btn btn-ghost">
              Read all tributes
            </Link>
          </Reveal>

          {tributes.length > 0 ? (
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {tributes.map((tribute, i) => (
                <Reveal key={tribute.id} delay={i * 80}>
                  <blockquote className="flex h-full flex-col justify-between rounded-sm border border-ink/10 bg-paper p-7">
                    <p className="font-display text-lg italic leading-snug text-ink/85">
                      “{tribute.message.length > 190 ? `${tribute.message.slice(0, 190)}…` : tribute.message}”
                    </p>
                    <footer className="mt-6 border-t border-ink/10 pt-4">
                      <p className="font-util text-sm font-medium">{tribute.name}</p>
                      <p className="font-util text-[0.72rem] uppercase tracking-[0.12em] text-ink/45">
                        {[tribute.relationship, tribute.location].filter(Boolean).join(' · ')}
                      </p>
                    </footer>
                  </blockquote>
                </Reveal>
              ))}
            </div>
          ) : (
            <Reveal className="mt-12">
              <div className="rounded-sm border border-dashed border-ink/20 bg-paper px-6 py-14 text-center">
                <p className="font-display text-xl text-ink/80">No tributes have been published yet</p>
                <p className="mx-auto mt-2 max-w-md text-[0.95rem] text-ink/55">
                  If you knew him, yours could be the first.
                </p>
                <Link href="/tributes" className="btn btn-primary mt-7">
                  Leave a tribute
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ─────────── 10. Stories ─────────── */}
      {stories.length > 0 && (
        <section className="bg-paper py-[length:var(--spacing-section)]">
          <div className="mx-auto max-w-[1400px] px-5 md:px-10">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow text-deep">Stories</p>
                <h2 className="mt-4 text-[length:var(--text-title)]">Memories, in their own words</h2>
              </div>
              <Link href="/stories" className="btn btn-ghost">
                All stories
              </Link>
            </Reveal>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {stories.map((story, i) => (
                <Reveal key={story.id} delay={i * 80}>
                  <Link
                    href={`/stories/${story.slug}`}
                    className="group block border-t-2 border-ink pt-6 transition-colors hover:border-deep"
                  >
                    <h3 className="text-[length:var(--text-title)] leading-tight transition-colors group-hover:text-deep">
                      {story.title}
                    </h3>
                    <p className="mt-3 font-util text-[0.72rem] uppercase tracking-[0.13em] text-ink/45">
                      {story.author_name}
                      {story.relationship && ` · ${story.relationship}`}
                    </p>
                    <p className="mt-4 line-clamp-4 leading-relaxed text-ink/65">{story.body}</p>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────── 11. Legacy ─────────── */}
      <section className="bg-deep py-[length:var(--spacing-section)] text-mist">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 md:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow text-mist/60">Legacy</p>
            <h2 className="mt-4 text-[length:var(--text-display)]">{legacyIntro.heading}</h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="prose-memorial text-lg leading-relaxed text-mist/85">
              {legacyIntro.body.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <Link href="/life-and-legacy" className="btn btn-onink mt-9">
              Explore his legacy
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─────────── 12. The candle wall ─────────── */}
      <section className="relative overflow-hidden bg-ink py-[length:var(--spacing-section)] text-mist">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(ellipse at 50% 100%, #FFB454 0%, transparent 60%)' }}
        />
        <div className="relative mx-auto max-w-[1400px] px-5 text-center md:px-10">
          <Reveal>
            <p className="eyebrow text-flame/70">Remembrance</p>
            <h2 className="mx-auto mt-4 max-w-2xl text-[length:var(--text-display)]">
              {total > 0
                ? `${total.toLocaleString('en-NG')} ${total === 1 ? 'candle has' : 'candles have'} been lit in his memory`
                : 'Be the first to light a candle in his memory'}
            </h2>
          </Reveal>

          {candles.length > 0 && (
            <ul className="mt-14 flex flex-wrap items-end justify-center gap-x-2 gap-y-8 sm:gap-x-6">
              {candles.map((candle) => (
                <li key={candle.id} className="group relative w-[68px] sm:w-[84px]">
                  <div className="flex justify-center">
                    <Flame seed={candle.id} size={40} />
                  </div>
                  <p className="mt-1 truncate px-1 font-util text-[0.64rem] tracking-[0.06em] text-mist/55">
                    {candle.name}
                  </p>
                  {candle.message && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-52 -translate-x-1/2 rounded-sm border border-mist/20 bg-ink-70 p-3 text-left font-util text-[0.72rem] leading-relaxed text-mist/90 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                      {candle.message}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <Reveal delay={80}>
            <Link href="/candles" className="btn bg-mist text-ink hover:bg-soft mt-14">
              Light a candle
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
