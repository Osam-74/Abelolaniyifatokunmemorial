'use client';

import { useEffect, useRef, useState } from 'react';

type Props = { trackUrl: string; title: string; enabled: boolean };

const VOLUME = 0.4;

export default function MusicPlayer({ trackUrl, title, enabled }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // The visitor asked for this to always play on load, so we try play()
  // the moment the page mounts, on every visit — no "previously turned it
  // off" memory that would silently skip it later. Browsers still block
  // audible autoplay without any prior interaction on that tab, so if the
  // direct attempt is rejected we fall back to starting on the visitor's
  // very first tap/click/keypress instead of waiting for them to find the
  // button — in practice that's still effectively instant.
  useEffect(() => {
    if (!enabled || !mounted || !trackUrl) return;

    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = VOLUME;
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => {
        const start = () => {
          audio.volume = VOLUME;
          audio.play().then(() => setPlaying(true)).catch(() => undefined);
        };
        window.addEventListener('pointerdown', start, { once: true });
        window.addEventListener('keydown', start, { once: true });
        return () => {
          window.removeEventListener('pointerdown', start);
          window.removeEventListener('keydown', start);
        };
      });
  }, [enabled, mounted, trackUrl]);

  if (!enabled || !trackUrl) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setFailed(false);
      audio.volume = VOLUME;
      audio.play().then(() => setPlaying(true)).catch(() => setFailed(true));
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={trackUrl}
        loop
        preload="auto"
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
