import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import MemorialSidebar from '@/components/MemorialSidebar';
import StoryComposer from '@/components/StoryComposer';
import { safeQuery, formatDate } from '@/lib/content';

export const revalidate = 30;
export const metadata = { title: 'Stories' };

type Story = {
  id: number; slug: string; title: string; author_name: string;
  relationship: string; body: string; image_url: string; created_at: string;
};

/** Stories may be rich text or plain paragraphs, depending on when they were written. */
function preview(body: string): string {
  return body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 260);
}

export default async function StoriesPage() {
  const stories = await safeQuery<Story>(
    `SELECT id, slug, title, author_name, relationship, body, image_url, created_at
     FROM stories WHERE status = 'approved' ORDER BY featured DESC, created_at DESC`
  );

  return (
    <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-10 md:px-10 md:py-14 lg:grid-cols-[1fr_300px] lg:gap-12">
      <div className="min-w-0 space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-ink/12 bg-paper px-6 py-5">
          <p className="text-ink/70">Share a special moment from his life</p>
          <a href="#write" className="btn btn-primary">
            Write a story
          </a>
        </div>

        {stories.length === 0 ? (
          <p className="text-ink/60">No stories yet. Yours would be the first.</p>
        ) : (
          <div className="space-y-4">
            {stories.map((story, i) => (
              <Reveal key={story.id} delay={Math.min(i, 8) * 40}>
                <article className="lift rounded-sm border border-ink/10 bg-mist/35 p-6 md:p-7">
                  <Link href={`/stories/${story.slug}`} className="group block">
                    <h2 className="font-display text-2xl leading-snug transition-colors group-hover:text-deep">
                      {story.title}
                    </h2>
                    <p className="mt-2 font-util text-[0.75rem] text-ink/50">
                      {formatDate(story.created_at)} · by{' '}
                      <span className="text-deep">{story.author_name}</span>
                      {story.relationship && ` · ${story.relationship}`}
                    </p>
                    {story.image_url && (
                      <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-sm bg-paper">
                        <Image
                          src={story.image_url}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 90vw, 700px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <p className="mt-4 leading-relaxed text-ink/75">
                      {preview(story.body)}
                      {preview(story.body).length >= 260 && (
                        <span className="text-deep"> … read more</span>
                      )}
                    </p>
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        )}

        <StoryComposer />
      </div>

      <MemorialSidebar />
    </div>
  );
}
