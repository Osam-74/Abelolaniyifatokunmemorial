import { AUDIO_TRACKS, BROKEN_AUDIO } from './audioManifest';

export type ResolvedAudio = {
  url: string;
  title: string;
  /** Set when the admin has chosen a file that is missing or unusable. */
  warning: string | null;
};

/**
 * Works out which track to play.
 *
 * The admin can name a file explicitly, but if that file is absent — or was
 * corrupted by being renamed through a web editor — we fall back to whatever
 * real audio is sitting in public/audio rather than failing silently.
 */
export function resolveAudio(configuredUrl: string, title: string): ResolvedAudio {
  const fallback = AUDIO_TRACKS[0];
  const chosen = (configuredUrl ?? '').trim();

  // An external link is the admin's business; play it as given.
  if (/^https?:\/\//i.test(chosen)) {
    return { url: chosen, title, warning: null };
  }

  if (chosen.startsWith('/audio/')) {
    const wanted = decodeURIComponent(chosen.slice('/audio/'.length));
    const match = AUDIO_TRACKS.find((track) => track.name === wanted);
    if (match) return { url: match.url, title: title || match.name, warning: null };

    const corrupt = BROKEN_AUDIO.find((file) => file.name === wanted);
    if (corrupt) {
      return {
        url: fallback?.url ?? '',
        title: title || fallback?.name || '',
        warning: `public/audio/${corrupt.name} is only ${corrupt.size} bytes, so it is not real audio. Re-upload it — renaming a binary in GitHub's web editor empties it.`,
      };
    }

    if (fallback) {
      return {
        url: fallback.url,
        title: title || fallback.name,
        warning: `No file named ${wanted} was found, so ${fallback.name} is playing instead.`,
      };
    }

    return {
      url: '',
      title,
      warning: `No usable audio in public/audio. ${
        BROKEN_AUDIO.length ? 'The file that is there is corrupted.' : 'Add an MP3 there.'
      }`,
    };
  }

  if (fallback) return { url: fallback.url, title: title || fallback.name, warning: null };

  return {
    url: '',
    title,
    warning: BROKEN_AUDIO.length
      ? `public/audio/${BROKEN_AUDIO[0].name} is only ${BROKEN_AUDIO[0].size} bytes and cannot play. Re-upload it.`
      : null,
  };
}
