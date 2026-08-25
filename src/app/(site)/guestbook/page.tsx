import PageHeader from '@/components/PageHeader';
import Reveal from '@/components/Reveal';
import SubmissionForm from '@/components/SubmissionForm';
import { submitGuestbook } from '@/lib/actions';
import { safeQuery, formatDate } from '@/lib/content';

export const revalidate = 60;
export const metadata = { title: 'Guestbook' };

type Entry = { id: number; name: string; location: string; message: string; created_at: string };

export default async function GuestbookPage() {
  const entries = await safeQuery<Entry>(
    `SELECT id, name, location, message, created_at FROM guestbook
     WHERE status = 'approved' ORDER BY created_at DESC`
  );

  return (
    <>
      <PageHeader
        eyebrow="Guestbook"
        title="Sign the guestbook"
        intro="A record of everyone who came to remember him — with a word, a prayer, or simply their name."
      />

      <section className="bg-paper py-[length:var(--spacing-section)]">
        <div className="mx-auto grid max-w-[1400px] gap-14 px-5 md:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            {entries.length === 0 ? (
              <div className="rounded-sm border border-dashed border-ink/20 bg-mist/30 px-6 py-16 text-center">
                <p className="font-display text-2xl text-ink/85">Nobody has signed yet</p>
                <p className="mx-auto mt-3 max-w-sm text-ink/60">Be the first to leave your name.</p>
              </div>
            ) : (
              <ol className="divide-y divide-ink/10 border-y border-ink/10">
                {entries.map((entry, i) => (
                  <li key={entry.id} className="py-7">
                    <Reveal delay={Math.min(i, 8) * 40}>
                      <p className="leading-relaxed text-ink/80">{entry.message}</p>
                      <p className="mt-3 font-util text-[0.7rem] uppercase tracking-[0.13em] text-ink/45">
                        {[entry.name, entry.location, formatDate(entry.created_at)].filter(Boolean).join(' · ')}
                      </p>
                    </Reveal>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-sm border border-ink/12 bg-mist/40 p-7">
              <h2 className="font-display text-2xl">Leave your name</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/60">
                A short message, a prayer, or a word of condolence for the family.
              </p>
              <div className="mt-7">
                <SubmissionForm
                  action={submitGuestbook}
                  submitLabel="Sign the guestbook"
                  note="Entries appear once the family has read them."
                  fields={[
                    { name: 'name', label: 'Your name', required: true },
                    { name: 'location', label: 'Where you are from' },
                    { name: 'message', label: 'Your message', type: 'textarea', rows: 5, required: true },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
