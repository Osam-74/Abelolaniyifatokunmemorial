import Image from 'next/image';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Reveal from '@/components/Reveal';
import { getProfile, getSetting, safeQuery, lifespan, formatDate } from '@/lib/content';

export const revalidate = 60;
export const metadata = { title: 'About' };

type Section = { id: number; heading: string; body: string; image_url: string; pull_quote: string };

export default async function AboutPage() {
  const [profile, intro, sections] = await Promise.all([
    getProfile(),
    getSetting<{ heading: string; body: string; quote: string }>('intro'),
    safeQuery<Section>('SELECT id, heading, body, image_url, pull_quote FROM bio_sections ORDER BY sort_order, id'),
  ]);

  const facts = [
    { label: 'Full name', value: profile.fullName },
    { label: 'Born', value: formatDate(profile.birthDate) || 'To be added' },
    { label: 'Place of birth', value: profile.birthPlace || 'To be added' },
    { label: 'Passed away', value: formatDate(profile.deathDate) || 'To be added' },
  ].filter((f) => f.value);

  return (
    <>
      <PageHeader
        eyebrow="About"
        title={intro.heading}
        intro={`The life of ${profile.fullName}, told by the family who knew him best.`}
      />

      <section className="bg-paper py-[length:var(--spacing-section)]">
        <div className="mx-auto grid max-w-[1400px] gap-14 px-5 md:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-full rounded-b-sm bg-mist">
                <Image
                  src={profile.portraitUrl || '/images/portrait.jpg'}
                  alt={`Portrait of ${profile.fullName}`}
                  fill
                  sizes="(max-width: 1024px) 90vw, 420px"
                  className="object-cover object-top"
                />
              </div>
              <dl className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex justify-between gap-4 py-3.5">
                    <dt className="font-util text-[0.68rem] uppercase tracking-[0.14em] text-ink/45">
                      {fact.label}
                    </dt>
                    <dd className="text-right text-[0.95rem]">{fact.value}</dd>
                  </div>
                ))}
              </dl>
              {lifespan(profile) && (
                <p className="mt-6 font-display text-2xl text-deep">{lifespan(profile)}</p>
              )}
            </div>
          </Reveal>

          <div className="space-y-16">
            <Reveal>
              <div className="prose-memorial text-lg leading-relaxed text-ink/75">
                {intro.body.split('\n\n').map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Reveal>

            {sections.map((section, i) => (
              <Reveal key={section.id} delay={40}>
                <article className="border-t border-ink/12 pt-9">
                  <p className="font-util text-[0.68rem] uppercase tracking-[0.18em] text-deep">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h2 className="mt-3 text-[length:var(--text-title)]">{section.heading}</h2>

                  {section.image_url && (
                    <div className="relative mt-7 aspect-[16/10] overflow-hidden rounded-sm bg-mist">
                      <Image
                        src={section.image_url}
                        alt={section.heading}
                        fill
                        sizes="(max-width: 1024px) 90vw, 700px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="prose-memorial mt-6 leading-relaxed text-ink/70">
                    {section.body.split('\n\n').map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </div>

                  {section.pull_quote && (
                    <p className="mt-8 border-l-2 border-bright pl-6 font-display text-2xl italic leading-snug text-ink">
                      {section.pull_quote}
                    </p>
                  )}
                </article>
              </Reveal>
            ))}

            <Reveal>
              <div className="flex flex-wrap gap-3 border-t border-ink/12 pt-10">
                <Link href="/timeline" className="btn btn-ghost">His timeline</Link>
                <Link href="/life-and-legacy" className="btn btn-ghost">Life &amp; legacy</Link>
                <Link href="/gallery" className="btn btn-ghost">Photographs</Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
