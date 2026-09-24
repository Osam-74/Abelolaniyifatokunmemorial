'use client';

import { useState } from 'react';

/**
 * Wraps the admin sidebar links (passed as children from the server layout,
 * which already knows the pending counts and base path). Desktop keeps the
 * plain sticky sidebar it always had — nothing changes at the lg breakpoint
 * and up. Below that, the links are hidden behind a hamburger button instead
 * of always sitting in the flow above the page content, and tapping any
 * link inside closes the panel again (event delegation, so it works for
 * every link without touching each one).
 */
export default function AdminNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-nav-panel"
          className="mb-4 flex items-center gap-2.5 rounded-sm border border-ink/15 bg-paper px-3.5 py-2.5 font-util text-sm text-ink transition-colors hover:border-ink/35"
        >
          <span className="flex h-3 w-4 flex-col justify-between" aria-hidden="true">
            <span
              className={`h-[2px] w-full rounded-full bg-ink transition-transform ${
                open ? 'translate-y-[5px] rotate-45' : ''
              }`}
            />
            <span className={`h-[2px] w-full rounded-full bg-ink transition-opacity ${open ? 'opacity-0' : ''}`} />
            <span
              className={`h-[2px] w-full rounded-full bg-ink transition-transform ${
                open ? '-translate-y-[5px] -rotate-45' : ''
              }`}
            />
          </span>
          <span>Menu</span>
        </button>
      </div>

      <nav
        id="admin-nav-panel"
        aria-label="Admin sections"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('a')) setOpen(false);
        }}
        className={`rounded-sm bg-ink p-3 text-mist lg:sticky lg:top-8 lg:block lg:self-start ${
          open ? 'block' : 'hidden'
        }`}
      >
        {children}
      </nav>
    </>
  );
}
