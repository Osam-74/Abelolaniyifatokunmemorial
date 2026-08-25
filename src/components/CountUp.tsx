'use client';

import { useEffect, useRef, useState } from 'react';

/** Counts up to the candle total once it scrolls into view. */
export default function CountUp({ value, className = '' }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLSpanElement | null>(null);
  const done = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || done.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || value === 0) return;

    setShown(0);
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || done.current) return;
        done.current = true;
        observer.disconnect();

        const duration = Math.min(1600, 400 + value * 12);
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setShown(Math.round(value * eased));
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {shown.toLocaleString('en-NG')}
    </span>
  );
}
