import Link from 'next/link';
import MemorialSidebar from '@/components/MemorialSidebar';
import PhotoContributeForm from '@/components/PhotoContributeForm';
import { getProfile } from '@/lib/content';

export const metadata = { title: 'Share a photograph' };

export default async function SharePhotographPage() {
  const profile = await getProfile();

  return (
    <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-10 md:px-10 md:py-14 lg:grid-cols-[1fr_300px] lg:gap-12">
      <div className="min-w-0">
        <Link href="/gallery" className="eyebrow text-deep transition-opacity hover:opacity-70">
          ← Back to the gallery
        </Link>

        <h1 className="mt-5 text-[length:var(--text-title)]">Share a photograph</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-ink/70">
          If you have a picture of {profile.fullName.split(' ')[0]} — at a gathering, at church, at
          home, anywhere — the family would be glad to have it. Every photograph is seen by them
          before it joins the gallery.
        </p>

        <div className="mt-9 max-w-xl">
          <PhotoContributeForm />
        </div>
      </div>

      <MemorialSidebar />
    </div>
  );
}
