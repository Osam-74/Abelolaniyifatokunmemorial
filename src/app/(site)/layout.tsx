import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import MusicPlayer from '@/components/MusicPlayer';
import ScrollProgress from '@/components/ScrollProgress';
import RouteTransition from '@/components/RouteTransition';
import { getProfile, getSetting, lifespan } from '@/lib/content';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [profile, footer, audio] = await Promise.all([
    getProfile(),
    getSetting<{ message: string; yorubaFarewell: string; contactEmail: string; phones: string[] }>('footer'),
    getSetting<{ enabled: boolean; trackUrl: string; title: string }>('audio'),
  ]);

  return (
    <>
      <ScrollProgress />
      <SiteHeader initials={profile.initials} name={profile.shortName} />
      <main id="main">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <SiteFooter
        name={profile.fullName}
        initials={profile.initials}
        lifespanLabel={lifespan(profile)}
        message={footer.message}
        farewell={footer.yorubaFarewell}
        email={footer.contactEmail}
        phones={footer.phones ?? []}
      />
      <MusicPlayer trackUrl={audio.trackUrl} title={audio.title} enabled={audio.enabled} />
    </>
  );
}
