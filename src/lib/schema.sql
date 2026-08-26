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
