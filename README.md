# Abel Olaniyi Fatokun — Memorial

A dedicated memorial website for one person. Not a platform: there is one memorial, one family
administrator, and no public sign-up.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4 and Postgres. Deploys to Vercel.

---

## What is in it

**Public pages** — Home, About, Life & Legacy, Timeline, Gallery, Stories (with individual story
pages), Tributes, Videos, Funeral & Events, Guestbook, Light a Candle, Words of Wisdom, Featured
Media.

**Admin dashboard** at whatever `ADMIN_PATH` is set to — edit every piece of content, upload photographs, and moderate
everything visitors send in. Tributes, stories and guestbook entries stay hidden until approved.

**Photograph uploads** — drag in a batch, give each one its own caption and date, and they all
land in the chosen album. Anything over 2&nbsp;MB is resized in the browser before it uploads, so
photos straight off a phone work without anyone editing them first.

**Also included** — background music with a visitor-controlled on/off that remembers their choice,
a candle wall where every flame flickers on its own timing, gallery lightbox with slideshow and
keyboard navigation, honeypot and rate-limited forms, sitemap, robots, Open Graph tags, and full
`prefers-reduced-motion` support.

---

## Setting it up

### 1. A database

Any Postgres works — [Neon](https://neon.tech) and [Supabase](https://supabase.com) both have free
tiers, or use Vercel's own Postgres. Copy the connection string.

### 2. Sign-in

Administrators sign in with Firebase Authentication — Google, or email and password. There is no
password stored in this codebase and no sign-up form anywhere on the site.

In the Firebase console:

1. **Authentication → Sign-in method** → enable **Google** and **Email/Password**.
2. **Authentication → Settings → User actions** → untick **Enable create (sign-up)**. This stops
   anyone creating an account, including with a Google account.
3. **Authentication → Users → Add user** to create each administrator by hand.
4. Add every one of those addresses to `ADMIN_EMAILS`.

Both steps matter. Firebase proves *who* someone is; `ADMIN_EMAILS` decides whether that person may
manage the memorial. If the sign-up switch is ever turned back on, the allowlist still holds.
Removing an address revokes access on the next request, not in eight hours.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill it in. Generate the cookie secret with:

```bash
npm install
npm run secret
```

### 4. Firebase Storage

Uploads go to Firebase Cloud Storage. In the Firebase console:

1. **Storage → Get started.** Cloud Storage requires the Blaze plan as of February 2026, even at
   zero usage. Staying inside Google Cloud's Always Free tier (5 GB-months of storage, 100 GB of
   North American egress per month) costs nothing — but choose a **US region**, because Always Free
   does not apply elsewhere.
2. Set a **budget alert** in the Google Cloud billing console. Blaze has no hard spending cap.
3. **Project settings → Service accounts → Generate new private key.** Paste the whole JSON file
   into `FIREBASE_SERVICE_ACCOUNT` as one line, and set `FIREBASE_STORAGE_BUCKET`.

Nothing Firebase-related reaches the browser. Uploads go through `/api/upload`, which runs on the
server behind the admin session, using the Admin SDK. That means Firebase Storage security rules
are not what protects your files — the session is. Keep the rules closed:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Uploaded files are made individually public, so the image links work in a browser and never
expire. The closed rules block the client SDK, which this site does not use.

### 5. Create the tables

```bash
npm run db:setup
```

This creates every table and seeds the memorial with its starting content. It is safe to run more
than once — it never overwrites anything you have edited.

If you would rather not run it locally, deploy first, sign in at `/admin`, and press **Create the
tables** on the dashboard.

### 6. Run it

```bash
npm run dev
```

Open http://localhost:3000, and http://localhost:3000 + your `ADMIN_PATH` to sign in.

---

## Deploying to Vercel

1. Import this repository at [vercel.com/new](https://vercel.com/new).
2. Add the environment variables from `.env.example` under **Settings → Environment Variables**.
   Set `NEXT_PUBLIC_SITE_URL` to your live URL.
3. Deploy. Every push to `main` redeploys.

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

## Changing the admin address

Set `ADMIN_PATH` in Vercel to any single segment — `/family-office`, `/fatokun-private`, anything.
Redeploy and the dashboard moves. While a custom path is set, `/admin` returns a 404 as though it
were never there.

`ADMIN_PATH` is a server-only variable: it is not prefixed with `NEXT_PUBLIC_`, so it is never
compiled into the JavaScript sent to visitors. The footer no longer links to the dashboard either.
Treat the address as one more thing worth keeping quiet, but not as the security itself — that is
the password and the signed session.

## Editing the memorial

Everything is at your `ADMIN_PATH`:

| Section | What it controls |
| --- | --- |
| Website settings | Name, dates, portraits, homepage wording, music, footer, SEO |
| Biography sections | The chapters of the About page |
| Timeline | Milestones from birth onwards |
| Legacy sections | The Life & Legacy page |
| Photographs | The gallery and its albums, with batch upload |
| Videos | YouTube, Vimeo or uploaded video |
| Funeral & events | Services, venues, maps, livestreams |
| Words of wisdom | Sayings he was known for |
| Featured media | Articles and publications |
| Tributes / Stories / Guestbook / Candles | Approve, hold, reject or delete anything sent in |

Anything marked "Add to homepage" appears in the featured sections on the front page.

---

## A note on the sign-in UI

There is no maintained drop-in Firebase auth UI. `react-firebaseui` has had no release since
November 2021, `firebaseui-react` is explicitly unmaintained by its author, and `firebaseui-web`
has open Next.js App Router bugs. So the sign-in *logic* is entirely Firebase's SDK — no
hand-rolled password handling — while the form itself is built in this site's own design language.

## Notes for whoever maintains this

- Content changes appear on the website within about a minute. Approving a tribute refreshes the
  relevant pages straight away.
- Forms are protected by a hidden honeypot field, a link-count check, and a per-visitor hourly
  limit stored in `submission_log`.
- Sign-in is Firebase Authentication. The browser gets an ID token, `/api/auth/session` verifies it
  with the Admin SDK, checks it against `ADMIN_EMAILS`, and issues a short signed JWT in an
  httpOnly cookie — that last step exists so the Edge middleware can check sessions without the
  Admin SDK, which does not run on Edge.
- The session cookie is valid for eight hours.
  `src/middleware.ts` rewrites `ADMIN_PATH` onto the real `/admin` routes, blocks them without a
  valid session, and 404s the default path when a custom one is in use.
- Uploads go to Firebase Cloud Storage via the Admin SDK, with Vercel Blob kept as an automatic
  fallback if the Firebase variables are ever absent.
- Motion is deliberately quiet: a hairline scroll indicator, the hero name rising line by line,
  a count-up on the candle total, cards lifting on hover, and pages settling in on navigation.
  Every one of them is switched off under `prefers-reduced-motion`.
- Uploads are capped at 2&nbsp;MB per file. `src/lib/imageResize.ts` downscales larger images to a
  2400px long edge and steps the JPEG quality down until they fit.
- The colour palette lives in `src/app/globals.css` under `@theme`. Deep navy `#03045E` and ice
  `#CAF0F8` dominate; `#0077B6`, `#00B4D8` and `#90E0EF` are accents. The candle flame is the only
  warm colour on the site, and it is deliberate.
- The portrait in `public/images/` was extracted from the family's burial announcement. Replace it
  with a higher-resolution original as soon as one is available.
