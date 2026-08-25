import PageHeader from '@/components/PageHeader';
import Reveal from '@/components/Reveal';
import EmptyState from '@/components/EmptyState';
import { safeQuery } from '@/lib/content';

export const revalidate = 60;
export const metadata = { title: 'Featured Media' };

type MediaItem = {
  id: number; title: string; outlet: string; kind: string;
  url: string; published_on: string; excerpt: string;
};

export default async function MediaPage() {
  const items = await safeQuery<MediaItem>(
    'SELECT id, title, outlet, kind, url, published_on, excerpt FROM media_items ORDER BY sort_order, id'
  );

  return (
    <>
      <PageHeader
        eyebrow="Featured Media"
        title="The archive"
        intro="Articles, publications, recordings and anything else written or broadcast about his life."
      />

      <section className="bg-paper py-[length:var(--spacing-section)]">
        <div className="mx-auto max-w-[1100px] px-5 md:px-10">
          {items.length === 0 ? (
            <EmptyState
              title="The media archive is empty"
              hint="The family can add articles, interviews and publications from the admin dashboard."
            />
          ) : (
            <ul className="divide-y divide-ink/12 border-y border-ink/12">
              {items.map((item, i) => {
                const Wrapper = item.url ? 'a' : 'div';
                return (
                  <li key={item.id}>
                    <Reveal delay={Math.min(i, 8) * 40}>
                      <Wrapper
                        {...(item.url
                          ? { href: item.url, target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                        className="group grid gap-4 py-8 md:grid-cols-[9rem_1fr] md:gap-10"
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
                          <h2 className="font-display text-xl leading-snug transition-colors group-hover:text-deep">
                            {item.title}
                          </h2>
                          {item.outlet && (
                            <p className="mt-1 font-util text-[0.75rem] uppercase tracking-[0.1em] text-ink/45">
                              {item.outlet}
                            </p>
                          )}
                          {item.excerpt && (
                            <p className="mt-3 leading-relaxed text-ink/65">{item.excerpt}</p>
                          )}
                          {item.url && (
                            <p className="mt-3 font-util text-[0.68rem] uppercase tracking-[0.13em] text-deep opacity-0 transition-opacity group-hover:opacity-100">
                              Open ↗
                            </p>
                          )}
                        </div>
                      </Wrapper>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
