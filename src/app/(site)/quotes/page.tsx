import PageHeader from '@/components/PageHeader';
import Reveal from '@/components/Reveal';
import EmptyState from '@/components/EmptyState';
import { safeQuery } from '@/lib/content';

export const revalidate = 60;
export const metadata = { title: 'Words of Wisdom' };

type Quote = { id: number; text: string; context: string; source: string };

export default async function QuotesPage() {
  const quotes = await safeQuery<Quote>('SELECT id, text, context, source FROM quotes ORDER BY sort_order, id');

  return (
    <>
      <PageHeader
        eyebrow="Words of Wisdom"
        title="Words that continue to inspire"
        intro="The things he said often enough that his family can still hear him saying them."
      />

      <section className="bg-paper py-[length:var(--spacing-section)]">
        <div className="mx-auto max-w-4xl px-5 md:px-10">
          {quotes.length === 0 ? (
            <EmptyState
              title="No sayings have been recorded yet"
              hint="The family can add the words he was known for from the admin dashboard."
            />
          ) : (
            <div className="space-y-20">
              {quotes.map((quote, i) => (
                <Reveal key={quote.id} delay={i * 50}>
                  <figure className="border-t border-ink/12 pt-10 text-center">
                    <blockquote className="font-display text-[clamp(1.5rem,3.6vw,2.6rem)] italic leading-[1.28]">
                      “{quote.text}”
                    </blockquote>
                    {(quote.source || quote.context) && (
                      <figcaption className="mt-7">
                        {quote.source && (
                          <p className="font-util text-[0.72rem] uppercase tracking-[0.16em] text-deep">
                            {quote.source}
                          </p>
                        )}
                        {quote.context && (
                          <p className="mx-auto mt-3 max-w-xl text-[0.95rem] leading-relaxed text-ink/55">
                            {quote.context}
                          </p>
                        )}
                      </figcaption>
                    )}
                  </figure>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
