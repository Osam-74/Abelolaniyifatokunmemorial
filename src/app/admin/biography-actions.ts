'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { query, queryOne } from '@/lib/db';
import { getSession, signedInWithin } from '@/lib/auth';
import { getAdminBase } from '@/lib/adminPath';
import { sanitizeHtml } from '@/lib/sanitizeHtml';
import { audit } from '@/lib/audit';
import { sameOrigin } from '@/lib/csrf';

export type BioState = { ok: boolean; message: string; id?: number } | null;

const LAYOUTS = ['auto', 'image-left', 'image-right', 'full-width', 'text-only'];
const KEEP_REVISIONS = 10;
const FRESH_MINUTES = 15;

type Row = {
  id: number; heading: string; subheading: string; period_label: string; body: string; pull_quote: string;
  quote_attribution: string; image_url: string; image_alt: string; image_caption: string; focal_x: number;
  focal_y: number; layout: string; show_in_rail: boolean; status: string; sort_order: number;
};

async function admin() {
  const session = await getSession();
  if (!session) redirect(`${await getAdminBase()}/login`);
  const store = await headers();
  if (!sameOrigin((n) => store.get(n))) throw new Error('Cross-origin request refused.');
  return session;
}

function refreshAll() {
  revalidatePath('/about');
  revalidatePath('/');
  revalidatePath('/admin/biography', 'page');
  revalidatePath('/admin', 'page');
}

function isRedirect(e: unknown) {
  return typeof (e as { digest?: unknown })?.digest === 'string' && String((e as { digest: string }).digest).startsWith('NEXT_REDIRECT');
}

function fail(e: unknown, what: string): BioState {
  if (isRedirect(e)) throw e;
  console.error(`[admin/biography] ${what} failed:`, e instanceof Error ? e.message : e);
  const detail = e instanceof Error ? e.message : '';
  if (/column .* does not exist|relation .* does not exist/i.test(detail)) {
    return { ok: false, message: 'The database is missing a recent update. Go to Overview and press "Update the database", then try again.' };
  }
  return { ok: false, message: 'That could not be saved. Please try again.' };
}

/** Saves the previous version so a bad edit can be rolled back. Keeps the newest few. */
async function snapshot(id: number, by: string) {
  const row = await queryOne<Row>('SELECT * FROM bio_sections WHERE id = $1', [id]);
  if (!row) return;
  await query('INSERT INTO bio_revisions (section_id, snapshot, saved_by) VALUES ($1, $2::jsonb, $3)', [id, JSON.stringify(row), by]);
  await query(
    `DELETE FROM bio_revisions WHERE section_id = $1 AND id NOT IN
       (SELECT id FROM bio_revisions WHERE section_id = $1 ORDER BY created_at DESC, id DESC LIMIT ${KEEP_REVISIONS})`,
    [id]
  );
}

const clampInt = (v: FormDataEntryValue | null, lo: number, hi: number, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d;
};
const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? '').trim().slice(0, max);

/** An image must come from our own storage (or be a site-relative path). */
function safeImage(url: string): string {
  if (!url) return '';
  if (url.startsWith('/') && !url.startsWith('//')) return url.slice(0, 600);
  try {
    const u = new URL(url);
    return u.protocol === 'https:' ? u.toString().slice(0, 800) : '';
  } catch {
    return '';
  }
}

/** Create or update one chapter. `intent` = 'draft' | 'publish' decides the visible state. */
export async function saveChapter(_prev: BioState, form: FormData): Promise<BioState> {
  try {
    const session = await admin();
    const id = Number(form.get('__id')) || null;
    const intent = String(form.get('__intent') ?? 'draft');

    const heading = str(form, 'heading', 200);
    const body = sanitizeHtml(String(form.get('body') ?? '').slice(0, 120000));
    if (!heading) return { ok: false, message: 'Please give the chapter a title.' };
    if (intent === 'publish' && !body.replace(/<[^>]+>/g, '').trim()) {
      return { ok: false, message: 'Add some text before publishing, or save it as a draft.' };
    }

    const layout = LAYOUTS.includes(str(form, 'layout', 20)) ? str(form, 'layout', 20) : 'auto';
    const fields = [
      heading, str(form, 'subheading', 300), str(form, 'period_label', 80), body, str(form, 'pull_quote', 600),
      str(form, 'quote_attribution', 160), safeImage(str(form, 'image_url', 800)), str(form, 'image_alt', 300),
      str(form, 'image_caption', 400), clampInt(form.get('focal_x'), 0, 100, 50), clampInt(form.get('focal_y'), 0, 100, 50),
      layout, form.get('show_in_rail') === 'on' || form.get('show_in_rail') === 'true', session.email,
    ];

    if (id) {
      await snapshot(id, session.email);
      const status = intent === 'publish' ? 'published' : intent === 'draft' ? 'draft' : null;
      await query(
        `UPDATE bio_sections SET heading=$1, subheading=$2, period_label=$3, body=$4, pull_quote=$5, quote_attribution=$6,
           image_url=$7, image_alt=$8, image_caption=$9, focal_x=$10, focal_y=$11, layout=$12, show_in_rail=$13,
           updated_by=$14, updated_at=now() ${status ? ', status=$16' : ''} WHERE id=$15`,
        status ? [...fields, id, status] : [...fields, id]
      );
      await audit(session.email, intent === 'publish' ? 'publish' : 'edit', 'biography', id, heading);
      refreshAll();
      return { ok: true, id, message: intent === 'publish' ? 'Saved and published.' : 'Saved as a draft.' };
    }

    const next = await queryOne<{ n: number }>('SELECT coalesce(max(sort_order), 0) + 1 AS n FROM bio_sections');
    const row = await queryOne<{ id: number }>(
      `INSERT INTO bio_sections (heading, subheading, period_label, body, pull_quote, quote_attribution, image_url, image_alt,
         image_caption, focal_x, focal_y, layout, show_in_rail, updated_by, sort_order, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
      [...fields, next?.n ?? 1, intent === 'publish' ? 'published' : 'draft']
    );
    await audit(session.email, intent === 'publish' ? 'publish' : 'create', 'biography', row?.id ?? 'new', heading);
    refreshAll();
    return { ok: true, id: row?.id, message: intent === 'publish' ? 'Chapter added and published.' : 'Chapter saved as a draft.' };
  } catch (e) {
    return fail(e, 'saving a chapter');
  }
}

export async function setChapterStatus(id: number, status: 'draft' | 'published'): Promise<void> {
  const session = await admin();
  if (status === 'published') {
    const r = await queryOne<{ body: string }>('SELECT body FROM bio_sections WHERE id = $1', [id]);
    if (!r || !sanitizeHtml(r.body ?? '').replace(/<[^>]+>/g, '').trim()) return; // never publish an empty chapter
  }
  await snapshot(id, session.email);
  await query('UPDATE bio_sections SET status=$1, updated_by=$2, updated_at=now() WHERE id=$3 AND deleted_at IS NULL', [status, session.email, id]);
  await audit(session.email, status === 'published' ? 'publish' : 'unpublish', 'biography', id);
  refreshAll();
}

/** Move one step up or down among the live (not-deleted) chapters by swapping positions. */
export async function moveChapter(id: number, direction: 'up' | 'down'): Promise<void> {
  const session = await admin();
  const rows = await query<{ id: number; sort_order: number }>(
    'SELECT id, sort_order FROM bio_sections WHERE deleted_at IS NULL ORDER BY sort_order, id'
  );
  const i = rows.findIndex((r) => r.id === id);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return;
  // Renumber 1..n so equal/legacy sort_order values can never make a swap a no-op.
  const order = rows.map((r) => r.id);
  [order[i], order[j]] = [order[j], order[i]];
  for (let k = 0; k < order.length; k++) {
    await query('UPDATE bio_sections SET sort_order = $1 WHERE id = $2', [k + 1, order[k]]);
  }
  await audit(session.email, 'reorder', 'biography', id, direction);
  refreshAll();
}

export async function trashChapter(id: number): Promise<void> {
  const session = await admin();
  await snapshot(id, session.email);
  await query('UPDATE bio_sections SET deleted_at = now(), updated_by = $1 WHERE id = $2', [session.email, id]);
  await audit(session.email, 'trash', 'biography', id);
  refreshAll();
}

export async function restoreChapter(id: number): Promise<void> {
  const session = await admin();
  const next = await queryOne<{ n: number }>('SELECT coalesce(max(sort_order), 0) + 1 AS n FROM bio_sections WHERE deleted_at IS NULL');
  // Comes back as a DRAFT at the end, never straight onto the live page.
  await query(`UPDATE bio_sections SET deleted_at = NULL, status = 'draft', sort_order = $1, updated_by = $2 WHERE id = $3`, [next?.n ?? 1, session.email, id]);
  await audit(session.email, 'restore', 'biography', id);
  refreshAll();
}

export async function duplicateChapter(id: number): Promise<void> {
  const session = await admin();
  const next = await queryOne<{ n: number }>('SELECT coalesce(max(sort_order), 0) + 1 AS n FROM bio_sections');
  await query(
    `INSERT INTO bio_sections (heading, subheading, period_label, body, pull_quote, quote_attribution, image_url, image_alt,
       image_caption, focal_x, focal_y, layout, show_in_rail, status, sort_order, updated_by)
     SELECT heading || ' (copy)', subheading, period_label, body, pull_quote, quote_attribution, image_url, image_alt,
       image_caption, focal_x, focal_y, layout, show_in_rail, 'draft', $1, $2 FROM bio_sections WHERE id = $3`,
    [next?.n ?? 1, session.email, id]
  );
  await audit(session.email, 'duplicate', 'biography', id);
  refreshAll();
}

/** Permanent delete: only from the trash, and only with a recent sign-in. */
export async function purgeChapter(id: number): Promise<BioState> {
  try {
    const session = await admin();
    if (!(await signedInWithin(FRESH_MINUTES))) {
      return { ok: false, message: `For safety, please sign out and sign in again, then delete permanently (within ${FRESH_MINUTES} minutes).` };
    }
    const r = await queryOne<{ deleted_at: string | null; heading: string }>('SELECT deleted_at, heading FROM bio_sections WHERE id = $1', [id]);
    if (!r?.deleted_at) return { ok: false, message: 'Only chapters in the trash can be deleted permanently.' };
    await query('DELETE FROM bio_revisions WHERE section_id = $1', [id]);
    await query('DELETE FROM bio_sections WHERE id = $1', [id]);
    await audit(session.email, 'purge', 'biography', id, r.heading);
    refreshAll();
    return { ok: true, message: 'Deleted permanently.' };
  } catch (e) {
    return fail(e, 'purging a chapter');
  }
}

/** Roll a chapter back to an earlier saved version (the current text is snapshotted first). */
export async function restoreRevision(revisionId: number): Promise<BioState> {
  try {
    const session = await admin();
    if (!(await signedInWithin(FRESH_MINUTES))) {
      return { ok: false, message: `For safety, please sign out and sign in again, then restore (within ${FRESH_MINUTES} minutes).` };
    }
    const rev = await queryOne<{ section_id: number; snapshot: Row }>('SELECT section_id, snapshot FROM bio_revisions WHERE id = $1', [revisionId]);
    if (!rev) return { ok: false, message: 'That version no longer exists.' };
    const s = rev.snapshot;
    await snapshot(rev.section_id, session.email);
    await query(
      `UPDATE bio_sections SET heading=$1, subheading=$2, period_label=$3, body=$4, pull_quote=$5, quote_attribution=$6,
         image_url=$7, image_alt=$8, image_caption=$9, focal_x=$10, focal_y=$11, layout=$12, show_in_rail=$13,
         updated_by=$14, updated_at=now() WHERE id=$15`,
      [s.heading, s.subheading ?? '', s.period_label ?? '', sanitizeHtml(s.body ?? ''), s.pull_quote ?? '', s.quote_attribution ?? '',
       safeImage(s.image_url ?? ''), s.image_alt ?? '', s.image_caption ?? '', s.focal_x ?? 50, s.focal_y ?? 50,
       LAYOUTS.includes(s.layout) ? s.layout : 'auto', s.show_in_rail !== false, session.email, rev.section_id]
    );
    await audit(session.email, 'restore-version', 'biography', rev.section_id, `revision ${revisionId}`);
    refreshAll();
    return { ok: true, message: 'Restored that version. The previous text was kept in the history.' };
  } catch (e) {
    return fail(e, 'restoring a version');
  }
}
