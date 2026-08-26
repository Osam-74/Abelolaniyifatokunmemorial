'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { query, queryOne, ensureSchema } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { findCollection, SETTING_GROUPS, type Collection, type FieldDef } from '@/lib/collections';
import { getAdminBase } from '@/lib/adminPath';

export type ActionState = { ok: boolean; message: string } | null;

/**
 * Server actions must never throw: an uncaught error becomes an opaque
 * "server-side exception" page with only a digest, which tells nobody anything.
 */
function explain(error: unknown, what: string): ActionState {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[admin] ${what} failed: ${detail}`);

  if (/column .* does not exist|relation .* does not exist/i.test(detail)) {
    return {
      ok: false,
      message:
        'The database is missing a recent update. Go to Overview and press "Update the database", then try again.',
    };
  }
  if (/DATABASE_URL/i.test(detail)) {
    return { ok: false, message: 'The database is not connected. Check DATABASE_URL in your environment variables.' };
  }
  if (/duplicate key/i.test(detail)) {
    return { ok: false, message: 'Something with that web address already exists. Choose a different one.' };
  }
  if (/timeout|ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(detail)) {
    return { ok: false, message: 'Could not reach the database. Try again in a moment.' };
  }
  return {
    ok: false,
    message: process.env.DEBUG_AUTH === '1' ? `Could not save: ${detail}` : 'Could not save. Please try again.',
  };
}

/** redirect() works by throwing, so it must be allowed through. */
function isRedirect(error: unknown): boolean {
  return typeof (error as { digest?: unknown })?.digest === 'string'
    && String((error as { digest: string }).digest).startsWith('NEXT_REDIRECT');
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

/** Collections that appear in the sidebar, which is on every public page. */
const SIDEBAR_COLLECTIONS = new Set(['events', 'photos', 'tributes']);

function refresh(collection: Collection) {
  for (const path of publicPathsFor(collection)) revalidatePath(path);
  if (SIDEBAR_COLLECTIONS.has(collection.slug)) revalidatePath('/', 'layout');
  revalidatePath(`/admin/${collection.slug}`, 'page');
}

/* ─────────────── Content records ─────────────── */

export async function saveRow(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    return await saveRowInner(form);
  } catch (error) {
    if (isRedirect(error)) throw error;
    return explain(error, 'saving a record');
  }
}

async function saveRowInner(form: FormData): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect(`${await getAdminBase()}/login`);

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

  {
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
  }

  refresh(collection);
  return { ok: true, message: id ? 'Changes saved.' : `New ${collection.singular} added.` };
}

export async function deleteRow(slug: string, id: number): Promise<void> {
  const session = await getSession();
  if (!session) redirect(`${await getAdminBase()}/login`);
  const collection = findCollection(slug);
  if (!collection) return;
  await query(`DELETE FROM ${collection.table} WHERE id = $1`, [id]);
  refresh(collection);
}

export async function setStatus(slug: string, id: number, status: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect(`${await getAdminBase()}/login`);
  const collection = findCollection(slug);
  if (!collection?.moderated) return;
  if (!['pending', 'approved', 'rejected'].includes(status)) return;
  await query(`UPDATE ${collection.table} SET status = $1 WHERE id = $2`, [status, id]);
  refresh(collection);
}

export async function toggleFeatured(slug: string, id: number, value: boolean): Promise<void> {
  const session = await getSession();
  if (!session) redirect(`${await getAdminBase()}/login`);
  const collection = findCollection(slug);
  if (!collection) return;
  if (!collection.fields.some((f) => f.name === 'featured')) return;
  await query(`UPDATE ${collection.table} SET featured = $1 WHERE id = $2`, [value, id]);
  refresh(collection);
}

/* ─────────────── Settings ─────────────── */

export async function saveSettings(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const session = await getSession();
    if (!session) redirect(`${await getAdminBase()}/login`);

    const key = String(form.get('__key') ?? '');
    const group = SETTING_GROUPS.find((g) => g.key === key);
    if (!group) return { ok: false, message: 'That settings group does not exist.' };

    const existing = await queryOne<{ value: unknown }>('SELECT value FROM settings WHERE key = $1', [key]);

    // Postgres may hand back jsonb already parsed, or as text.
    let current: Record<string, unknown> = {};
    if (existing?.value && typeof existing.value === 'object') {
      current = existing.value as Record<string, unknown>;
    } else if (typeof existing?.value === 'string') {
      try {
        current = JSON.parse(existing.value);
      } catch {
        current = {};
      }
    }

    const value: Record<string, unknown> = { ...current };

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
      `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [key, JSON.stringify(value)]
    );

    revalidatePath('/', 'layout');
    return { ok: true, message: 'Saved. The website has been updated.' };
  } catch (error) {
    if (isRedirect(error)) throw error;
    return explain(error, 'saving settings');
  }
}

/* ─────────────── First-run setup ─────────────── */

export async function runSetup(): Promise<ActionState> {
  const session = await getSession();
  if (!session) redirect(`${await getAdminBase()}/login`);
  try {
    await ensureSchema();
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Database tables are ready.' };
  } catch (error) {
    if (isRedirect(error)) throw error;
    return {
      ok: false,
      message: `Could not update the database: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/* ─────────────── Batch photograph upload ─────────────── */

export async function savePhotoBatch(
  photos: { url: string; caption: string; album: string; takenOn: string }[]
): Promise<{ ok: boolean; message: string }> {
  const session = await getSession();
  if (!session) redirect(`${await getAdminBase()}/login`);

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

/* ─────────────── Quick caption editing ─────────────── */

export async function savePhotoCaptions(
  updates: { id: number; caption: string; album: string; takenOn: string }[]
): Promise<{ ok: boolean; message: string }> {
  const session = await getSession();
  if (!session) redirect(`${await getAdminBase()}/login`);

  if (updates.length === 0) return { ok: false, message: 'Nothing to save.' };

  try {
    for (const item of updates) {
      await query(
        'UPDATE photos SET caption = $1, album = $2, taken_on = $3 WHERE id = $4',
        [item.caption.trim(), item.album.trim() || 'A Life Remembered', item.takenOn.trim(), item.id]
      );
    }
  } catch (error) {
    const outcome = explain(error, 'saving captions');
    return { ok: false, message: outcome?.message ?? 'Could not save.' };
  }

  revalidatePath('/', 'layout');
  revalidatePath('/gallery');
  revalidatePath('/admin/photos');
  return {
    ok: true,
    message: `${updates.length} ${updates.length === 1 ? 'photograph' : 'photographs'} updated.`,
  };
}
