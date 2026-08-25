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

export async function submitTribute(_prev: FormState, form: FormData): Promise<FormState> {
  const blocked = guard();
  if (blocked) return blocked;

  const name = text(form, 'name', 120);
  const message = text(form, 'message', 4000);
  if (!name || !message) return { ok: false, message: 'Please add your name and a message.' };
  if (looksLikeSpam(form, 'message')) return { ok: false, message: 'Your tribute could not be sent. Please remove any links and try again.' };
  if (!(await withinLimit('tribute'))) {
    return { ok: false, message: 'You have sent several tributes already. Please try again later today.' };
  }

  await query(
    `INSERT INTO tributes (name, relationship, location, message, photo_url, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')`,
    [name, text(form, 'relationship', 120), text(form, 'location', 120), message, text(form, 'photo_url', 600)]
  );
  revalidatePath('/tributes');
  return { ok: true, message: 'Thank you. Your tribute has been sent to the family and will appear here once they have read it.' };
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
    `INSERT INTO guestbook (name, location, message, status) VALUES ($1, $2, $3, 'pending')`,
    [name, text(form, 'location', 120), message]
  );
  revalidatePath('/guestbook');
  return { ok: true, message: 'Thank you for signing. Your message will appear once the family has read it.' };
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
  const body = text(form, 'body', 12000);
  if (!title || !author || !body) {
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
     VALUES ($1 || '-' || substr(md5(random()::text), 1, 5), $2, $3, $4, $5, $6, 'pending')`,
    [slug, title, author, text(form, 'relationship', 120), body, text(form, 'image_url', 600)]
  );
  revalidatePath('/stories');
  return { ok: true, message: 'Thank you. Your memory has been sent to the family and will be published once they have read it.' };
}
