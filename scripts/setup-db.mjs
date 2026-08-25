#!/usr/bin/env node
/**
 * Creates every table and seeds the memorial with its starting content.
 * Run once after adding DATABASE_URL:  npm run db:setup
 * Running it again is safe — it never overwrites content you have edited.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

// Load .env / .env.local without a dependency.
for (const file of ['.env', '.env.local']) {
  const path = join(root, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, '');
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

if (!process.env.DATABASE_URL) {
  console.error('\nDATABASE_URL is not set. Add it to .env.local (local) or your Vercel project settings.\n');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
});

const settings = {
  profile: {
    fullName: 'Abel Olaniyi Fatokun',
    shortName: 'Abel Olaniyi Fatokun',
    initials: 'AOF',
    birthDate: '',
    birthPlace: 'Ilora, Oyo State, Nigeria',
    deathDate: '',
    tagline: 'Brother. Father. Grandfather. Great-grandfather.',
    heroQuote: 'A life given quietly, and completely, to the people he loved.',
    portraitUrl: '/images/portrait.jpg',
    heroImageUrl: '/images/portrait.jpg',
    squarePortraitUrl: '/images/portrait-square.jpg',
    signatureUrl: '',
  },
  intro: {
    heading: 'A life measured in the people it shaped',
    body: 'Abel Olaniyi Fatokun was a brother, a father, a grandfather and a great-grandfather — four generations who knew him not as a name on a page but as a presence in a room. He lived among his people in Ilora, in Oyo State, and it was there, in the ordinary business of family and faith and work, that he built the thing he leaves behind.\n\nThis website is where that life is kept. The photographs, the stories told by those who knew him, the tributes still being written — all of it gathered in one place, so that the grandchildren who never met him will know exactly who he was.',
    quote: 'Sùn re o.',
  },
  legacyIntro: {
    heading: 'A legacy that lives on',
    body: 'What a person leaves is not only what they built, but who they made. His legacy is carried in four generations of a family, and in a community that knew where to find him.',
  },
  candlesIntro: {
    heading: 'Light a candle in his memory',
    body: 'A small light, left here by someone who is thinking of him. Add yours, and it will stay lit on this wall.',
  },
  footer: {
    message: 'Forever remembered. Forever loved.',
    yorubaFarewell: 'Sùn re o',
    contactEmail: '',
    phones: ['08032810389', '08035325254', '07038427427'],
  },
  audio: {
    enabled: true,
    trackUrl: '/audio/memorial.mp3',
    title: 'Memorial theme',
  },
  seo: {
    title: 'Abel Olaniyi Fatokun — In Loving Memory',
    description:
      'The memorial website of Abel Olaniyi Fatokun: his life story, photographs, tributes, and the memories of the family and community who loved him.',
    ogImage: '/images/portrait-square.jpg',
  },
};

const bioSections = [
  ['Family and early years', 'Where he was born, the family he came from, and the world of Ilora as he first knew it.', 1],
  ['Faith', 'A member of the Emmanuel Baptist Church community in Fojubaye, Ilora, faith ran through the ordinary hours of his life, not only the Sunday ones.', 2],
  ['Work and the years of building', 'The work of his hands, the years of providing, and what he taught by doing rather than saying.', 3],
  ['Marriage and family', 'The family he raised, and the four generations that followed.', 4],
  ['Final years', 'His last seasons, surrounded by the people he had spent his life gathering.', 5],
];

const legacySections = [
  ['Four generations', 'Brother, father, grandfather, great-grandfather. The clearest measure of his life is the number of people who can trace themselves back to him.', 1],
  ['Faith and church', 'His place in the Emmanuel Baptist Church community at Fojubaye, Ilora — the pews he sat in, the people he sat beside.', 2],
  ['Community', 'What he gave to Ilora, and what Ilora gave back.', 3],
  ['What he taught', 'The habits, sayings and standards his children carry, and now teach their own children.', 4],
];

const events = [
  {
    title: 'Final Burial Ceremony & Thanksgiving Service',
    date: '2026-10-31',
    time: '11:00 am',
    venue: 'Emmanuel Baptist Church, Fojubaye',
    address: 'Fojubaye, Ilora, Oyo State, Nigeria',
    map: 'Emmanuel Baptist Church Fojubaye Ilora Oyo State Nigeria',
    description:
      'The final burial ceremony and thanksgiving service for our brother, father, grandfather and great-grandfather, Abel Olaniyi Fatokun. Family, friends and well-wishers are warmly received.\n\nFor enquiries: 08032810389, 08035325254, 07038427427.',
    sort: 1,
  },
];

async function main() {
  await client.connect();
  console.log('Connected.');

  await client.query(readFileSync(join(root, 'src/lib/schema.sql'), 'utf8'));
  console.log('Schema ready.');

  for (const [key, value] of Object.entries(settings)) {
    await client.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO NOTHING`,
      [key, JSON.stringify(value)]
    );
  }
  console.log('Settings seeded.');

  const { rows: bioCount } = await client.query('SELECT count(*)::int AS n FROM bio_sections');
  if (bioCount[0].n === 0) {
    for (const [heading, body, sort] of bioSections) {
      await client.query(
        'INSERT INTO bio_sections (heading, body, sort_order) VALUES ($1, $2, $3)',
        [heading, body, sort]
      );
    }
    console.log('Biography sections seeded.');
  }

  const { rows: legacyCount } = await client.query('SELECT count(*)::int AS n FROM legacy_sections');
  if (legacyCount[0].n === 0) {
    for (const [heading, body, sort] of legacySections) {
      await client.query(
        'INSERT INTO legacy_sections (heading, body, sort_order) VALUES ($1, $2, $3)',
        [heading, body, sort]
      );
    }
    console.log('Legacy sections seeded.');
  }

  const { rows: eventCount } = await client.query('SELECT count(*)::int AS n FROM events');
  if (eventCount[0].n === 0) {
    for (const e of events) {
      await client.query(
        `INSERT INTO events (title, event_date, time_label, venue, address, map_query, description, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [e.title, e.date, e.time, e.venue, e.address, e.map, e.description, e.sort]
      );
    }
    console.log('Events seeded.');
  }

  const { rows: photoCount } = await client.query('SELECT count(*)::int AS n FROM photos');
  if (photoCount[0].n === 0) {
    await client.query(
      `INSERT INTO photos (album, url, caption, featured, sort_order) VALUES
        ('Later years', '/images/portrait.jpg', 'Abel Olaniyi Fatokun', true, 1),
        ('A Life Remembered', '/images/burial-flier.jpg', 'Announcement of the final burial ceremony and thanksgiving service', false, 2)`
    );
    console.log('Photos seeded.');
  }

  const { rows: timelineCount } = await client.query('SELECT count(*)::int AS n FROM timeline');
  if (timelineCount[0].n === 0) {
    await client.query(
      `INSERT INTO timeline (year, title, body, sort_order) VALUES
        ('2026', 'A life remembered', 'The final burial ceremony and thanksgiving service is held at Emmanuel Baptist Church, Fojubaye, Ilora, on 31 October 2026.', 100)`
    );
    console.log('Timeline seeded.');
  }

  await client.end();
  console.log('\nDone. Sign in at /admin to fill in his dates, biography and photographs.\n');
}

main().catch((error) => {
  console.error('\nSetup failed:', error.message, '\n');
  process.exit(1);
});
