import Image from 'next/image';
import PageHeader from '@/components/PageHeader';
import Reveal from '@/components/Reveal';
import SubmissionForm from '@/components/SubmissionForm';
import { submitTribute } from '@/lib/actions';
import { safeQuery, formatDate } from '@/lib/content';

export const revalidate = 60;
export const metadata = { title: 'Tributes' };

type Tribute = {
  id: number; name: string; relationship: string; location: string;
  message: string; photo_url: string; created_at: string;
};

export default async function TributesPage() {
  const tributes = await safeQuery<Tribute>(
    `SELECT id, name, relationship, location, message, photo_url, created_at
     FROM tributes WHERE status = 'approved' ORDER BY featured DESC, created_at DESC`
  );

  return (
    <>
      <PageHeader
        eyebrow="Tributes & Condolences"
        title="A wall of tributes"
        intro="Messages from the people whose lives crossed his. Add yours below."
      />

      <section className="bg-paper py-[length:var(--spacing-section)]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          {tributes.length === 0 ? (
            <div className="rounded-sm border border-dashed border-ink/20 bg-mist/30 px-6 py-16 text-center">
              <p className="font-display text-2xl text-ink/85">The wall is still empty</p>
              <p className="mx-auto mt-3 max-w-md text-ink/60">Yours could be the first tribute published here.</p>
            </div>
          ) : (
            <div className="columns-1 gap-5 md:columns-2 lg:columns-3 [&>*]:mb-5">
              {tributes.map((tribute, i) => (
                <Reveal key={tribute.id} delay={Math.min(i, 8) * 50}>
                  <blockquote className="break-inside-avoid rounded-sm border border-ink/10 bg-mist/35 p-7">
                    <p className="font-display text-lg italic leading-snug text-ink/85">“{tribute.message}”</p>
                    {tribute.photo_url && (
                      <Image
                        src={tribute.photo_url}
                        alt=""
                        width={600}
                        height={400}
                        className="mt-5 h-auto w-full rounded-sm object-cover"
                      />
                    )}
                    <footer className="mt-6 border-t border-ink/12 pt-4">
                      <p className="font-util text-sm font-medium">{tribute.name}</p>
                      <p className="font-util text-[0.7rem] uppercase tracking-[0.12em] text-ink/45">
                        {[tribute.relationship, tribute.location, formatDate(tribute.created_at)]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </footer>
                  </blockquote>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="leave" className="bg-ink py-[length:var(--spacing-section)] text-mist">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 md:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow text-soft/70">Leave a tribute</p>
            <h2 className="mt-4 text-[length:var(--text-title)]">Say what he meant to you</h2>
            <p className="mt-5 max-w-md leading-relaxed text-mist/70">
              Every tribute is read by the family before it is published. It may take a day or two
              to appear, but it will be read.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <SubmissionForm
              action={submitTribute}
              tone="onink"
              submitLabel="Send my tribute"
              note="Tributes are approved by the family before they appear."
              fields={[
                { name: 'name', label: 'Your name', required: true, half: true },
                { name: 'relationship', label: 'How you knew him', half: true, placeholder: 'Friend, colleague, family…' },
                { name: 'location', label: 'Where you are writing from', half: true, placeholder: 'Ibadan, Nigeria' },
                { name: 'photo_url', label: 'Photograph link (optional)', type: 'url', half: true, placeholder: 'https://…' },
                { name: 'message', label: 'Your tribute', type: 'textarea', rows: 7, required: true },
              ]}
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
