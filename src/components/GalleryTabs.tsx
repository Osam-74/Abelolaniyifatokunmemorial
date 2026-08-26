'use client';

import { useMemo, useState } from 'react';
import GalleryGrid, { type Photo } from './GalleryGrid';
import VideoGrid, { type VideoItem } from './VideoGrid';

const AUDIO = /\.(mp3|m4a|wav|ogg)(\?|$)/i;

export default function GalleryTabs({ photos, videos }: { photos: Photo[]; videos: VideoItem[] }) {
  const film = useMemo(() => videos.filter((v) => !AUDIO.test(v.url)), [videos]);
  const audio = useMemo(() => videos.filter((v) => AUDIO.test(v.url)), [videos]);

  const tabs = [
    { id: 'photo', label: 'Photo', count: photos.length },
    { id: 'video', label: 'Video', count: film.length },
    { id: 'audio', label: 'Audio', count: audio.length },
  ];

  const [active, setActive] = useState(photos.length ? 'photo' : film.length ? 'video' : 'photo');

  const empty = (what: string) => (
    <div className="rounded-sm border border-dashed border-ink/20 bg-mist/30 px-6 py-16 text-center">
      <p className="font-display text-xl text-ink/80">No {what} yet</p>
      <p className="mx-auto mt-2 max-w-md text-[0.95rem] text-ink/55">
        The family is still gathering them.
      </p>
    </div>
  );

  return (
    <>
      {
        <div className="flex border-b border-ink/12" role="tablist" aria-label="Media type">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active === tab.id}
              onClick={() => setActive(tab.id)}
              className={`relative -mb-px px-6 py-3.5 font-util text-[0.74rem] uppercase tracking-[0.13em] transition-colors ${
                active === tab.id ? 'text-ink' : 'text-ink/45 hover:text-ink/75'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-[0.68rem] text-ink/35">{tab.count}</span>
              {active === tab.id && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-deep" />}
            </button>
          ))}
        </div>
      }

      <div className="mt-10">
        {active === 'photo' && (photos.length ? <GalleryGrid photos={photos} /> : empty('photographs'))}
        {active === 'video' && (film.length ? <VideoGrid videos={film} /> : empty('videos'))}
        {active === 'audio' && audio.length === 0 && empty('recordings')}
        {active === 'audio' && audio.length > 0 && (
          <ul className="space-y-3">
            {audio.map((track) => (
              <li key={track.id} className="rounded-sm border border-ink/12 bg-mist/35 p-6">
                <p className="font-display text-lg">{track.title}</p>
                {track.description && (
                  <p className="mt-1.5 text-[0.92rem] text-ink/60">{track.description}</p>
                )}
                <audio src={track.url} controls preload="none" className="mt-4 w-full" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
