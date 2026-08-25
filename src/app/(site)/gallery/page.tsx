import PageHeader from '@/components/PageHeader';
import GalleryTabs from '@/components/GalleryTabs';
import MemorialSidebar from '@/components/MemorialSidebar';
import type { Photo } from '@/components/GalleryGrid';
import type { VideoItem } from '@/components/VideoGrid';
import { safeQuery } from '@/lib/content';

export const revalidate = 60;
export const metadata = { title: 'Gallery' };

export default async function GalleryPage() {
  const [photos, videos] = await Promise.all([
    safeQuery<Photo>('SELECT id, url, caption, album, taken_on FROM photos ORDER BY sort_order, id'),
    safeQuery<VideoItem>(
      'SELECT id, title, description, url, thumbnail_url, category FROM videos ORDER BY sort_order, id'
    ),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="Photographs, film and voice"
        intro="Everything the family has gathered. Tap any image to view it full screen."
      />
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-[length:var(--spacing-section)] md:px-10 lg:grid-cols-[1fr_300px] lg:gap-14">
        <div className="min-w-0">
          <GalleryTabs photos={photos} videos={videos} />
        </div>
        <MemorialSidebar />
      </div>
    </>
  );
}
