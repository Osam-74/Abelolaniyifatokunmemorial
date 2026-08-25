'use client';

import { useState, type ReactNode } from 'react';

export default function Disclosure({
  summary,
  children,
  defaultOpen = false,
  tone = 'default',
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: 'default' | 'plain';
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={tone === 'plain' ? '' : 'rounded-sm border border-ink/12 bg-white'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="min-w-0 flex-1">{summary}</span>
        <span
          className={`shrink-0 font-util text-[0.66rem] uppercase tracking-[0.1em] text-ink/45 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {open && <div className="border-t border-ink/10 px-5 py-6">{children}</div>}
    </div>
  );
}
