import GalleryTabs from '@/components/GalleryTabs';
import MemorialSidebar from '@/components/MemorialSidebar';
import type { Photo } from '@/components/GalleryGrid';
import type { VideoItem } from '@/components/VideoGrid';
import { safeQuery } from '@/lib/content';

export const revalidate = 60;
export const metadata = { title: 'Gallery' };

export default async function GalleryPage() {
  const [photos, videos] = await Promise.all([
    safeQuery<Photo>(
      "SELECT id, url, caption, album, taken_on FROM photos WHERE status = 'approved' ORDER BY sort_order, id"
    ),
    safeQuery<VideoItem>(
      'SELECT id, title, description, url, thumbnail_url, category FROM videos ORDER BY sort_order, id'
    ),
  ]);

  return (
    <>
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-10 md:px-10 md:py-14 lg:grid-cols-[1fr_300px] lg:gap-14">
        <div className="min-w-0">
          <GalleryTabs photos={photos} videos={videos} />
        </div>
        <MemorialSidebar />
      </div>
    </>
  );
}
