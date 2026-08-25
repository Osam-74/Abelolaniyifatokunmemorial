'use client';

import { useState } from 'react';

export default function ShareRow({ className = '' }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.href : '';
  const share = async (target: 'whatsapp' | 'facebook' | 'x' | 'copy') => {
    const current = window.location.href;
    if (target === 'copy') {
      await navigator.clipboard.writeText(current);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      return;
    }
    const text = encodeURIComponent(document.title);
    const link = encodeURIComponent(current);
    const map = {
      whatsapp: `https://wa.me/?text=${text}%20${link}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${link}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${link}`,
    };
    window.open(map[target], '_blank', 'noopener,noreferrer,width=600,height=520');
  };

  const base =
    'rounded-full border border-current/30 px-3.5 py-1.5 font-util text-[0.65rem] uppercase tracking-[0.13em] opacity-70 transition-opacity hover:opacity-100';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} data-url={url}>
      <button type="button" className={base} onClick={() => share('whatsapp')}>
        WhatsApp
      </button>
      <button type="button" className={base} onClick={() => share('facebook')}>
        Facebook
      </button>
      <button type="button" className={base} onClick={() => share('x')}>
        X
      </button>
      <button type="button" className={base} onClick={() => share('copy')}>
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  );
}
