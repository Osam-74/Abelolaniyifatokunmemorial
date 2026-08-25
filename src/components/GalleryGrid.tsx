'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type Photo = {
  id: number;
  url: string;
  caption: string;
  album: string;
  taken_on: string;
};

export default function GalleryGrid({ photos }: { photos: Photo[] }) {
  const albums = useMemo(() => {
    const set = new Set(photos.map((p) => p.album).filter(Boolean));
    return ['All photographs', ...Array.from(set)];
  }, [photos]);

  const [album, setAlbum] = useState('All photographs');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const visible = useMemo(
    () => (album === 'All photographs' ? photos : photos.filter((p) => p.album === album)),
    [album, photos]
  );

  const move = useCallback(
    (step: number) => {
      setOpenIndex((current) => {
        if (current === null) return current;
        return (current + step + visible.length) % visible.length;
      });
    },
    [visible.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenIndex(null);
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'ArrowLeft') move(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [openIndex, move]);

  useEffect(() => {
    if (openIndex === null || !playing) return;
    const timer = setInterval(() => move(1), 4200);
    return () => clearInterval(timer);
  }, [openIndex, playing, move]);

  const active = openIndex === null ? null : visible[openIndex];

  return (
    <>
      {albums.length > 2 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Photo albums">
          {albums.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={album === name}
              onClick={() => setAlbum(name)}
              className={`rounded-full border px-4 py-2 font-util text-[0.7rem] uppercase tracking-[0.12em] transition-colors ${
                album === name
                  ? 'border-ink bg-ink text-mist'
                  : 'border-ink/20 text-ink/65 hover:border-ink/45 hover:text-ink'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10 columns-2 gap-3 md:columns-3 md:gap-5 [&>*]:mb-3 md:[&>*]:mb-5">
        {visible.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => {
              setOpenIndex(index);
              setPlaying(false);
            }}
            className="group relative block w-full break-inside-avoid overflow-hidden rounded-sm bg-mist text-left"
          >
            <Image
              src={photo.url}
              alt={photo.caption || 'Memorial photograph'}
              width={800}
              height={1000}
              sizes="(max-width: 768px) 50vw, 33vw"
              loading="lazy"
              className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent px-4 pb-3 pt-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              {photo.caption && (
                <span className="block font-util text-[0.72rem] leading-snug text-mist">{photo.caption}</span>
              )}
              {photo.taken_on && (
                <span className="mt-0.5 block font-util text-[0.62rem] uppercase tracking-[0.12em] text-mist/60">
                  {photo.taken_on}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photograph viewer"
          className="fixed inset-0 z-[70] flex flex-col bg-ink/97 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8">
            <p className="font-util text-[0.7rem] uppercase tracking-[0.14em] text-mist/55">
              {openIndex! + 1} / {visible.length}
              {active.album && ` · ${active.album}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPlaying((v) => !v)}
                className="rounded-full border border-mist/30 px-4 py-2 font-util text-[0.66rem] uppercase tracking-[0.13em] text-mist/80 transition-colors hover:bg-mist hover:text-ink"
              >
                {playing ? 'Pause slideshow' : 'Play slideshow'}
              </button>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpenIndex(null)}
                className="grid h-10 w-10 place-items-center rounded-full border border-mist/30 text-mist transition-colors hover:bg-mist hover:text-ink"
              >
                <span className="sr-only">Close viewer</span>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <g stroke="currentColor" strokeWidth="1.5">
                    <line x1="2" y1="2" x2="14" y2="14" />
                    <line x1="14" y1="2" x2="2" y2="14" />
                  </g>
                </svg>
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-2">
            <button
              type="button"
              onClick={() => move(-1)}
              className="absolute left-2 z-10 grid h-12 w-12 place-items-center rounded-full text-mist/70 transition-colors hover:bg-mist/10 hover:text-mist md:left-6"
            >
              <span className="sr-only">Previous photograph</span>
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none">
                <path d="M12.5 3.5 6 10l6.5 6.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            <Image
              key={active.id}
              src={active.url}
              alt={active.caption || 'Memorial photograph'}
              width={1600}
              height={1200}
              sizes="90vw"
              className="max-h-full w-auto max-w-full object-contain"
              priority
            />

            <button
              type="button"
              onClick={() => move(1)}
              className="absolute right-2 z-10 grid h-12 w-12 place-items-center rounded-full text-mist/70 transition-colors hover:bg-mist/10 hover:text-mist md:right-6"
            >
              <span className="sr-only">Next photograph</span>
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none">
                <path d="M7.5 3.5 14 10l-6.5 6.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>

          {(active.caption || active.taken_on) && (
            <div className="px-6 pb-8 pt-3 text-center">
              {active.caption && <p className="text-mist/85">{active.caption}</p>}
              {active.taken_on && (
                <p className="mt-1 font-util text-[0.68rem] uppercase tracking-[0.14em] text-mist/45">
                  {active.taken_on}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
