'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const TABS = [
  { href: '/about', label: 'About' },
  { href: '/life', label: 'Life' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/stories', label: 'Stories' },
  { href: '/events', label: 'Funeral & Events' },
];

/**
 * Sits flush beneath the hero. Once the hero has scrolled past, his name and
 * portrait fade in on the right so he stays present on the page.
 */
export default function TabNav({ name, portrait }: { name: string; portrait: string }) {
  const pathname = usePathname();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 240);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav aria-label="Sections" className="sticky top-0 z-40 bg-ink">
      <div className="mx-auto flex max-w-[1400px] items-stretch justify-between gap-4 px-5 md:px-10">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`relative whitespace-nowrap px-6 py-4 font-util text-[0.78rem] uppercase tracking-[0.16em] transition-colors md:px-10 ${
                  active ? 'bg-paper text-ink' : 'text-mist/70 hover:bg-mist/10 hover:text-mist'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div
          aria-hidden={!stuck}
          className={`hidden shrink-0 items-center gap-3 pl-4 transition-all duration-500 lg:flex ${
            stuck ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-3 opacity-0'
          }`}
        >
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-ink-70">
            <Image src={portrait} alt="" fill sizes="36px" className="object-cover object-top" />
          </span>
          <span className="whitespace-nowrap font-display text-[0.95rem] leading-tight text-mist">
            {name}
          </span>
        </div>
      </div>
    </nav>
  );
}
