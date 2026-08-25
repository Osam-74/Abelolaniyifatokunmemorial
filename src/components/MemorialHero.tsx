import Image from 'next/image';
import { getProfile, lifespan, formatDate } from '@/lib/content';

/**
 * Static across every page. The background lives at
 * public/images/hero-sky.jpg — replace that file to change it.
 */
export default async function MemorialHero() {
  const profile = await getProfile();
  const years = lifespan(profile);

  return (
    <section className="relative isolate h-[52svh] min-h-[380px] w-full overflow-hidden">
      <Image
        src="/images/hero-sky.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-paper/85 via-paper/40 to-paper/5" />

      <div className="relative mx-auto flex h-full max-w-[1400px] items-center gap-8 px-5 py-8 md:px-10">
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-deep">In loving memory of</p>

          <h1 className="mt-2.5 font-display text-[clamp(1.6rem,4vw,3.1rem)] leading-[1.02] tracking-[-0.025em] text-ink">
            {profile.fullName}
          </h1>

          {profile.tagline && (
            <p className="mt-3 font-util text-[0.66rem] uppercase tracking-[0.17em] text-ink/55 sm:text-[0.72rem]">
              {profile.tagline}
            </p>
          )}

          {years && (
            <p className="mt-2.5 font-util text-[0.66rem] uppercase tracking-[0.26em] text-deep sm:text-[0.72rem]">
              {years}
            </p>
          )}

          {profile.heroQuote && (
            <p className="mt-4 max-w-md font-display text-[clamp(0.95rem,1.6vw,1.15rem)] italic leading-snug text-ink/70">
              “{profile.heroQuote}”
            </p>
          )}
        </div>

        <div className="relative hidden h-[calc(100%-3.5rem)] w-[clamp(150px,20vw,260px)] shrink-0 self-center overflow-hidden rounded-sm border-4 border-paper shadow-[0_10px_40px_-12px_rgba(3,4,94,0.45)] sm:block">
          <Image
            src={profile.portraitUrl || '/images/portrait.jpg'}
            alt={`Portrait of ${profile.fullName}`}
            fill
            priority
            sizes="260px"
            className="object-cover object-top"
          />
        </div>
      </div>
    </section>
  );
}
