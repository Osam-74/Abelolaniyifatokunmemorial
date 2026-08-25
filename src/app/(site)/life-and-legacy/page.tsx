import Image from 'next/image';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Reveal from '@/components/Reveal';
import EmptyState from '@/components/EmptyState';
import { getSetting, safeQuery } from '@/lib/content';

export const revalidate = 60;
export const metadata = { title: 'Life & Legacy' };

type Section = { id: number; heading: string; body: string; image_url: string };

export default async function LegacyPage() {
  const [legacyIntro, sections] = await Promise.all([
    getSetting<{ heading: string; body: string }>('legacyIntro'),
    safeQuery<Section>('SELECT id, heading, body, image_url FROM legacy_sections ORDER BY sort_order, id'),
  ]);

  return (
    <>
      <PageHeader eyebrow="Life &amp; Legacy" title={legacyIntro.heading} intro={legacyIntro.body.split('\n\n')[0]} />

      <section className="bg-paper py-[length:var(--spacing-section)]">
        <div className="mx-auto max-w-[1400px] space-y-20 px-5 md:space-y-28 md:px-10">
          {sections.length === 0 && (
            <EmptyState
              title="The legacy sections are still being written"
              hint="The family can add them from the admin dashboard."
            />
          )}

          {sections.map((section, i) => (
            <Reveal key={section.id}>
              <article
                className={`grid items-center gap-10 lg:gap-16 ${
                  section.image_url ? 'lg:grid-cols-2' : 'lg:grid-cols-[0.7fr_1.3fr]'
                }`}
              >
                {section.image_url ? (
                  <div className={`relative aspect-[4/3] overflow-hidden rounded-sm bg-mist ${i % 2 ? 'lg:order-2' : ''}`}>
                    <Image
                      src={section.image_url}
                      alt={section.heading}
                      fill
                      sizes="(max-width: 1024px) 90vw, 620px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className={i % 2 ? 'lg:order-2' : ''}>
                    <p className="font-util text-[0.68rem] uppercase tracking-[0.18em] text-deep">
                      {String(i + 1).padStart(2, '0')}
                    </p>
                  </div>
                )}

                <div className={i % 2 ? 'lg:order-1' : ''}>
                  <h2 className="text-[length:var(--text-title)]">{section.heading}</h2>
                  <div className="prose-memorial mt-5 text-lg leading-relaxed text-ink/70">
                    {section.body.split('\n\n').map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-ink py-20 text-mist">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-6 px-5 md:px-10">
          <p className="max-w-lg font-display text-2xl leading-snug">
            Did he shape your life too? Add your memory to his.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/stories" className="btn btn-onink">Share a memory</Link>
            <Link href="/tributes" className="btn bg-mist text-ink hover:bg-soft">Leave a tribute</Link>
          </div>
        </div>
      </section>
    </>
  );
}
