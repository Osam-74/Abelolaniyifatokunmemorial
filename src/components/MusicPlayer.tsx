'use client';

import { useEffect, useRef, useState } from 'react';

type Props = { trackUrl: string; title: string; enabled: boolean };

export default function MusicPlayer({ trackUrl, title, enabled }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Browsers block autoplay, so the track starts on the visitor's first
  // gesture, and only if they have not previously switched it off.
  useEffect(() => {
    if (!enabled || !mounted || !trackUrl) return;
    if (localStorage.getItem('memorial-music') === 'off') return;

    const start = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.volume = 0.22;
      audio.play().then(() => setPlaying(true)).catch(() => undefined);
    };

    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
  }, [enabled, mounted, trackUrl]);

  if (!enabled || !trackUrl) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setFailed(false);
      audio.volume = 0.22;
      audio.play().then(() => setPlaying(true)).catch(() => setFailed(true));
      localStorage.setItem('memorial-music', 'on');
    } else {
      audio.pause();
      setPlaying(false);
      localStorage.setItem('memorial-music', 'off');
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={trackUrl}
        loop
        preload="metadata"
        onError={() => {
          console.error(`[music] Could not load ${trackUrl}. Check the file exists and is real audio.`);
          setFailed(true);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        title={failed ? 'The music file could not be played' : playing ? `Pause ${title}` : `Play ${title}`}
        className="fixed bottom-5 left-5 z-40 flex items-center gap-2.5 rounded-full border border-ink/15 bg-paper/90 px-3.5 py-2.5 text-ink shadow-[0_2px_18px_rgba(3,4,94,0.10)] backdrop-blur transition-colors hover:border-ink/35"
      >
        <span className="sr-only">{playing ? 'Turn the music off' : 'Turn the music on'}</span>
        <span className="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-[2px] rounded-full transition-all duration-300 ${failed ? 'bg-ink/25' : 'bg-deep'}`}
              style={{
                height: playing ? `${[7, 13, 9, 12][i]}px` : '3px',
                animation: playing ? `flicker ${1.1 + i * 0.22}s ease-in-out infinite` : 'none',
              }}
            />
          ))}
        </span>
        <span className="font-util text-[0.62rem] uppercase tracking-[0.16em] text-ink/70">
          {failed ? 'No audio' : playing ? 'Music on' : 'Music off'}
        </span>
      </button>
    </>
  );
}
