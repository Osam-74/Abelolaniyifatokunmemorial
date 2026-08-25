'use server';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { query, queryOne } from '@/lib/db';
import { checkCredentials, createSession, destroySession, requireSession } from '@/lib/auth';
import { findCollection, SETTING_GROUPS, type Collection, type FieldDef } from '@/lib/collections';
import { getAdminBase } from '@/lib/adminPath';

export type ActionState = { ok: boolean; message: string } | null;

/* ─────────────── Authentication ─────────────── */

export async function signIn(_prev: ActionState, form: FormData): Promise<ActionState> {
  const username = String(form.get('username') ?? '').trim();
  const password = String(form.get('password') ?? '');

  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH) {
    return {
      ok: false,
      message: 'No administrator account is configured. Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH in your environment variables.',
    };
  }
  if (!username || !password) return { ok: false, message: 'Enter your username and password.' };

  // Slows down guessing without needing external infrastructure.
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (!checkCredentials(username, password)) {
    return { ok: false, message: 'That username and password do not match.' };
  }

  await createSession(username);
  redirect(await getAdminBase());
}

export async function signOut(): Promise<void> {
  const base = await getAdminBase();
  await destroySession();
  redirect(`${base}/login`);
}

/* ─────────────── Helpers ─────────────── */

function coerce(field: FieldDef, raw: FormDataEntryValue | null): unknown {
  const value = raw === null ? '' : String(raw);
  switch (field.type) {
    case 'boolean':
      return value === 'on' || value === 'true';
    case 'number':
      return value === '' ? 0 : Number(value);
    case 'date':
      return value === '' ? null : value;
    default:
      return value.trim();
  }
}

function publicPathsFor(collection: Collection): string[] {
  const map: Record<string, string[]> = {
    biography: ['/', '/about'],
    timeline: ['/', '/timeline'],
    legacy: ['/', '/life-and-legacy'],
    photos: ['/', '/gallery'],
    videos: ['/videos'],
    events: ['/', '/events'],
    quotes: ['/', '/quotes'],
    media: ['/media'],
    tributes: ['/', '/tributes'],
    stories: ['/', '/stories'],
    guestbook: ['/guestbook'],
    candles: ['/', '/candles'],
  };
  return map[collection.slug] ?? ['/'];
}

function refresh(collection: Collection) {
  for (const path of publicPathsFor(collection)) revalidatePath(path);
  revalidatePath(`/admin/${collection.slug}`, 'page');
}

/* ─────────────── Content records ─────────────── */

export async function saveRow(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireSession();
  } catch {
    redirect(`${await getAdminBase()}/login`);
  }

  const slug = String(form.get('__collection') ?? '');
  const collection = findCollection(slug);
  if (!collection) return { ok: false, message: 'That content type does not exist.' };

  const rawId = String(form.get('__id') ?? '');
  const id = rawId ? Number(rawId) : null;

  const columns: string[] = [];
  const values: unknown[] = [];

  for (const field of collection.fields) {
    if (field.name === 'slug' && !String(form.get('slug') ?? '').trim()) continue;
    columns.push(field.name);
    values.push(coerce(field, form.get(field.name)));
  }

  for (const field of collection.fields) {
    if (field.required) {
      const index = columns.indexOf(field.name);
      if (index === -1 || !String(values[index] ?? '').trim()) {
        return { ok: false, message: `${field.label} cannot be empty.` };
      }
    }
  }

  try {
    if (id) {
      const assignments = columns.map((column, i) => `${column} = $${i + 1}`).join(', ');
      await query(`UPDATE ${collection.table} SET ${assignments} WHERE id = $${columns.length + 1}`, [
        ...values,
        id,
      ]);
    } else {
      if (collection.slug === 'stories' && !columns.includes('slug')) {
        const title = String(values[collection.fields.findIndex((f) => f.name === 'title')] ?? 'memory');
        columns.push('slug');
        values.push(
          `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'memory'}-${Math.random()
            .toString(36)
            .slice(2, 7)}`
        );
      }
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      await query(
        `INSERT INTO ${collection.table} (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('duplicate key')) {
      return { ok: false, message: 'That web address is already used by another story. Choose a different one.' };
    }
    return { ok: false, message: `Could not save: ${message}` };
  }

  refresh(collection);
  return { ok: true, message: id ? 'Changes saved.' : `New ${collection.singular} added.` };
}

export async function deleteRow(slug: string, id: number): Promise<void> {
  try {
    await requireSession();
  } catch {
    redirect(`${await getAdminBase()}/login`);
  }
  const collection = findCollection(slug);
  if (!collection) return;
  await query(`DELETE FROM ${collection.table} WHERE id = $1`, [id]);
  refresh(collection);
}

export async function setStatus(slug: string, id: number, status: string): Promise<void> {
  try {
    await requireSession();
  } catch {
    redirect(`${await getAdminBase()}/login`);
  }
  const collection = findCollection(slug);
  if (!collection?.moderated) return;
  if (!['pending', 'approved', 'rejected'].includes(status)) return;
  await query(`UPDATE ${collection.table} SET status = $1 WHERE id = $2`, [status, id]);
  refresh(collection);
}

export async function toggleFeatured(slug: string, id: number, value: boolean): Promise<void> {
  try {
    await requireSession();
  } catch {
    redirect(`${await getAdminBase()}/login`);
  }
  const collection = findCollection(slug);
  if (!collection) return;
  if (!collection.fields.some((f) => f.name === 'featured')) return;
  await query(`UPDATE ${collection.table} SET featured = $1 WHERE id = $2`, [value, id]);
  refresh(collection);
}

/* ─────────────── Settings ─────────────── */

export async function saveSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await requireSession();
  } catch {
    redirect(`${await getAdminBase()}/login`);
  }

  const key = String(form.get('__key') ?? '');
  const group = SETTING_GROUPS.find((g) => g.key === key);
  if (!group) return { ok: false, message: 'That settings group does not exist.' };

  const existing = await queryOne<{ value: Record<string, unknown> }>(
    'SELECT value FROM settings WHERE key = $1',
    [key]
  );
  const value: Record<string, unknown> = { ...(existing?.value ?? {}) };

  for (const field of group.fields) {
    if (field.name === 'phones') {
      value.phones = String(form.get('phones') ?? '')
        .split(',')
        .map((phone) => phone.trim())
        .filter(Boolean);
      continue;
    }
    value[field.name] = coerce(field, form.get(field.name));
  }

  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)]
  );

  revalidatePath('/', 'layout');
  return { ok: true, message: 'Saved. The website has been updated.' };
}

/* ─────────────── First-run setup ─────────────── */

export async function runSetup(): Promise<ActionState> {
  try {
    await requireSession();
  } catch {
    redirect(`${await getAdminBase()}/login`);
  }
  try {
    const sql = await readFile(join(process.cwd(), 'src/lib/schema.sql'), 'utf8');
    await query(sql);
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Database tables are ready.' };
  } catch (error) {
    return {
      ok: false,
      message: `Could not create the tables: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/* ─────────────── Batch photograph upload ─────────────── */

export async function savePhotoBatch(
  photos: { url: string; caption: string; album: string; takenOn: string }[]
): Promise<{ ok: boolean; message: string }> {
  try {
    await requireSession();
  } catch {
    redirect(`${await getAdminBase()}/login`);
  }

  const usable = photos.filter((photo) => photo.url.trim());
  if (usable.length === 0) return { ok: false, message: 'No photographs were ready to add.' };

  try {
    const start = await queryOne<{ next: number }>(
      'SELECT coalesce(max(sort_order), 0) + 1 AS next FROM photos'
    );
    const base = start?.next ?? 1;

    const values: unknown[] = [];
    const rows = usable.map((photo, index) => {
      values.push(photo.url.trim(), photo.caption, photo.album, photo.takenOn, base + index);
      const o = index * 5;
      return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5})`;
    });

    await query(
      `INSERT INTO photos (url, caption, album, taken_on, sort_order) VALUES ${rows.join(', ')}`,
      values
    );
  } catch (error) {
    return {
      ok: false,
      message: `Could not add the photographs: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }

  revalidatePath('/');
  revalidatePath('/gallery');
  revalidatePath('/admin/photos');
  return {
    ok: true,
    message: `${usable.length} ${usable.length === 1 ? 'photograph' : 'photographs'} added to the gallery.`,
  };
}
