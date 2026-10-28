import 'server-only';
import nodemailer from 'nodemailer';
import { createHmac } from 'node:crypto';
import { query, queryOne, hasDatabase } from './db';
import { allowedEmails } from './auth';

/**
 * Email notifications for the family.
 *
 * Three providers, chosen by which environment variables exist (first match wins):
 *   1. SMTP    (SMTP_HOST + SMTP_USER + SMTP_PASS)  → Zoho Mail, Gmail, any host
 *   2. Resend  (RESEND_API_KEY)                      → plain HTTPS, no SMTP needed
 *   3. Webhook (MAIL_WEBHOOK_URL + MAIL_WEBHOOK_SECRET) → POSTs each email, HMAC-signed, to an
 *      HTTPS endpoint, e.g. a Base44 backend function that sends through the connected Gmail.
 * If neither is set the site still works: every notification is stored in the
 * email_outbox table as 'queued' and is delivered the moment a provider is
 * configured (see flushOutbox, called on each new notification and by the cron route).
 *
 * Emails never contain anything beyond what the visitor typed, are plain and
 * calm in tone, and are sent only to the people who already run the admin.
 */

export type MailKind =
  | 'tribute' | 'guestbook' | 'story' | 'photo' | 'candle'
  | 'held' | 'digest' | 'test' | 'security';

type Provider = 'smtp' | 'resend' | 'webhook' | 'none';

export function mailProvider(): Provider {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.MAIL_WEBHOOK_URL && process.env.MAIL_WEBHOOK_SECRET) return 'webhook';
  return 'none';
}

export function mailFrom(): string {
  return (
    process.env.MAIL_FROM ||
    (process.env.SMTP_USER ? `Abel Fatokun Memorial <${process.env.SMTP_USER}>` : '') ||
    'Abel Fatokun Memorial <onboarding@resend.dev>'
  );
}

/** Who gets notified: NOTIFY_EMAILS if set, otherwise the admin allow-list. */
export function notifyRecipients(): string[] {
  const explicit = (process.env.NOTIFY_EMAILS ?? '')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return explicit.length ? explicit : allowedEmails();
}

/** Off switch without redeploying code: NOTIFY_ENABLED=0 stops new notifications. */
export function notificationsEnabled(): boolean {
  return process.env.NOTIFY_ENABLED !== '0';
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
}

function adminUrl(path = ''): string {
  const base = (process.env.ADMIN_PATH || '/admin').replace(/\/$/, '');
  const site = siteUrl();
  return site ? `${site}${base}${path}` : '';
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

/** Strip anything that could break a header line. */
function oneLine(s: string, max = 150): string {
  return s.replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

function layout(title: string, bodyHtml: string, ctaUrl: string, ctaLabel: string): string {
  const button = ctaUrl
    ? `<p style="margin:28px 0 0"><a href="${escapeHtml(ctaUrl)}" style="background:#03045E;color:#CAF0F8;text-decoration:none;padding:12px 22px;border-radius:4px;font-size:14px;display:inline-block">${escapeHtml(ctaLabel)}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#F6FCFE;font-family:Georgia,'Times New Roman',serif;color:#03045E">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<p style="font:600 11px/1 Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#0077B6;margin:0 0 14px">Abel Olaniyi Fatokun Memorial</p>
<h1 style="font-size:22px;line-height:1.3;margin:0 0 18px;font-weight:500">${escapeHtml(title)}</h1>
<div style="font-size:16px;line-height:1.65">${bodyHtml}</div>${button}
<p style="margin:34px 0 0;font:12px/1.5 Arial,sans-serif;color:#03045E99">You are receiving this because you help look after the memorial website.</p>
</div></body></html>`;
}

type Notice = { kind: MailKind; subject: string; text: string; html: string };

function fieldRows(rows: [string, string][]): { text: string; html: string } {
  const clean = rows.filter(([, v]) => v && v.trim());
  return {
    text: clean.map(([k, v]) => `${k}: ${v}`).join('\n'),
    html: clean
      .map(([k, v]) => `<p style="margin:0 0 10px"><span style="font:600 11px Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#0077B6">${escapeHtml(k)}</span><br>${escapeHtml(v).replace(/\n/g, '<br>')}</p>`)
      .join(''),
  };
}

const LABEL: Record<string, { noun: string; path: string }> = {
  tribute: { noun: 'tribute', path: '/tributes' },
  guestbook: { noun: 'guestbook message', path: '/guestbook' },
  story: { noun: 'story', path: '/stories' },
  photo: { noun: 'photograph', path: '/photos' },
  candle: { noun: 'candle', path: '/candles' },
};

export function buildSubmissionNotice(input: {
  kind: 'tribute' | 'guestbook' | 'story' | 'photo' | 'candle';
  name: string;
  summary: string;
  extra?: [string, string][];
  held?: boolean;
  holdReason?: string;
}): Notice {
  const { noun, path } = LABEL[input.kind];
  const who = oneLine(input.name || 'Someone', 80);
  const subject = input.held
    ? `Held for review: a ${noun} from ${who}`
    : `New ${noun} waiting for you from ${who}`;
  const rows = fieldRows([
    ['From', who],
    ...(input.extra ?? []),
    ['What they wrote', input.summary.slice(0, 1500)],
    ...(input.held ? ([['Why it was held', input.holdReason || 'flagged by the spam rules']] as [string, string][]) : []),
  ]);
  const intro = input.held
    ? 'This one was held back automatically and is NOT on the website. If it is genuine, you can approve it.'
    : 'It is not on the website yet. It will appear once you approve it.';
  const url = adminUrl(path);
  return {
    kind: input.held ? 'held' : input.kind,
    subject,
    text: `${intro}\n\n${rows.text}\n\n${url ? `Review it: ${url}` : 'Open the admin area to review it.'}`,
    html: layout(subject, `<p style="margin:0 0 18px">${escapeHtml(intro)}</p>${rows.html}`, url, 'Review in the admin area'),
  };
}

/* ─────────────── Outbox ─────────────── */

/** Record a notification for every recipient. Never throws. */
export async function enqueueNotice(notice: Notice): Promise<void> {
  if (!hasDatabase() || !notificationsEnabled()) return;
  const to = notifyRecipients();
  if (to.length === 0) return;
  try {
    for (const email of to) {
      await query(
        `INSERT INTO email_outbox (kind, to_email, subject, body_text, body_html) VALUES ($1, $2, $3, $4, $5)`,
        [notice.kind, email, oneLine(notice.subject, 200), notice.text, notice.html]
      );
    }
  } catch (error) {
    console.error('[mail] could not queue notification:', error instanceof Error ? error.message : error);
  }
}

let transporter: nodemailer.Transporter | null = null;
function smtp(): nodemailer.Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

async function deliver(row: { to_email: string; subject: string; body_text: string; body_html: string }): Promise<void> {
  const provider = mailProvider();
  if (provider === 'smtp') {
    await smtp().sendMail({
      from: mailFrom(),
      to: row.to_email,
      subject: row.subject,
      text: row.body_text,
      html: row.body_html || undefined,
    });
    return;
  }
  if (provider === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: mailFrom(),
        to: [row.to_email],
        subject: row.subject,
        text: row.body_text,
        html: row.body_html || undefined,
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return;
  }
  if (provider === 'webhook') {
    const payload = JSON.stringify({
      from: mailFrom(),
      to: row.to_email,
      subject: row.subject,
      text: row.body_text,
      html: row.body_html || undefined,
      sentAt: new Date().toISOString(),
    });
    // The receiver recomputes this HMAC over the raw body with the shared secret.
    const signature = createHmac('sha256', process.env.MAIL_WEBHOOK_SECRET!).update(payload).digest('hex');
    const url = process.env.MAIL_WEBHOOK_URL!;
    if (!/^https:\/\//i.test(url)) throw new Error('MAIL_WEBHOOK_URL must be https');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Memorial-Signature': signature },
      body: payload,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`Mail webhook ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return;
  }
  throw new Error('No mail provider configured');
}

export type FlushResult = { provider: Provider; sent: number; failed: number; pending: number };

/**
 * Deliver queued emails. Safe to call concurrently: each row is claimed with
 * FOR UPDATE SKIP LOCKED so two runs never send the same message twice.
 */
export async function flushOutbox(max = 20): Promise<FlushResult> {
  const provider = mailProvider();
  if (!hasDatabase()) return { provider, sent: 0, failed: 0, pending: 0 };
  if (provider === 'none') {
    const p = await queryOne<{ n: number }>(`SELECT count(*)::int n FROM email_outbox WHERE status = 'queued'`);
    return { provider, sent: 0, failed: 0, pending: p?.n ?? 0 };
  }

  let sent = 0;
  let failed = 0;
  const rows = await query<{ id: number; to_email: string; subject: string; body_text: string; body_html: string; attempts: number }>(
    `UPDATE email_outbox SET attempts = attempts + 1
     WHERE id IN (
       SELECT id FROM email_outbox
       WHERE status = 'queued' AND attempts < 5
       ORDER BY created_at LIMIT $1 FOR UPDATE SKIP LOCKED
     ) RETURNING id, to_email, subject, body_text, body_html, attempts`,
    [max]
  );

  for (const row of rows) {
    try {
      await deliver(row);
      await query(`UPDATE email_outbox SET status = 'sent', sent_at = now(), last_error = '' WHERE id = $1`, [row.id]);
      sent += 1;
    } catch (error) {
      failed += 1;
      const msg = (error instanceof Error ? error.message : String(error)).slice(0, 300);
      // After the 5th failed attempt the row is parked as 'failed' so it stops retrying.
      await query(
        `UPDATE email_outbox SET last_error = $2, status = CASE WHEN attempts >= 5 THEN 'failed' ELSE 'queued' END WHERE id = $1`,
        [row.id, msg]
      );
    }
  }
  const p = await queryOne<{ n: number }>(`SELECT count(*)::int n FROM email_outbox WHERE status = 'queued'`);
  return { provider, sent, failed, pending: p?.n ?? 0 };
}

/** Queue + attempt immediately. The visitor's request never waits on or fails because of email. */
export async function notify(notice: Notice): Promise<void> {
  await enqueueNotice(notice);
  if (mailProvider() === 'none') return;
  try {
    await Promise.race([flushOutbox(10), new Promise((r) => setTimeout(r, 6000))]);
  } catch (error) {
    console.error('[mail] flush failed:', error instanceof Error ? error.message : error);
  }
}

export function buildTestNotice(requestedBy: string): Notice {
  const text = `This is a test message from the memorial website.\n\nRequested by ${requestedBy}. If you can read this, email notifications are working.`;
  return {
    kind: 'test',
    subject: 'Test: memorial email notifications are working',
    text,
    html: layout(
      'Email notifications are working',
      `<p style="margin:0">This is a test message from the memorial website.</p><p>Requested by ${escapeHtml(requestedBy)}. If you can read this, notifications are set up correctly.</p>`,
      adminUrl(), 'Open the admin area'
    ),
  };
}

export function buildDigestNotice(counts: { label: string; n: number; path: string }[]): Notice {
  const total = counts.reduce((s, c) => s + c.n, 0);
  const lines = counts.map((c) => `${c.n} ${c.label}`);
  const subject = `${total} ${total === 1 ? 'item is' : 'items are'} waiting for you on the memorial`;
  const url = adminUrl();
  return {
    kind: 'digest',
    subject,
    text: `Waiting for review:\n\n${lines.join('\n')}\n\n${url ? `Open the admin area: ${url}` : ''}`,
    html: layout(
      subject,
      `<ul style="padding-left:18px;margin:0">${counts.map((c) => `<li style="margin-bottom:6px">${c.n} ${escapeHtml(c.label)}</li>`).join('')}</ul>`,
      url, 'Open the admin area'
    ),
  };
}
