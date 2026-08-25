# Abel Olaniyi Fatokun — Memorial

A dedicated memorial website for one person. Not a platform: there is one memorial, one family
administrator, and no public sign-up.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4 and Postgres. Deploys to Vercel.

---

## What is in it

**Public pages** — Home, About, Life & Legacy, Timeline, Gallery, Stories (with individual story
pages), Tributes, Videos, Funeral & Events, Guestbook, Light a Candle, Words of Wisdom, Featured
Media.

**Admin dashboard** at `/admin` — edit every piece of content, upload photographs, and moderate
everything visitors send in. Tributes, stories and guestbook entries stay hidden until approved.

**Also included** — background music with a visitor-controlled on/off that remembers their choice,
a candle wall where every flame flickers on its own timing, gallery lightbox with slideshow and
keyboard navigation, honeypot and rate-limited forms, sitemap, robots, Open Graph tags, and full
`prefers-reduced-motion` support.

---

## Setting it up

### 1. A database

Any Postgres works — [Neon](https://neon.tech) and [Supabase](https://supabase.com) both have free
tiers, or use Vercel's own Postgres. Copy the connection string.

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill it in. To generate the admin password hash and the
auth secret:

```bash
npm install
npm run hash-password -- "the password you want"
```

That prints both `ADMIN_PASSWORD_HASH` and `AUTH_SECRET`. Paste them in, and set `ADMIN_USERNAME`
to whatever you like.

### 3. Create the tables

```bash
npm run db:setup
```

This creates every table and seeds the memorial with its starting content. It is safe to run more
than once — it never overwrites anything you have edited.

If you would rather not run it locally, deploy first, sign in at `/admin`, and press **Create the
tables** on the dashboard.

### 4. Run it

```bash
npm run dev
```

Open http://localhost:3000, and http://localhost:3000/admin to sign in.

---

## Deploying to Vercel

1. Import this repository at [vercel.com/new](https://vercel.com/new).
2. Add the environment variables from `.env.example` under **Settings → Environment Variables**.
   Set `NEXT_PUBLIC_SITE_URL` to your live URL.
3. For photograph uploads, add a **Blob** store under **Storage**. Vercel sets
   `BLOB_READ_WRITE_TOKEN` for you. Without it the admin still works — you paste image links
   instead of uploading files.
4. Deploy. Every push to `main` redeploys.

---

## Adding the background music

Drop an MP3 at `public/audio/memorial.mp3`, or upload one from **Admin → Website settings →
Background music** and paste the link.

Use something you have the right to use — a licensed track, a recording made by the family, or
music released under a permissive licence. Do not upload a commercial recording you do not have
permission for.

The player never autoplays on its own: it starts only after the visitor's first tap or keypress,
plays at low volume, and stays off for anyone who turns it off.

---

## Editing the memorial

Everything is at `/admin`:

| Section | What it controls |
| --- | --- |
| Website settings | Name, dates, portraits, homepage wording, music, footer, SEO |
| Biography sections | The chapters of the About page |
| Timeline | Milestones from birth onwards |
| Legacy sections | The Life & Legacy page |
| Photographs | The gallery and its albums |
| Videos | YouTube, Vimeo or uploaded video |
| Funeral & events | Services, venues, maps, livestreams |
| Words of wisdom | Sayings he was known for |
| Featured media | Articles and publications |
| Tributes / Stories / Guestbook / Candles | Approve, hold, reject or delete anything sent in |

Anything marked "Add to homepage" appears in the featured sections on the front page.

---

## Notes for whoever maintains this

- Content changes appear on the website within about a minute. Approving a tribute refreshes the
  relevant pages straight away.
- Forms are protected by a hidden honeypot field, a link-count check, and a per-visitor hourly
  limit stored in `submission_log`.
- The admin session is a signed JWT in an httpOnly cookie, valid for eight hours. `src/middleware.ts`
  blocks `/admin` without it.
- The colour palette lives in `src/app/globals.css` under `@theme`. Deep navy `#03045E` and ice
  `#CAF0F8` dominate; `#0077B6`, `#00B4D8` and `#90E0EF` are accents. The candle flame is the only
  warm colour on the site, and it is deliberate.
- The portrait in `public/images/` was extracted from the family's burial announcement. Replace it
  with a higher-resolution original as soon as one is available.
