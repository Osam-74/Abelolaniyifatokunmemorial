'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type Photo = { id: number; url: string; caption: string; album: string };

/**
 * Cross-fades through the family's photographs. Images are contained rather
 * than cropped, so a tall portrait is never sliced in half.
 */
export default function FadingGallery({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (photos.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % photos.length), 4500);
    return () => clearInterval(timer);
  }, [photos.length]);

  if (photos.length === 0) return null;

  const current = photos[index];

  return (
    <figure>
      <p className="eyebrow mb-3 truncate text-deep">{current?.album || 'Photographs'}</p>

      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-ink/[0.06]">
        {photos.map((photo, i) => (
          <Image
            key={photo.id}
            src={photo.url}
            alt={photo.caption || ''}
            fill
            sizes="280px"
            className={`object-contain transition-opacity duration-[1400ms] ease-in-out ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>

      <figcaption className="mt-2.5 min-h-[2.4em] text-[0.78rem] leading-snug text-ink/55">
        {current?.caption}
      </figcaption>
    </figure>
  );
}
