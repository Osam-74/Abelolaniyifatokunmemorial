import 'server-only';
import { query, queryOne, hasDatabase } from './db';

export const revalidate = 0;

export type Profile = {
  fullName: string; shortName: string; initials: string;
  birthDate: string; birthPlace: string; deathDate: string;
  tagline: string; heroQuote: string;
  portraitUrl: string; heroImageUrl: string; squarePortraitUrl: string; signatureUrl: string;
};

const FALLBACK: Record<string, unknown> = {
  profile: {
    fullName: 'Abel Olaniyi Fatokun', shortName: 'Abel Olaniyi Fatokun', initials: 'AOF',
    birthDate: '', birthPlace: 'Ilora, Oyo State, Nigeria', deathDate: '',
    tagline: 'Brother. Father. Grandfather. Great-grandfather.',
    heroQuote: 'A life given quietly, and completely, to the people he loved.',
    portraitUrl: '/images/portrait.jpg', heroImageUrl: '/images/portrait.jpg',
    squarePortraitUrl: '/images/portrait-square.jpg', signatureUrl: '',
  },
  intro: { heading: 'A life measured in the people it shaped', body: '', quote: 'Sùn re o.' },
  legacyIntro: { heading: 'A legacy that lives on', body: '' },
  candlesIntro: { heading: 'Light a candle in his memory', body: '' },
  footer: { message: 'Forever remembered. Forever loved.', yorubaFarewell: 'Sùn re o', contactEmail: '', phones: [] },
  audio: { enabled: true, trackUrl: '/audio/memorial.mp3', title: 'Memorial theme' },
  seo: { title: 'Abel Olaniyi Fatokun — In Loving Memory', description: '', ogImage: '/images/portrait-square.jpg' },
};

export async function getSetting<T = Record<string, unknown>>(key: string): Promise<T> {
  if (!hasDatabase()) return FALLBACK[key] as T;
  try {
    const row = await queryOne<{ value: unknown }>('SELECT value FROM settings WHERE key = $1', [key]);
    if (!row) return FALLBACK[key] as T;
    return { ...(FALLBACK[key] as object), ...(row.value as object) } as T;
  } catch {
    return FALLBACK[key] as T;
  }
}

export async function getProfile(): Promise<Profile> {
  return getSetting<Profile>('profile');
}

/** Every read below degrades to an empty list if the database is not reachable yet. */
export async function safeQuery<T extends Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (!hasDatabase()) return [];
  try {
    return (await query(sql, params)) as T[];
  } catch {
    return [];
  }
}

export function lifespan(profile: Profile): string {
  const birth = profile.birthDate ? new Date(profile.birthDate).getFullYear() : null;
  const death = profile.deathDate ? new Date(profile.deathDate).getFullYear() : null;
  if (birth && death) return `${birth} — ${death}`;
  if (death) return `— ${death}`;
  if (birth) return `${birth} —`;
  return '';
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
