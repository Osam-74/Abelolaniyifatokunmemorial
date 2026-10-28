/**
 * Server-side spam screening for visitor submissions.
 *
 * Nothing is silently thrown away: a flagged submission is HELD as pending
 * with a reason, so a real mourner who trips a rule can be rescued by the
 * family. Obvious bots (honeypot, too-fast, 3+ links) are refused outright.
 * Pure functions, no I/O, so they are unit-testable.
 */
export type SpamVerdict = { held: boolean; reason: string };

const URL_RE = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|net|org|vip|io|co|biz|info|xyz|ng|uk|online|site|shop)\b/i;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(\+?\d[\s().-]*){9,}/;

// Phrases that show up in the cold-outreach spam this site has actually received,
// plus common SEO / marketing vocabulary. Whole-word matching keeps ordinary
// condolence wording ("he ranked first", "a video of him") from being punished
// on its own: a single weak phrase only counts together with another signal.
const STRONG_PHRASES = [
  'search index', 'google search', 'search results', 'seo', 'aeo', 'backlink', 'backlinks',
  'rank your website', 'ranking', 'organic traffic', 'domain authority', 'web traffic',
  'advertise your business', 'impactful video', 'engaging video', 'promo video',
  'increase your sales', 'digital marketing', 'lead generation', 'free quote', 'limited offer',
  'click here', 'buy now', 'crypto', 'forex', 'casino', 'loan offer', 'whatsapp me',
];
const WEAK_PHRASES = ['video', 'website', 'business', 'marketing', 'rank', 'visibility', 'offer', 'price', 'service'];

function countMatches(text: string, phrases: string[]): number {
  let n = 0;
  for (const p of phrases) {
    const re = new RegExp(`(^|[^a-z])${p.replace(/\s+/g, '\\s+')}([^a-z]|$)`, 'i');
    if (re.test(text)) n += 1;
  }
  return n;
}

export function screenText(...parts: string[]): SpamVerdict {
  const text = parts.join(' \n ').trim();
  if (!text) return { held: false, reason: '' };

  const reasons: string[] = [];
  if (URL_RE.test(text)) reasons.push('contains a web address');
  if (EMAIL_RE.test(text)) reasons.push('contains an email address');
  if (PHONE_RE.test(text)) reasons.push('contains a phone number');

  const strong = countMatches(text, STRONG_PHRASES);
  const weak = countMatches(text, WEAK_PHRASES);
  if (strong >= 1) reasons.push('uses marketing or SEO wording');
  else if (weak >= 3) reasons.push('reads like marketing');

  if (/(.)\1{9,}/.test(text)) reasons.push('has long runs of repeated characters');
  if (/\$\s?\d/.test(text)) reasons.push('mentions a price');

  // Mostly non-letters (symbols, emoji walls) is not a tribute.
  const letters = (text.match(/\p{L}/gu) ?? []).length;
  if (text.length > 40 && letters / text.length < 0.5) reasons.push('is mostly symbols');

  return reasons.length ? { held: true, reason: reasons.join('; ') } : { held: false, reason: '' };
}

/** Same rules, exposed as a SQL-free matcher for the admin "reject matching spam" action. */
export function looksLikeSpamText(...parts: string[]): boolean {
  return screenText(...parts).held;
}

/** A human needs a few seconds to write a tribute; a bot posts instantly. */
export const MIN_FILL_MS = 3000;
export function filledTooFast(startedAt: string | null | undefined, now = Date.now()): boolean {
  const t = Number(startedAt);
  if (!Number.isFinite(t) || t <= 0) return true; // missing/garbled timestamp counts as a bot
  return now - t < MIN_FILL_MS;
}
