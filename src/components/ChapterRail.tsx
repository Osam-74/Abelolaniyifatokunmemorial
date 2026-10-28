'use client';

import { useEffect, useState } from 'react';

type Item = { slug: string; label: string; period: string };

/**
 * "Contents" for the life story. Sticky list on wide screens, a horizontal
 * strip on small ones. Highlights the chapter being read. Purely a navigation
 * aid: every link is a real #anchor, so it still works with JavaScript off.
 */
export default function ChapterRail({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.slug ?? '');

  useEffect(() => {
    const targets = items
      .map((i) => document.getElementById(`chapter-${i.slug}`))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id.replace('chapter-', ''));
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0 }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Chapters of his life" className="chapter-rail">
      <p className="mb-3 hidden font-util text-[0.68rem] uppercase tracking-[0.16em] text-ink/45 lg:block">
        Chapters
      </p>
      <ol className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        {items.map((item, i) => {
          const on = item.slug === active;
          return (
            <li key={item.slug} className="shrink-0">
              <a
                href={`#chapter-${item.slug}`}
                aria-current={on ? 'true' : undefined}
                className={`flex items-baseline gap-2.5 rounded-sm px-3 py-1.5 font-util text-[0.82rem] leading-snug transition-colors lg:px-0 lg:py-1 ${
                  on ? 'bg-ink text-mist lg:bg-transparent lg:font-medium lg:text-ink' : 'bg-mist/60 text-ink/65 hover:text-ink lg:bg-transparent'
                }`}
              >
                <span className={`hidden w-5 text-[0.7rem] tabular-nums lg:inline ${on ? 'text-deep' : 'text-ink/35'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
