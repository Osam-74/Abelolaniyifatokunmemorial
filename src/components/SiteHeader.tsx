'use client';

import Image from 'next/image';
import Link from 'next/link';

/** Slim bar above the hero: monogram, name, and one call to action. */
export default function SiteHeader({
  name,
  portrait,
}: {
  name: string;
  portrait: string;
}) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-mist"
      >
        Skip to content
      </a>

      <header className="border-b border-ink/10 bg-paper">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3 md:px-10">
          <Link href="/about" className="flex min-w-0 items-center gap-3 text-ink">
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-mist">
              <Image src={portrait} alt="" fill sizes="36px" className="object-cover object-top" />
            </span>
            <span className="truncate font-display text-base leading-tight sm:text-lg">{name}</span>
          </Link>

          <Link
            href="/about#tribute"
            className="shrink-0 rounded-full bg-ink px-4 py-2 font-util text-[0.68rem] uppercase tracking-[0.12em] text-mist transition-colors hover:bg-deep sm:px-5"
          >
            Leave a tribute
          </Link>
        </div>
      </header>
    </>
  );
}
