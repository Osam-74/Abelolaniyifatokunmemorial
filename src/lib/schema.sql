-- Memorial schema. Safe to run repeatedly.

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS timeline (
  id SERIAL PRIMARY KEY,
  year TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  album TEXT NOT NULL DEFAULT 'A Life Remembered',
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  taken_on TEXT DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  url TEXT NOT NULL,
  thumbnail_url TEXT DEFAULT '',
  category TEXT DEFAULT 'Tribute',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stories (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author_name TEXT NOT NULL,
  relationship TEXT DEFAULT '',
  author_photo TEXT DEFAULT '',
  body TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tributes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  relationship TEXT DEFAULT '',
  location TEXT DEFAULT '',
  message TEXT NOT NULL,
  photo_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guestbook (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT DEFAULT '',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  event_date DATE,
  time_label TEXT DEFAULT '',
  venue TEXT DEFAULT '',
  address TEXT DEFAULT '',
  map_query TEXT DEFAULT '',
  livestream_url TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  context TEXT DEFAULT '',
  source TEXT DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media_items (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  outlet TEXT DEFAULT '',
  kind TEXT DEFAULT 'Article',
  url TEXT DEFAULT '',
  published_on TEXT DEFAULT '',
  excerpt TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legacy_sections (
  id SERIAL PRIMARY KEY,
  heading TEXT NOT NULL,
  body TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bio_sections (
  id SERIAL PRIMARY KEY,
  heading TEXT NOT NULL,
  body TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  pull_quote TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spam / rate limiting
CREATE TABLE IF NOT EXISTS submission_log (
  id SERIAL PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  kind TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_log_lookup ON submission_log (ip_hash, kind, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tributes_status ON tributes (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guestbook_status ON guestbook (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candles_status ON candles (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_album ON photos (album, sort_order);

-- Tribute kinds: a flower, a candle, or a note.
ALTER TABLE tributes ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'note';
CREATE INDEX IF NOT EXISTS idx_tributes_kind ON tributes (kind);

-- Simple counters (page views and anything else worth tallying).
CREATE TABLE IF NOT EXISTS site_stats (
  key TEXT PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Photographs sent in by visitors wait for approval; everything already here stays visible.
ALTER TABLE photos ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE photos ADD COLUMN IF NOT EXISTS submitted_by TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_photos_status ON photos (status, sort_order);

-- Anything that predates the status column belongs in the gallery already.
UPDATE photos SET status = 'approved' WHERE status IS NULL OR status = '';

-- Each event can carry its own flyer/poster, uploaded from the admin and
-- shown first (above the details) on the Funeral & Events page.
ALTER TABLE events ADD COLUMN IF NOT EXISTS flyer_url TEXT DEFAULT '';

/* ═══════════════════════════════════════════════════════════════════════════
   Biography redesign, admin control, security hardening, email notifications.
   ADDITIVE ONLY: new columns have safe defaults, nothing is dropped or
   rewritten, and every statement is safe to run repeatedly.
   ═══════════════════════════════════════════════════════════════════════════ */

-- ── Biography chapters (bio_sections) ──────────────────────────────────────
-- Existing rows keep rendering: they become 'published' with layout 'auto'.
ALTER TABLE bio_sections ADD COLUMN IF NOT EXISTS subheading TEXT DEFAULT '';
ALTER TABLE bio_sections ADD COLUMN IF NOT EXISTS period_label TEXT DEFAULT '';
ALTER TABLE bio_sections ADD COLUMN IF NOT EXISTS image_alt TEXT DEFAULT '';
ALTER TABLE bio_sections ADD COLUMN IF NOT EXISTS image_caption TEXT DEFAULT '';
ALTER TABLE bio_sections ADD COLUMN IF NOT EXISTS focal_x INT NOT NULL DEFAULT 50;
ALTER TABLE bio_sections ADD COLUMN IF NOT EXISTS focal_y INT NOT NULL DEFAULT 50;
ALTER TABLE bio_sections ADD COLUMN IF NOT EXISTS layout TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE bio_sections ADD COLUMN IF NOT EXISTS quote_attribution TEXT DEFAULT '';
ALTER TABLE bio_sections ADD COLUMN IF NOT EXISTS show_in_rail BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE bio_sections ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';
ALTER TABLE bio_sections ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE bio_sections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE bio_sections ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_bio_sections_public ON bio_sections (status, deleted_at, sort_order);

-- Last ~10 versions of each chapter, so a bad edit can be rolled back.
CREATE TABLE IF NOT EXISTS bio_revisions (
  id SERIAL PRIMARY KEY,
  section_id INT NOT NULL,
  snapshot JSONB NOT NULL,
  saved_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bio_revisions_section ON bio_revisions (section_id, created_at DESC);

-- Who changed what, and when. Shown on the dashboard.
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id SERIAL PRIMARY KEY,
  admin_email TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  entity TEXT NOT NULL DEFAULT '',
  entity_id TEXT NOT NULL DEFAULT '',
  detail TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_recent ON admin_audit_log (created_at DESC);

-- ── Spam handling on visitor submissions ───────────────────────────────────
-- Why a submission was held or rejected, so the family can see the reason.
ALTER TABLE tributes ADD COLUMN IF NOT EXISTS hold_reason TEXT DEFAULT '';
ALTER TABLE guestbook ADD COLUMN IF NOT EXISTS hold_reason TEXT DEFAULT '';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS hold_reason TEXT DEFAULT '';
ALTER TABLE photos ADD COLUMN IF NOT EXISTS hold_reason TEXT DEFAULT '';

-- ── General-purpose rate limiter (fixed windows; the key holds a hashed IP) ─
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  hits INT NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits (window_start);

-- Blocked events, kept without personal data, for the dashboard.
CREATE TABLE IF NOT EXISTS security_events (
  id SERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  route TEXT NOT NULL DEFAULT '',
  ip_hash TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_security_events_recent ON security_events (created_at DESC);

-- ── Email notification outbox ──────────────────────────────────────────────
-- Every notification is recorded here first. If the mail provider is down or
-- not configured yet, nothing is lost: it stays 'queued' and is retried.
CREATE TABLE IF NOT EXISTS email_outbox (
  id SERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON email_outbox (status, created_at);

/* ═══════════════════════════════════════════════════════════════════════════
   Site restructure: events marked as held, photographs linked to an event.
   ADDITIVE ONLY, safe to re-run.
   ═══════════════════════════════════════════════════════════════════════════ */

-- 'auto' = decide from the date, 'held' = family has marked it as done,
-- 'upcoming' = keep it listed as upcoming even if the date has passed.
ALTER TABLE events ADD COLUMN IF NOT EXISTS held_state TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE events ADD COLUMN IF NOT EXISTS held_note TEXT DEFAULT '';

-- Photographs of an event ("Photographs from the day"). NULL = not tied to an event.
ALTER TABLE photos ADD COLUMN IF NOT EXISTS event_id INT;
CREATE INDEX IF NOT EXISTS idx_photos_event ON photos (event_id) WHERE event_id IS NOT NULL;
