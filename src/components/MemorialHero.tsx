import Image from 'next/image';
import { getProfile, lifespan, formatDate } from '@/lib/content';

/**
 * Static across every page. The background lives at
 * public/images/hero-sky.jpg — replace that file to change it.
 */
export default async function MemorialHero() {
  const profile = await getProfile();
  const years = lifespan(profile);
  const nameParts = profile.fullName.trim().split(/\s+/);
  const firstLine = nameParts.slice(0, Math.max(1, nameParts.length - 1)).join(' ');
  const lastLine = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

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
      <div className="absolute inset-0 bg-gradient-to-r from-paper/80 via-paper/45 to-transparent" />

      <div className="relative mx-auto flex h-full max-w-[1400px] items-center gap-8 px-5 py-8 md:px-10">
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-deep">In loving memory of</p>
          <h1 className="mt-3 font-display text-[clamp(1.9rem,5.2vw,4.2rem)] leading-[0.95] tracking-[-0.03em] text-ink">
            <span className="block">{firstLine}</span>
            {lastLine && <span className="block">{lastLine}</span>}
          </h1>
          {years && (
            <p className="mt-4 font-util text-[0.72rem] uppercase tracking-[0.3em] text-ink/60 sm:text-sm">
              {years}
            </p>
          )}
          {profile.deathDate && (
            <p className="mt-2 text-[0.9rem] text-ink/55">
              Passed away {formatDate(profile.deathDate)}
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
