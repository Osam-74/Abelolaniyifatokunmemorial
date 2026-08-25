import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import MemorialHero from '@/components/MemorialHero';
import TabNav from '@/components/TabNav';
import MusicPlayer from '@/components/MusicPlayer';
import ScrollProgress from '@/components/ScrollProgress';
import RouteTransition from '@/components/RouteTransition';
import ViewCounter from '@/components/ViewCounter';
import { getProfile, getSetting } from '@/lib/content';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [profile, footer, audio] = await Promise.all([
    getProfile(),
    getSetting<{ message: string; yorubaFarewell: string }>('footer'),
    getSetting<{ enabled: boolean; trackUrl: string; title: string }>('audio'),
  ]);

  return (
    <>
      <ScrollProgress />
      <SiteHeader name={profile.fullName} portrait={profile.portraitUrl || '/images/portrait.jpg'} />
      <MemorialHero />
      <TabNav />
      <main id="main">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <SiteFooter
        name={profile.fullName}
        message={footer.message}
        farewell={footer.yorubaFarewell}
      />
      <MusicPlayer trackUrl={audio.trackUrl} title={audio.title} enabled={audio.enabled} />
      <ViewCounter />
    </>
  );
}
