'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Invisible anti-spam fields for visitor forms.
 *
 *  - `_t`  : when the form appeared. The server rejects anything sent in under
 *            ~3 seconds, which no person can do and most bots do instantly.
 *  - Turnstile : Cloudflare's free, privacy-friendly check. Only rendered if
 *            NEXT_PUBLIC_TURNSTILE_SITE_KEY is set; otherwise this component
 *            adds nothing visible. The widget injects its own hidden
 *            `cf-turnstile-response` field into the surrounding <form>.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove: (id: string) => void };
  }
}

export default function FormGuard() {
  // Set after mount so server and client render the same markup.
  const [startedAt, setStartedAt] = useState('');
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { setStartedAt(String(Date.now())); }, []);

  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    let widgetId: string | undefined;
    let cancelled = false;

    const mount = () => {
      if (cancelled || !box.current || !window.turnstile) return;
      widgetId = window.turnstile.render(box.current, { sitekey: SITE_KEY, theme: 'light' });
    };

    if (window.turnstile) {
      mount();
    } else {
      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
      if (!script) {
        script = document.createElement('script');
        script.src = SCRIPT;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', mount);
    }
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, []);

  return (
    <>
      <input type="hidden" name="_t" value={startedAt} />
      {SITE_KEY && <div ref={box} className="min-h-[65px]" />}
    </>
  );
}
