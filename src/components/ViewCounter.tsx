'use client';

import { useEffect } from 'react';

/** Records one visit per browser session. */
export default function ViewCounter() {
  useEffect(() => {
    if (sessionStorage.getItem('memorial-counted')) return;
    sessionStorage.setItem('memorial-counted', '1');
    fetch('/api/view', { method: 'POST' }).catch(() => undefined);
  }, []);
  return null;
}
