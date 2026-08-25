import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ShareRow from '@/components/ShareRow';
import { safeQuery, formatDate } from '@/lib/content';

export const revalidate = 60;

type Story = {
  id: number; slug: string; title: string; author_name: string; relationship: string;
  author_photo: string; body: string; image_url: string; created_at: string;
};

async function getStory(slug: string) {
  const rows = await safeQuery<Story>(
    `SELECT id, slug, title, author_name, relationship, author_photo, body, image_url, created_at
     FROM stories WHERE slug = $1 AND status = 'approved' LIMIT 1`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStory(slug);
  return story
    ? { title: story.title, description: `${story.body.slice(0, 155)}…` }
    : { title: 'Story not found' };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();

  return (
    <article className="bg-paper">
      <header className="border-b border-ink/10 bg-mist/45">
        <div className="mx-auto max-w-3xl px-5 pb-14 pt-32 md:px-10 md:pb-20 md:pt-40">
          <Link href="/stories" className="eyebrow text-deep transition-opacity hover:opacity-70">
            ← All stories
          </Link>
          <h1 className="mt-6 text-[length:var(--text-display)]">{story.title}</h1>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            {story.author_photo && (
              <Image
                src={story.author_photo}
                alt=""
                width={52}
                height={52}
                className="h-13 w-13 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-util text-sm font-medium">{story.author_name}</p>
              <p className="font-util text-[0.7rem] uppercase tracking-[0.13em] text-ink/45">
                {[story.relationship, formatDate(story.created_at)].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-16 md:px-10 md:py-24">
        {story.image_url && (
          <div className="relative mb-12 aspect-[16/10] overflow-hidden rounded-sm bg-mist">
            <Image src={story.image_url} alt="" fill sizes="(max-width: 768px) 90vw, 720px" className="object-cover" />
          </div>
        )}
        <div className="prose-memorial text-lg leading-[1.8] text-ink/80">
          {story.body.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-14 border-t border-ink/12 pt-8">
          <p className="eyebrow mb-4 text-ink/45">Share this story</p>
          <ShareRow />
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/stories#share" className="btn btn-primary">Share your own memory</Link>
          <Link href="/tributes" className="btn btn-ghost">Leave a tribute</Link>
        </div>
      </div>
    </article>
  );
}
