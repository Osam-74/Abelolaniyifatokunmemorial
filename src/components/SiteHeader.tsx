'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/about', label: 'About' },
  { href: '/life', label: 'Life' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/stories', label: 'Stories' },
];

export default function SiteHeader({ initials, name }: { initials: string; name: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overHero = pathname === '/' && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-mist"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          overHero
            ? 'bg-transparent'
            : 'bg-paper/90 backdrop-blur-md border-b border-ink/10'
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-4 md:px-10">
          <Link
            href="/"
            className={`group flex items-center gap-3 ${overHero ? 'text-mist' : 'text-ink'}`}
            aria-label={`${name} — home`}
          >
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-[0.7rem] tracking-[0.14em] font-util ${
                overHero ? 'border-mist/50' : 'border-ink/25'
              }`}
            >
              {initials}
            </span>
            <span className="hidden font-display text-[0.95rem] leading-tight tracking-tight sm:block">
              {name}
            </span>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex" aria-label="Main">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`underline-grow relative rounded-full px-3 py-2 font-util text-[0.72rem] uppercase tracking-[0.13em] transition-colors ${
                    overHero
                      ? 'text-mist/80 hover:text-mist'
                      : active
                        ? 'text-ink'
                        : 'text-ink/60 hover:text-ink'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                  {active && !overHero && (
                    <span className="absolute inset-x-3 -bottom-px h-px bg-deep" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/candles"
              className={`hidden rounded-full border px-4 py-2 font-util text-[0.7rem] uppercase tracking-[0.13em] transition-colors sm:inline-flex ${
                overHero
                  ? 'border-mist/50 text-mist hover:bg-mist hover:text-ink'
                  : 'border-ink/25 text-ink hover:bg-ink hover:text-mist'
              }`}
            >
              Light a candle
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className={`grid h-10 w-10 place-items-center rounded-full border transition-colors xl:hidden ${
                overHero ? 'border-mist/50 text-mist' : 'border-ink/25 text-ink'
              }`}
            >
              <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
              <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
                {open ? (
                  <g stroke="currentColor" strokeWidth="1.4">
                    <line x1="2" y1="2" x2="16" y2="12" />
                    <line x1="16" y1="2" x2="2" y2="12" />
                  </g>
                ) : (
                  <g stroke="currentColor" strokeWidth="1.4">
                    <line x1="0" y1="2" x2="18" y2="2" />
                    <line x1="0" y1="7" x2="18" y2="7" />
                    <line x1="0" y1="12" x2="18" y2="12" />
                  </g>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-nav"
        className={`fixed inset-0 z-40 bg-ink transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <nav
          className="flex h-full flex-col justify-center gap-1 overflow-y-auto px-8 py-24"
          aria-label="Main"
        >
          {NAV.concat([
            { href: '/', label: 'Home' },
            { href: '/events', label: 'Funeral & Events' },
            { href: '/guestbook', label: 'Guestbook' },
            { href: '/candles', label: 'Light a Candle' },
          ]).map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ transitionDelay: open ? `${60 + i * 35}ms` : '0ms' }}
              className={`border-b border-mist/10 py-3 font-display text-2xl text-mist transition-all duration-500 ${
                open ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
