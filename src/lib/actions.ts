'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { query, queryOne, hasDatabase } from './db';
import { clientIpFrom, hashIp } from './clientIp';
import { rateLimit, logSecurityEvent } from './rateLimit';
import { screenText, filledTooFast } from './spam';
import { verifyTurnstile } from './turnstile';
import { notify, buildSubmissionNotice } from './mail';

export type FormState = { ok: boolean; message: string } | null;

// Per-visitor limits: [per hour, per day]. Counted per form, per hashed IP.
const LIMITS: Record<string, [number, number]> = {
  tribute: [3, 8],
  guestbook: [3, 8],
  candle: [6, 20],
  story: [2, 5],
  photo: [5, 15],
};

async function visitor(): Promise<{ ip: string; hash: string }> {
  const h = await headers();
  const ip = clientIpFrom((n) => h.get(n));
  return { ip, hash: hashIp(ip) };
}

/** Hourly + daily cap per form. Replaces the old submission_log counter. */
async function withinLimit(kind: string, hash: string): Promise<boolean> {
  const [perHour, perDay] = LIMITS[kind] ?? [3, 8];
  const hour = await rateLimit(`form:${kind}:${hash}:h`, perHour, 3600);
  if (!hour.ok) { await logSecurityEvent('rate_limited', `form:${kind}`, hash); return false; }
  const day = await rateLimit(`form:${kind}:${hash}:d`, perDay, 86400);
  if (!day.ok) { await logSecurityEvent('rate_limited', `form:${kind}`, hash); return false; }
  return true;
}

type Gate = { ok: true; hash: string } | { ok: false; state: FormState };

/**
 * Checks every submission must pass BEFORE anything is written:
 * honeypot, time-trap, Turnstile (when configured) and rate limit.
 * Returns a friendly message on refusal and never reveals which rule fired.
 */
async function gate(form: FormData, kind: string): Promise<Gate> {
  const { ip, hash } = await visitor();

  if (String(form.get('website') ?? '').trim() !== '') {
    await logSecurityEvent('honeypot', `form:${kind}`, hash);
    return { ok: false, state: { ok: false, message: 'That could not be sent. Please try again.' } };
  }
  if (filledTooFast(String(form.get('_t') ?? ''))) {
    await logSecurityEvent('too_fast', `form:${kind}`, hash);
    return { ok: false, state: { ok: false, message: 'That was sent too quickly. Please take a moment and try again.' } };
  }
  const human = await verifyTurnstile(String(form.get('cf-turnstile-response') ?? ''), ip);
  if (!human) {
    await logSecurityEvent('captcha_failed', `form:${kind}`, hash);
    return { ok: false, state: { ok: false, message: 'Please complete the check that you are a person, then send again.' } };
  }
  if (!(await withinLimit(kind, hash))) {
    return { ok: false, state: { ok: false, message: 'You have sent several already. Please come back later today.' } };
  }
  return { ok: true, hash };
}

const THANKS_PENDING =
  'Thank you. The family reads every message, and yours will appear once they have approved it.';

/** Keeps the formatting the editor produces and nothing else. */
const ALLOWED_TAGS = /^\/?(p|br|strong|b|em|i|s|u|h2|h3|ul|ol|li|blockquote)$/i;

function sanitiseHtml(input: string): string {
  return input
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<[^>]+>/g, (tag) => {
      const name = tag.replace(/^<\s*\/?\s*/, '').split(/[\s>/]/)[0];
      return ALLOWED_TAGS.test(name) || ALLOWED_TAGS.test(`/${name}`)
        ? tag.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        : '';
    });
}

function text(form: FormData, key: string, max: number): string {
  const value = String(form.get(key) ?? '').trim();
  return value.slice(0, max);
}

/** Three or more links is bot behaviour: refuse outright instead of holding. */
function tooManyLinks(...values: string[]): boolean {
  return (values.join(' ').match(/https?:\/\//gi)?.length ?? 0) >= 3;
}

function guard(): FormState {
  if (!hasDatabase()) {
    return { ok: false, message: 'The memorial is not connected to its database yet. Please try again shortly.' };
  }
  return null;
}

const KINDS = ['note', 'candle', 'flower'] as const;

/**
 * Visitors may only attach images that came from OUR upload route (Firebase
 * Storage / Vercel Blob). Anything else is dropped, so a submission can never
 * point the site at an arbitrary third-party URL.
 */
function ownedImageUrl(raw: string): string {
  if (!raw) return '';
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return '';
    const ok =
      u.hostname === 'storage.googleapis.com' ||
      u.hostname.endsWith('.firebasestorage.app') ||
      u.hostname === 'firebasestorage.googleapis.com' ||
      u.hostname.endsWith('.public.blob.vercel-storage.com');
    return ok ? u.toString().slice(0, 800) : '';
  } catch {
    return '';
  }
}

/** pending always; 'held' reason recorded when the spam rules flag it. */
function decide(...parts: string[]): { reason: string } {
  const v = screenText(...parts);
  return { reason: v.held ? v.reason : '' };
}

export async function submitTribute(_prev: FormState, form: FormData): Promise<FormState> {
  const blocked = guard();
  if (blocked) return blocked;

  const name = text(form, 'name', 120);
  const message = text(form, 'message', 4000);
  const requested = text(form, 'kind', 20);
  const kind = (KINDS as readonly string[]).includes(requested) ? requested : 'note';

  if (!name || !message) return { ok: false, message: 'Please add your name and a message.' };
  if (tooManyLinks(message)) return { ok: false, message: 'Your tribute could not be sent. Please remove any links and try again.' };

  const g = await gate(form, 'tribute');
  if (!g.ok) return g.state;

  const relationship = text(form, 'relationship', 120);
  const location = text(form, 'location', 120);
  const { reason } = decide(name, relationship, location, message);

  // Always 'pending': nothing a visitor sends is public until the family approves it.
  await query(
    `INSERT INTO tributes (name, relationship, location, message, photo_url, kind, status, hold_reason)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)`,
    [name, relationship, location, message, ownedImageUrl(text(form, 'photo_url', 800)), kind, reason]
  );
  await notify(buildSubmissionNotice({
    kind: 'tribute', name, summary: message, held: Boolean(reason), holdReason: reason,
    extra: [['Relationship', relationship], ['Location', location]],
  }));
  return { ok: true, message: THANKS_PENDING };
}

export async function submitGuestbook(_prev: FormState, form: FormData): Promise<FormState> {
  const blocked = guard();
  if (blocked) return blocked;

  const name = text(form, 'name', 120);
  const message = text(form, 'message', 1500);
  if (!name || !message) return { ok: false, message: 'Please add your name and a message.' };
  if (tooManyLinks(message)) return { ok: false, message: 'Your message could not be sent. Please remove any links and try again.' };

  const g = await gate(form, 'guestbook');
  if (!g.ok) return g.state;

  const location = text(form, 'location', 120);
  const { reason } = decide(name, location, message);

  await query(
    `INSERT INTO guestbook (name, location, message, status, hold_reason) VALUES ($1, $2, $3, 'pending', $4)`,
    [name, location, message, reason]
  );
  await notify(buildSubmissionNotice({
    kind: 'guestbook', name, summary: message, held: Boolean(reason), holdReason: reason,
    extra: [['Location', location]],
  }));
  return { ok: true, message: THANKS_PENDING };
}

export async function lightCandle(_prev: FormState, form: FormData): Promise<FormState> {
  const blocked = guard();
  if (blocked) return blocked;

  const name = text(form, 'name', 120);
  const message = text(form, 'message', 400);
  if (!name) return { ok: false, message: 'Please add your name so the family knows who lit it.' };
  if (tooManyLinks(message)) return { ok: false, message: 'Your candle could not be lit. Please remove any links and try again.' };

  const g = await gate(form, 'candle');
  if (!g.ok) return g.state;

  const { reason } = decide(name, message);
  await query(
    `INSERT INTO candles (name, message, status) VALUES ($1, $2, 'pending')`,
    [name, message]
  );
  // Candles are a gentle, frequent gesture: only notify when one is flagged.
  if (reason) {
    await notify(buildSubmissionNotice({ kind: 'candle', name, summary: message || '(no message)', held: true, holdReason: reason }));
  }
  return { ok: true, message: 'Thank you for remembering him. Your candle will appear once the family has approved it.' };
}

export async function submitStory(_prev: FormState, form: FormData): Promise<FormState> {
  const blocked = guard();
  if (blocked) return blocked;

  const title = text(form, 'title', 200);
  const author = text(form, 'author_name', 120);
  const body = sanitiseHtml(text(form, 'body', 40000));
  const plain = body.replace(/<[^>]+>/g, '').trim();
  if (!title || !author || !plain) {
    return { ok: false, message: 'Please add a title, your name, and your memory.' };
  }
  if (tooManyLinks(body, title)) {
    return { ok: false, message: 'Your story could not be sent. Please remove any links and try again.' };
  }

  const g = await gate(form, 'story');
  if (!g.ok) return g.state;

  const relationship = text(form, 'relationship', 120);
  const { reason } = decide(title, author, relationship, plain);

  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 70) || 'memory';

  await query(
    `INSERT INTO stories (slug, title, author_name, relationship, body, image_url, status, hold_reason)
     VALUES ($1 || '-' || substr(md5(random()::text), 1, 5), $2, $3, $4, $5, $6, 'pending', $7)`,
    [slug, title, author, relationship, body, ownedImageUrl(text(form, 'image_url', 800)), reason]
  );
  await notify(buildSubmissionNotice({
    kind: 'story', name: author, summary: `${title}\n\n${plain}`, held: Boolean(reason), holdReason: reason,
    extra: [['Relationship', relationship]],
  }));
  return { ok: true, message: THANKS_PENDING };
}

export async function submitPhotograph(_prev: FormState, form: FormData): Promise<FormState> {
  const blocked = guard();
  if (blocked) return blocked;

  const url = ownedImageUrl(text(form, 'url', 800));
  const name = text(form, 'name', 120);
  const caption = text(form, 'caption', 400);

  if (!url) return { ok: false, message: 'Please choose a photograph first.' };
  if (!name) return { ok: false, message: 'Please add your name.' };
  if (tooManyLinks(caption)) {
    return { ok: false, message: 'That could not be sent. Please remove any links and try again.' };
  }

  const g = await gate(form, 'photo');
  if (!g.ok) return g.state;

  const { reason } = decide(name, caption);

  // A photograph sent from an event page is filed under that event (if it exists).
  const rawEvent = Number(String(form.get('event_id') ?? ''));
  let eventId: number | null = null;
  let album = 'Shared by family & friends';
  if (Number.isInteger(rawEvent) && rawEvent > 0) {
    const ev = await queryOne<{ id: number; title: string }>('SELECT id, title FROM events WHERE id = $1', [rawEvent]);
    if (ev) { eventId = ev.id; album = ev.title; }
  }

  await query(
    `INSERT INTO photos (url, caption, album, submitted_by, status, hold_reason, event_id, sort_order)
     VALUES ($1, $2, $3, $4, 'pending', $5, $6, (SELECT coalesce(max(sort_order), 0) + 1 FROM photos))`,
    [url, caption, album, name, reason, eventId]
  );
  await notify(buildSubmissionNotice({
    kind: 'photo', name, summary: caption || '(no caption)', held: Boolean(reason), holdReason: reason,
  }));
  return {
    ok: true,
    message: 'Thank you. Your photograph has been sent to the family and will appear here once they have seen it.',
  };
}
