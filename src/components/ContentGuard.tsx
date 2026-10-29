'use client';

import { useEffect } from 'react';

/**
 * A gentle deterrent against casually saving the family's photographs.
 *
 * What it does: stops the right-click menu and drag-to-desktop on IMAGES only.
 * What it deliberately does NOT do: it never blocks text selection, copy,
 * links, form fields, keyboard shortcuts, zoom, or accessibility tools, and it
 * is switched off in the admin area (the family must be able to work normally).
 *
 * Honest limit: anyone determined can still screenshot a photo or read it from
 * the browser's developer tools. This only discourages the one-click save.
 */
export default function ContentGuard() {
  useEffect(() => {
    const inAdmin = () => Boolean(document.querySelector('[data-admin-area]'));

    const onImage = (e: Event) => {
      const t = e.target as Element | null;
      return Boolean(t && t instanceof Element && t.closest('img, picture, [data-protect-image]'));
    };
    const noMenu = (e: Event) => { if (!inAdmin() && onImage(e)) e.preventDefault(); };
    const noDrag = (e: Event) => { if (!inAdmin() && onImage(e)) e.preventDefault(); };

    document.addEventListener('contextmenu', noMenu);
    document.addEventListener('dragstart', noDrag);
    return () => {
      document.removeEventListener('contextmenu', noMenu);
      document.removeEventListener('dragstart', noDrag);
    };
  }, []);

  return null;
}
