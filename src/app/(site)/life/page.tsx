import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import MemorialSidebar from '@/components/MemorialSidebar';
import { getSetting, safeQuery } from '@/lib/content';

export const revalidate = 60;
export const metadata = { title: 'Life' };

type Milestone = { id: number; year: string; title: string; body: string; image_url: string };
type Section = { id: number; heading: string; body: string; image_url: string };
type Quote = { id: number; text: string; source: string; context: string };
type MediaItem = { id: number; title: string; outlet: string; kind: string; url: string; published_on: string };

const SECTION_LINKS = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'legacy', label: 'Legacy' },
  { id: 'words', label: 'Words' },
  { id: 'archive', label: 'Archive' },
];

export default async function LifePage() {
  const [legacyIntro, milestones, sections, quotes, media] = await Promise.all([
    getSetting<{ heading: string; body: string }>('legacyIntro'),
    safeQuery<Milestone>('SELECT id, year, title, body, image_url FROM timeline ORDER BY sort_order, year, id'),
    safeQuery<Section>('SELECT id, heading, body, image_url FROM legacy_sections ORDER BY sort_order, id'),
    safeQuery<Quote>('SELECT id, text, source, context FROM quotes ORDER BY sort_order, id'),
    safeQuery<MediaItem>(
      'SELECT id, title, outlet, kind, url, published_on FROM media_items ORDER BY sort_order, id'
    ),
  ]);

  const available = SECTION_LINKS.filter((link) => {
    if (link.id === 'timeline') return milestones.length > 0;
    if (link.id === 'legacy') return sections.length > 0;
    if (link.id === 'words') return quotes.length > 0;
    return media.length > 0;
  });

  return (
    <>
      {available.length > 1 && (
        <nav
          aria-label="Sections of his life"
          className="sticky top-[56px] z-30 border-b border-ink/10 bg-paper/92 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-5 py-3 md:px-10">
            {available.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="whitespace-nowrap rounded-full px-4 py-2 font-util text-[0.72rem] uppercase tracking-[0.12em] text-ink/60 transition-colors hover:bg-ink hover:text-mist"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-10 md:px-10 md:py-14 lg:grid-cols-[1fr_300px] lg:gap-16">
        <div className="min-w-0 space-y-24">
          {milestones.length > 0 && (
            <section id="timeline" className="scroll-mt-32">
              <h2 className="text-[length:var(--text-title)]">A life, year by year</h2>
              <ol className="relative mt-10">
                <span
                  className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-bright via-deep to-ink/20"
                  aria-hidden="true"
                />
                {milestones.map((m, i) => (
                  <li key={m.id} className="relative pb-12 pl-8 last:pb-0">
                    <Reveal delay={i * 40}>
                      <span
                        className="absolute left-0 top-2 grid h-[15px] w-[15px] place-items-center rounded-full border-2 border-bright bg-paper"
                        aria-hidden="true"
                      >
                        <span className="h-[5px] w-[5px] rounded-full bg-deep" />
                      </span>
                      <p className="font-util text-sm tracking-[0.12em] text-deep">{m.year}</p>
                      <h3 className="mt-1 font-display text-2xl leading-snug">{m.title}</h3>
                      {m.body && (
                        <div className="prose-memorial mt-3 leading-relaxed text-ink/70">
                          {m.body.split('\n\n').map((p, j) => (
                            <p key={j}>{p}</p>
                          ))}
                        </div>
                      )}
                      {m.image_url && (
                        <div className="relative mt-5 aspect-[16/10] max-w-xl overflow-hidden rounded-sm bg-mist">
                          <Image
                            src={m.image_url}
                            alt={m.title}
                            fill
                            sizes="(max-width: 768px) 90vw, 560px"
                            className="object-cover"
                          />
                        </div>
                      )}
                    </Reveal>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {sections.length > 0 && (
            <section id="legacy" className="scroll-mt-32">
              <h2 className="text-[length:var(--text-title)]">{legacyIntro.heading}</h2>
              <div className="mt-10 space-y-16">
                {sections.map((section, i) => (
                  <Reveal key={section.id}>
                    <article className="border-t border-ink/12 pt-8">
                      <p className="font-util text-[0.68rem] uppercase tracking-[0.18em] text-deep">
                        {String(i + 1).padStart(2, '0')}
                      </p>
                      <h3 className="mt-3 font-display text-2xl">{section.heading}</h3>
                      {section.image_url && (
                        <div className="relative mt-6 aspect-[16/10] overflow-hidden rounded-sm bg-mist">
                          <Image
                            src={section.image_url}
                            alt={section.heading}
                            fill
                            sizes="(max-width: 1024px) 90vw, 700px"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="prose-memorial mt-5 leading-relaxed text-ink/70">
                        {section.body.split('\n\n').map((p, j) => (
                          <p key={j}>{p}</p>
                        ))}
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          {quotes.length > 0 && (
            <section id="words" className="scroll-mt-32">
              <h2 className="text-[length:var(--text-title)]">Words that continue to inspire</h2>
              <div className="mt-10 space-y-14">
                {quotes.map((quote, i) => (
                  <Reveal key={quote.id} delay={i * 40}>
                    <figure className="border-l-2 border-bright pl-6">
                      <blockquote className="font-display text-[clamp(1.35rem,2.8vw,2rem)] italic leading-[1.3]">
                        “{quote.text}”
                      </blockquote>
                      {(quote.source || quote.context) && (
                        <figcaption className="mt-4">
                          {quote.source && (
                            <p className="font-util text-[0.7rem] uppercase tracking-[0.14em] text-deep">
                              {quote.source}
                            </p>
                          )}
                          {quote.context && (
                            <p className="mt-2 text-[0.92rem] leading-relaxed text-ink/55">{quote.context}</p>
                          )}
                        </figcaption>
                      )}
                    </figure>
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          {media.length > 0 && (
            <section id="archive" className="scroll-mt-32">
              <h2 className="text-[length:var(--text-title)]">The archive</h2>
              <ul className="mt-8 divide-y divide-ink/12 border-y border-ink/12">
                {media.map((item) => {
                  const Wrapper = item.url ? 'a' : 'div';
                  return (
                    <li key={item.id}>
                      <Wrapper
                        {...(item.url ? { href: item.url, target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="group grid gap-2 py-6 md:grid-cols-[8rem_1fr] md:gap-8"
                      >
                        <div>
                          <p className="font-util text-[0.66rem] uppercase tracking-[0.16em] text-deep">
                            {item.kind}
                          </p>
                          {item.published_on && (
                            <p className="mt-1 font-util text-[0.72rem] text-ink/45">{item.published_on}</p>
                          )}
                        </div>
                        <div>
                          <p className="font-display text-lg leading-snug transition-colors group-hover:text-deep">
                            {item.title}
                          </p>
                          {item.outlet && (
                            <p className="mt-1 font-util text-[0.74rem] uppercase tracking-[0.1em] text-ink/45">
                              {item.outlet}
                            </p>
                          )}
                        </div>
                      </Wrapper>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {available.length === 0 && (
            <p className="font-display text-xl text-ink/60">
              His life story is still being gathered by the family.
            </p>
          )}

          <div className="flex flex-wrap gap-3 border-t border-ink/12 pt-10">
            <Link href="/about" className="btn btn-ghost">About him</Link>
            <Link href="/gallery" className="btn btn-ghost">Photographs</Link>
            <Link href="/stories" className="btn btn-ghost">Stories</Link>
          </div>
        </div>

        <MemorialSidebar />
      </div>
    </>
  );
}
