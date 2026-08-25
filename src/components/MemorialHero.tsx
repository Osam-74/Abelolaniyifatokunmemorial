import Image from 'next/image';
import { getProfile, lifespan } from '@/lib/content';

/**
 * Static across every page. The background lives at
 * public/images/hero-sky.jpg — replace that file to change it.
 *
 * On a narrow screen the portrait leads and everything centres beneath it;
 * from `sm` up it becomes text on the left, portrait on the right.
 */
export default async function MemorialHero() {
  const profile = await getProfile();
  const years = lifespan(profile);

  return (
    <section className="relative isolate w-full overflow-hidden sm:h-[52svh] sm:min-h-[400px]">
      <Image src="/images/hero-sky.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-paper/55 sm:bg-gradient-to-r sm:from-paper/85 sm:via-paper/40 sm:to-paper/5" />

      <div className="relative mx-auto flex h-full max-w-[1400px] flex-col items-center gap-5 px-5 py-9 text-center sm:flex-row sm:items-center sm:gap-8 sm:py-8 sm:text-left md:px-10">
        <div className="relative h-52 w-[10.5rem] shrink-0 overflow-hidden rounded-sm border-4 border-paper shadow-[0_10px_40px_-12px_rgba(3,4,94,0.45)] sm:order-2 sm:h-[calc(100%-3.5rem)] sm:w-[clamp(150px,20vw,260px)] sm:self-center">
          <Image
            src={profile.portraitUrl || '/images/portrait.jpg'}
            alt={`Portrait of ${profile.fullName}`}
            fill
            priority
            sizes="(max-width: 640px) 168px, 260px"
            className="object-cover object-top"
          />
        </div>

        <div className="min-w-0 sm:order-1 sm:flex-1">
          <p className="eyebrow text-deep">In loving memory of</p>

          <h1 className="mt-2.5 whitespace-nowrap font-display text-[clamp(1.5rem,6.4vw,4rem)] leading-[1.02] tracking-[-0.025em] text-ink">
            {profile.fullName}
          </h1>

          {profile.tagline && (
            <p className="mt-3 font-util text-[0.62rem] uppercase leading-relaxed tracking-[0.15em] text-ink/55 sm:text-[0.72rem] sm:tracking-[0.17em]">
              {profile.tagline}
            </p>
          )}

          {years && (
            <p className="mt-2.5 font-util text-[0.64rem] uppercase tracking-[0.24em] text-deep sm:text-[0.72rem] sm:tracking-[0.26em]">
              {years}
            </p>
          )}

          {profile.heroQuote && (
            <p className="mx-auto mt-4 max-w-md font-display text-[clamp(0.9rem,1.6vw,1.15rem)] italic leading-snug text-ink/70 sm:mx-0">
              “{profile.heroQuote}”
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
