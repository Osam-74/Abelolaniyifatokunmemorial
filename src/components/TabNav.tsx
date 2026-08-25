'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/about', label: 'About' },
  { href: '/life', label: 'Life' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/stories', label: 'Stories' },
];

/** Sits directly beneath the hero, flush against it. */
export default function TabNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Sections" className="sticky top-0 z-40 bg-ink">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="flex overflow-x-auto lg:pr-[320px]">
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
      </div>
    </nav>
  );
}
