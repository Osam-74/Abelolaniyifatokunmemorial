import PageHeader from '@/components/PageHeader';
import VideoGrid, { type VideoItem } from '@/components/VideoGrid';
import EmptyState from '@/components/EmptyState';
import { safeQuery } from '@/lib/content';

export const revalidate = 60;
export const metadata = { title: 'Videos' };

export default async function VideosPage() {
  const videos = await safeQuery<VideoItem>(
    'SELECT id, title, description, url, thumbnail_url, category FROM videos ORDER BY sort_order, id'
  );

  return (
    <>
      <PageHeader
        eyebrow="Videos"
        title="Seeing and hearing him again"
        intro="Tribute films, recordings of the services, interviews and family footage."
      />
      <section className="bg-paper py-[length:var(--spacing-section)]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          {videos.length === 0 ? (
            <EmptyState
              title="No videos have been added yet"
              hint="Any recordings the family finds will be added here."
            />
          ) : (
            <VideoGrid videos={videos} />
          )}
        </div>
      </section>
    </>
  );
}
