'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getAdminBase } from '@/lib/adminPath';
import { audit } from '@/lib/audit';
import { sameOrigin } from '@/lib/csrf';
import { rateLimit } from '@/lib/rateLimit';
import { screenText } from '@/lib/spam';
import { enqueueNotice, flushOutbox, buildTestNotice, mailProvider, notifyRecipients } from '@/lib/mail';

export type ToolState = { ok: boolean; message: string } | null;

async function admin() {
  const session = await getSession();
  if (!session) redirect(`${await getAdminBase()}/login`);
  const store = await headers();
  if (!sameOrigin((n) => store.get(n))) throw new Error('Cross-origin request refused.');
  return session;
}

/**
 * Sends a real test message to every admin address and reports what happened,
 * in plain words. Limited to 5 a hour so it cannot be used to flood a mailbox.
 */
export async function sendTestEmail(_prev: ToolState): Promise<ToolState> {
  try {
    const session = await admin();
    const limited = await rateLimit(`testmail:${session.email}`, 5, 3600);
    if (!limited.ok) return { ok: false, message: 'Please wait a little before sending another test.' };

    if (mailProvider() === 'none') {
      return {
        ok: false,
        message: 'No email service is connected yet. Add the Zoho settings in Vercel (see the setup guide), then try again.',
      };
    }
    if (notifyRecipients().length === 0) {
      return { ok: false, message: 'There is no address to send to. Add one to ADMIN_EMAILS in Vercel.' };
    }

    await enqueueNotice(buildTestNotice(session.email));
    const result = await flushOutbox(20);
    await audit(session.email, 'test-email', 'email', 'test', `sent ${result.sent}, failed ${result.failed}`);

    if (result.sent > 0 && result.failed === 0) {
      return { ok: true, message: `Test sent to ${notifyRecipients().join(', ')}. Check the inbox (and the spam folder the first time).` };
    }
    const last = await query<{ last_error: string }>(
      `SELECT coalesce(last_error, '') AS last_error FROM email_outbox WHERE status <> 'sent' ORDER BY id DESC LIMIT 1`
    );
    return {
      ok: false,
      message: `The email service refused the message. ${last[0]?.last_error ? `Reason: ${last[0].last_error.slice(0, 160)}` : 'Check the username, password and port.'}`,
    };
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('[admin] test email failed:', error instanceof Error ? error.message : error);
    return { ok: false, message: 'The test could not be sent. Check the email settings in Vercel.' };
  }
}

const SPAM_TABLES = [
  { table: 'tributes', cols: ['name', 'relationship', 'location', 'message'] },
  { table: 'guestbook', cols: ['name', 'location', 'message'] },
  { table: 'stories', cols: ['title', 'author_name', 'relationship', 'body'] },
] as const;

/**
 * Rejects waiting submissions that the spam rules flag. It only ever touches
 * items that are still 'pending' (never anything already published), and it
 * rejects rather than deletes so a mistake can be undone from the list.
 */
export async function rejectSpamPending(_prev: ToolState): Promise<ToolState> {
  try {
    const session = await admin();
    let total = 0;
    for (const { table, cols } of SPAM_TABLES) {
      const rows = await query<Record<string, unknown> & { id: number }>(
        `SELECT id, ${cols.join(', ')} FROM ${table} WHERE status = 'pending' ORDER BY id LIMIT 500`
      );
      const ids = rows
        .filter((r) => screenText(...cols.map((c) => String(r[c] ?? '').replace(/<[^>]+>/g, ' '))).held)
        .map((r) => r.id);
      if (ids.length) {
        await query(`UPDATE ${table} SET status = 'rejected' WHERE id = ANY($1::int[]) AND status = 'pending'`, [ids]);
        total += ids.length;
      }
    }
    await audit(session.email, 'reject-spam', 'moderation', 'bulk', `${total} rejected`);
    for (const p of ['/', '/about', '/tributes', '/guestbook', '/stories']) revalidatePath(p);
    revalidatePath('/', 'layout');
    return {
      ok: true,
      message: total === 0 ? 'Nothing waiting looks like spam.' : `${total} waiting ${total === 1 ? 'message that looks' : 'messages that look'} like spam ${total === 1 ? 'was' : 'were'} rejected. You can still find them under Rejected in each list.`,
    };
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw error;
    console.error('[admin] reject spam failed:', error instanceof Error ? error.message : error);
    return { ok: false, message: 'That could not be completed. Please try again.' };
  }
}

/**
 * Already-PUBLISHED visitor items that look like spam (the old, unmoderated
 * ones). These are only ever listed, never changed automatically: unpublishing
 * a real mourner's tribute by mistake would be worse than leaving some spam up.
 */
export async function findPublishedSpam(): Promise<Array<{ table: string; id: number; name: string; preview: string }>> {
  const session = await getSession();
  if (!session) return [];
  const out: Array<{ table: string; id: number; name: string; preview: string }> = [];
  for (const { table, cols } of SPAM_TABLES) {
    const rows = await query<Record<string, unknown> & { id: number }>(
      `SELECT id, ${cols.join(', ')} FROM ${table} WHERE status = 'approved' ORDER BY id DESC LIMIT 300`
    );
    for (const r of rows) {
      const text = cols.map((c) => String(r[c] ?? '').replace(/<[^>]+>/g, ' '));
      if (screenText(...text).held) {
        out.push({ table, id: r.id, name: String(r.name ?? r.author_name ?? ''), preview: text[text.length - 1].replace(/\s+/g, ' ').slice(0, 110) });
      }
    }
  }
  return out;
}
