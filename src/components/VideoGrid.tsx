'use client';

import Image from 'next/image';
import { useState } from 'react';

export type VideoItem = {
  id: number;
  title: string;
  description: string;
  url: string;
  thumbnail_url: string;
  category: string;
};

/** Turns a YouTube or Vimeo link into an embeddable one. Other links open in a new tab. */
export function toEmbed(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return `https://www.youtube.com/embed/${parsed.pathname.slice(1)}`;
    if (host.endsWith('youtube.com')) {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (parsed.pathname.startsWith('/embed/')) return url;
      if (parsed.pathname.startsWith('/live/')) return `https://www.youtube.com/embed/${parsed.pathname.split('/')[2]}`;
    }
    if (host.endsWith('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (/\.(mp4|webm|ogg)$/i.test(parsed.pathname)) return url;
    return null;
  } catch {
    return null;
  }
}

function youtubeThumb(url: string): string | null {
  const embed = toEmbed(url);
  if (!embed || !embed.includes('youtube.com/embed/')) return null;
  const id = embed.split('/embed/')[1]?.split(/[?&]/)[0];
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export default function VideoGrid({ videos }: { videos: VideoItem[] }) {
  const [active, setActive] = useState<VideoItem | null>(null);
  const embed = active ? toEmbed(active.url) : null;
  const isFile = embed ? /\.(mp4|webm|ogg)$/i.test(embed) : false;

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => {
          const thumb = video.thumbnail_url || youtubeThumb(video.url);
          const playable = Boolean(toEmbed(video.url));
          return (
            <article key={video.id} className="group">
              {playable ? (
                <button
                  type="button"
                  onClick={() => setActive(video)}
                  className="relative block aspect-video w-full overflow-hidden rounded-sm bg-ink"
                >
                  {thumb && (
                    <Image
                      src={thumb}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 90vw, 420px"
                      className="object-cover opacity-85 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    />
                  )}
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid h-14 w-14 place-items-center rounded-full border border-mist/60 bg-ink/45 backdrop-blur transition-transform duration-300 group-hover:scale-110">
                      <svg width="15" height="17" viewBox="0 0 15 17" aria-hidden="true">
                        <path d="M0 0v17l15-8.5z" fill="#CAF0F8" />
                      </svg>
                    </span>
                  </span>
                  <span className="sr-only">Play {video.title}</span>
                </button>
              ) : (
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative grid aspect-video w-full place-items-center rounded-sm border border-ink/15 bg-mist/50"
                >
                  <span className="font-util text-[0.7rem] uppercase tracking-[0.13em] text-ink/60">
                    Watch on the original site
                  </span>
                </a>
              )}

              <p className="mt-4 font-util text-[0.66rem] uppercase tracking-[0.14em] text-deep">
                {video.category}
              </p>
              <h2 className="mt-1.5 font-display text-xl leading-snug">{video.title}</h2>
              {video.description && (
                <p className="mt-2 line-clamp-3 text-[0.95rem] leading-relaxed text-ink/60">
                  {video.description}
                </p>
              )}
            </article>
          );
        })}
      </div>

      {active && embed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          className="fixed inset-0 z-[70] grid place-items-center bg-ink/97 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="font-display text-lg text-mist">{active.title}</p>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="grid h-10 w-10 place-items-center rounded-full border border-mist/30 text-mist transition-colors hover:bg-mist hover:text-ink"
              >
                <span className="sr-only">Close video</span>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <g stroke="currentColor" strokeWidth="1.5">
                    <line x1="2" y1="2" x2="14" y2="14" />
                    <line x1="14" y1="2" x2="2" y2="14" />
                  </g>
                </svg>
              </button>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-sm bg-black">
              {isFile ? (
                <video src={embed} controls autoPlay className="h-full w-full" />
              ) : (
                <iframe
                  src={`${embed}?autoplay=1&rel=0`}
                  title={active.title}
                  allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
