import Image from 'next/image';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Reveal from '@/components/Reveal';
import SubmissionForm from '@/components/SubmissionForm';
import { submitStory } from '@/lib/actions';
import { safeQuery } from '@/lib/content';

export const revalidate = 60;
export const metadata = { title: 'Stories' };

type Story = {
  id: number; slug: string; title: string; author_name: string;
  relationship: string; author_photo: string; body: string; image_url: string; created_at: string;
};

export default async function StoriesPage() {
  const stories = await safeQuery<Story>(
    `SELECT id, slug, title, author_name, relationship, author_photo, body, image_url, created_at
     FROM stories WHERE status = 'approved' ORDER BY featured DESC, created_at DESC`
  );

  return (
    <>
      <PageHeader
        eyebrow="Stories & Memories"
        title="The memories people carry"
        intro="Personal stories from family, friends, neighbours and colleagues — the small moments that add up to who he was."
      />

      <section className="bg-paper py-[length:var(--spacing-section)]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          {stories.length === 0 ? (
            <div className="rounded-sm border border-dashed border-ink/20 bg-mist/30 px-6 py-16 text-center">
              <p className="font-display text-2xl text-ink/85">No stories have been published yet</p>
              <p className="mx-auto mt-3 max-w-md text-ink/60">
                If you have a memory of him, share it below. Yours would be the first.
              </p>
            </div>
          ) : (
            <div className="grid gap-10 md:grid-cols-2 lg:gap-14">
              {stories.map((story, i) => (
                <Reveal key={story.id} delay={i * 60}>
                  <article className="group h-full">
                    <Link href={`/stories/${story.slug}`} className="block">
                      {story.image_url && (
                        <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-sm bg-mist">
                          <Image
                            src={story.image_url}
                            alt=""
                            fill
                            sizes="(max-width: 768px) 90vw, 560px"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="border-t-2 border-ink pt-5 transition-colors group-hover:border-deep">
                        <h2 className="text-[length:var(--text-title)] leading-tight transition-colors group-hover:text-deep">
                          {story.title}
                        </h2>
                        <div className="mt-4 flex items-center gap-3">
                          {story.author_photo && (
                            <Image
                              src={story.author_photo}
                              alt=""
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          )}
                          <p className="font-util text-[0.72rem] uppercase tracking-[0.13em] text-ink/45">
                            {story.author_name}
                            {story.relationship && ` · ${story.relationship}`}
                          </p>
                        </div>
                        <p className="mt-4 line-clamp-4 leading-relaxed text-ink/65">{story.body}</p>
                        <p className="mt-5 font-util text-[0.68rem] uppercase tracking-[0.13em] text-deep">
                          Read the full story
                        </p>
                      </div>
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="share" className="border-t border-ink/10 bg-mist/40 py-[length:var(--spacing-section)]">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 md:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow text-deep">Share a memory</p>
            <h2 className="mt-4 text-[length:var(--text-title)]">Tell us about him</h2>
            <p className="mt-5 max-w-md leading-relaxed text-ink/65">
              A conversation you had. Something he taught you. A day you have never forgotten.
              Write it as you would tell it, and the family will publish it here.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <SubmissionForm
              action={submitStory}
              submitLabel="Send my memory"
              note="Stories are read by the family before they appear on the website."
              fields={[
                { name: 'title', label: 'Give your story a title', required: true, placeholder: 'The lesson I will never forget' },
                { name: 'author_name', label: 'Your name', required: true, half: true },
                { name: 'relationship', label: 'How you knew him', half: true, placeholder: 'Son, neighbour, church member…' },
                { name: 'body', label: 'Your memory', type: 'textarea', rows: 10, required: true },
                { name: 'image_url', label: 'Photograph link (optional)', type: 'url', placeholder: 'https://…' },
              ]}
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
