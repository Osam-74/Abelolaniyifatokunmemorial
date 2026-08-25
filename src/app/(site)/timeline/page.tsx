import Image from 'next/image';
import PageHeader from '@/components/PageHeader';
import Reveal from '@/components/Reveal';
import EmptyState from '@/components/EmptyState';
import { safeQuery, getProfile } from '@/lib/content';

export const revalidate = 60;
export const metadata = { title: 'Timeline' };

type Milestone = { id: number; year: string; title: string; body: string; image_url: string };

export default async function TimelinePage() {
  const [profile, milestones] = await Promise.all([
    getProfile(),
    safeQuery<Milestone>('SELECT id, year, title, body, image_url FROM timeline ORDER BY sort_order, year, id'),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Timeline"
        title="A life, year by year"
        intro={`The moments that made up the life of ${profile.fullName} — from the beginning to the legacy he left.`}
      />

      <section className="bg-paper py-[length:var(--spacing-section)]">
        <div className="mx-auto max-w-[1100px] px-5 md:px-10">
          {milestones.length === 0 ? (
            <EmptyState
              title="The timeline is still being built"
              hint="The family is still gathering the milestones of his life."
            />
          ) : (
            <ol className="relative">
              <span
                className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-bright via-deep to-ink/20 md:left-[calc(9rem+7px)]"
                aria-hidden="true"
              />
              {milestones.map((m, i) => (
                <li key={m.id} className="relative pb-14 last:pb-0">
                  <Reveal delay={i * 40}>
                    <div className="grid gap-x-8 gap-y-3 md:grid-cols-[9rem_1fr]">
                      <p className="hidden pt-0.5 text-right font-util text-sm tracking-[0.12em] text-deep md:block">
                        {m.year}
                      </p>
                      <div className="relative pl-8">
                        <span
                          className="absolute left-0 top-2 grid h-[15px] w-[15px] place-items-center rounded-full border-2 border-bright bg-paper md:-left-2"
                          aria-hidden="true"
                        >
                          <span className="h-[5px] w-[5px] rounded-full bg-deep" />
                        </span>
                        <p className="font-util text-sm tracking-[0.12em] text-deep md:hidden">{m.year}</p>
                        <h2 className="mt-1 text-[length:var(--text-title)] leading-tight md:mt-0">{m.title}</h2>
                        {m.body && (
                          <div className="prose-memorial mt-4 leading-relaxed text-ink/70">
                            {m.body.split('\n\n').map((p, j) => (
                              <p key={j}>{p}</p>
                            ))}
                          </div>
                        )}
                        {m.image_url && (
                          <div className="relative mt-6 aspect-[16/10] max-w-xl overflow-hidden rounded-sm bg-mist">
                            <Image
                              src={m.image_url}
                              alt={m.title}
                              fill
                              sizes="(max-width: 768px) 90vw, 580px"
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}
