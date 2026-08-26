'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { query, queryOne, hasDatabase } from './db';

export type FormState = { ok: boolean; message: string } | null;

const LIMITS: Record<string, number> = {
  tribute: 5,
  guestbook: 5,
  candle: 10,
  story: 3,
};

async function visitorHash(): Promise<string> {
  const h = await headers();
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown';
  return createHash('sha256').update(`${ip}:memorial`).digest('hex').slice(0, 32);
}

async function withinLimit(kind: string): Promise<boolean> {
  const hash = await visitorHash();
  const row = await queryOne<{ n: number }>(
    `SELECT count(*)::int AS n FROM submission_log
     WHERE ip_hash = $1 AND kind = $2 AND created_at > now() - interval '1 hour'`,
    [hash, kind]
  );
  if ((row?.n ?? 0) >= (LIMITS[kind] ?? 5)) return false;
  await query('INSERT INTO submission_log (ip_hash, kind) VALUES ($1, $2)', [hash, kind]);
  return true;
}

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

function looksLikeSpam(form: FormData, ...fields: string[]): boolean {
  // Honeypot: a hidden field only a bot fills in.
  if (String(form.get('website') ?? '').trim() !== '') return true;
  // Anything with three or more links is almost always spam here.
  const combined = fields.map((f) => String(form.get(f) ?? '')).join(' ');
  const links = combined.match(/https?:\/\//gi)?.length ?? 0;
  return links >= 3;
}

function guard(): FormState {
  if (!hasDatabase()) {
    return { ok: false, message: 'The memorial is not connected to its database yet. Please try again shortly.' };
  }
  return null;
}

const KINDS = ['note', 'candle', 'flower'] as const;

export async function submitTribute(_prev: FormState, form: FormData): Promise<FormState> {
  const blocked = guard();
  if (blocked) return blocked;

  const name = text(form, 'name', 120);
  const message = text(form, 'message', 4000);
  const requested = text(form, 'kind', 20);
  const kind = (KINDS as readonly string[]).includes(requested) ? requested : 'note';

  if (!name || !message) return { ok: false, message: 'Please add your name and a message.' };
  if (looksLikeSpam(form, 'message')) return { ok: false, message: 'Your tribute could not be posted. Please remove any links and try again.' };
  if (!(await withinLimit('tribute'))) {
    return { ok: false, message: 'You have left several tributes already. Please come back later today.' };
  }

  await query(
    `INSERT INTO tributes (name, relationship, location, message, photo_url, kind, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'approved')`,
    [name, text(form, 'relationship', 120), text(form, 'location', 120), message, text(form, 'photo_url', 600), kind]
  );
  revalidatePath('/');
  revalidatePath('/about');
  revalidatePath('/tributes');
  return { ok: true, message: 'Thank you. Your tribute is now on his memorial.' };
}

export async function submitGuestbook(_prev: FormState, form: FormData): Promise<FormState> {
  const blocked = guard();
  if (blocked) return blocked;

  const name = text(form, 'name', 120);
  const message = text(form, 'message', 1500);
  if (!name || !message) return { ok: false, message: 'Please add your name and a message.' };
  if (looksLikeSpam(form, 'message')) return { ok: false, message: 'Your message could not be sent. Please remove any links and try again.' };
  if (!(await withinLimit('guestbook'))) {
    return { ok: false, message: 'You have signed the guestbook already. Please try again later today.' };
  }

  await query(
    `INSERT INTO guestbook (name, location, message, status) VALUES ($1, $2, $3, 'approved')`,
    [name, text(form, 'location', 120), message]
  );
  revalidatePath('/guestbook');
  return { ok: true, message: 'Thank you for signing his guestbook.' };
}

export async function lightCandle(_prev: FormState, form: FormData): Promise<FormState> {
  const blocked = guard();
  if (blocked) return blocked;

  const name = text(form, 'name', 120);
  if (!name) return { ok: false, message: 'Please add your name so the family knows who lit it.' };
  if (looksLikeSpam(form, 'message')) return { ok: false, message: 'Your candle could not be lit. Please remove any links and try again.' };
  if (!(await withinLimit('candle'))) {
    return { ok: false, message: 'You have lit several candles already. Please come back later today.' };
  }

  await query(
    `INSERT INTO candles (name, message, status) VALUES ($1, $2, 'approved')`,
    [name, text(form, 'message', 400)]
  );
  revalidatePath('/candles');
  revalidatePath('/');
  return { ok: true, message: 'Your candle is lit. Thank you for remembering him.' };
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
  if (looksLikeSpam(form, 'body', 'title')) {
    return { ok: false, message: 'Your story could not be sent. Please remove any links and try again.' };
  }
  if (!(await withinLimit('story'))) {
    return { ok: false, message: 'You have shared several stories already. Please try again later today.' };
  }

  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 70) || 'memory';

  await query(
    `INSERT INTO stories (slug, title, author_name, relationship, body, image_url, status)
     VALUES ($1 || '-' || substr(md5(random()::text), 1, 5), $2, $3, $4, $5, $6, 'approved')`,
    [slug, title, author, text(form, 'relationship', 120), body, text(form, 'image_url', 600)]
  );
  revalidatePath('/');
  revalidatePath('/stories');
  return { ok: true, message: 'Thank you. Your memory is now part of his story.' };
}

export async function submitPhotograph(_prev: FormState, form: FormData): Promise<FormState> {
  const blocked = guard();
  if (blocked) return blocked;

  const url = text(form, 'url', 800);
  const name = text(form, 'name', 120);
  const caption = text(form, 'caption', 400);

  if (!url) return { ok: false, message: 'Please choose a photograph first.' };
  if (!name) return { ok: false, message: 'Please add your name.' };
  if (looksLikeSpam(form, 'caption')) {
    return { ok: false, message: 'That could not be sent. Please remove any links and try again.' };
  }

  await query(
    `INSERT INTO photos (url, caption, album, submitted_by, status, sort_order)
     VALUES ($1, $2, $3, $4, 'pending', (SELECT coalesce(max(sort_order), 0) + 1 FROM photos))`,
    [url, caption, 'Shared by family & friends', name]
  );

  revalidatePath('/gallery');
  return {
    ok: true,
    message: 'Thank you. Your photograph has been sent to the family and will appear here once they have seen it.',
  };
}
