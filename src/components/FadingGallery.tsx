'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type Photo = { id: number; url: string; caption: string };

/** Cross-fades through the family's photographs, with each caption. */
export default function FadingGallery({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (photos.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % photos.length), 4500);
    return () => clearInterval(timer);
  }, [photos.length]);

  if (photos.length === 0) return null;

  return (
    <figure>
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-paper">
        {photos.map((photo, i) => (
          <Image
            key={photo.id}
            src={photo.url}
            alt={photo.caption || ''}
            fill
            sizes="280px"
            className={`object-cover transition-opacity duration-[1400ms] ease-in-out ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>
      <figcaption className="mt-2.5 min-h-[2.4em] text-[0.78rem] leading-snug text-ink/55">
        {photos[index]?.caption}
      </figcaption>
    </figure>
  );
}
