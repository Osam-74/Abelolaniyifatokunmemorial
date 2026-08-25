import PageHeader from '@/components/PageHeader';
import GalleryGrid, { type Photo } from '@/components/GalleryGrid';
import EmptyState from '@/components/EmptyState';
import { safeQuery } from '@/lib/content';

export const revalidate = 60;
export const metadata = { title: 'Gallery' };

export default async function GalleryPage() {
  const photos = await safeQuery<Photo>(
    'SELECT id, url, caption, album, taken_on FROM photos ORDER BY sort_order, id'
  );

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        title="Photographs of a life"
        intro="Every photograph the family has gathered, arranged by the chapters of his life. Tap any image to view it full screen."
      />
      <section className="bg-paper py-[length:var(--spacing-section)]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          {photos.length === 0 ? (
            <EmptyState
              title="No photographs have been added yet"
              hint="The family can upload photographs and sort them into albums from the admin dashboard."
            />
          ) : (
            <GalleryGrid photos={photos} />
          )}
        </div>
      </section>
    </>
  );
}
