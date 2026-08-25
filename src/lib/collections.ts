export type FieldType =
  | 'text'
  | 'textarea'
  | 'longtext'
  | 'url'
  | 'image'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select';

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  options?: string[];
  required?: boolean;
  half?: boolean;
  placeholder?: string;
};

export type Collection = {
  slug: string;
  table: string;
  label: string;
  singular: string;
  description: string;
  group: 'Content' | 'Moderation';
  orderBy: string;
  moderated?: boolean;
  /** Column shown as the row title in the list. */
  titleField: string;
  /** Extra columns shown as the row subtitle. */
  subtitleFields?: string[];
  fields: FieldDef[];
};

const STATUS: FieldDef = {
  name: 'status',
  label: 'Status',
  type: 'select',
  options: ['pending', 'approved', 'rejected'],
  half: true,
};

const SORT: FieldDef = {
  name: 'sort_order',
  label: 'Order on the page',
  type: 'number',
  half: true,
  help: 'Lower numbers appear first.',
};

const FEATURED: FieldDef = {
  name: 'featured',
  label: 'Show on the homepage',
  type: 'boolean',
  half: true,
};

export const COLLECTIONS: Collection[] = [
  {
    slug: 'biography',
    table: 'bio_sections',
    label: 'Biography sections',
    singular: 'section',
    description: 'The chapters of his life story on the About page.',
    group: 'Content',
    orderBy: 'sort_order, id',
    titleField: 'heading',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text', required: true },
      { name: 'body', label: 'Text', type: 'longtext', required: true, help: 'Leave a blank line between paragraphs.' },
      { name: 'pull_quote', label: 'Pull quote', type: 'textarea' },
      { name: 'image_url', label: 'Photograph', type: 'image' },
      SORT,
    ],
  },
  {
    slug: 'timeline',
    table: 'timeline',
    label: 'Timeline',
    singular: 'milestone',
    description: 'Milestones from birth to legacy, shown on the Timeline page.',
    group: 'Content',
    orderBy: 'sort_order, year, id',
    titleField: 'title',
    subtitleFields: ['year'],
    fields: [
      { name: 'year', label: 'Year or date', type: 'text', required: true, half: true, placeholder: '1955' },
      SORT,
      { name: 'title', label: 'What happened', type: 'text', required: true },
      { name: 'body', label: 'Description', type: 'longtext' },
      { name: 'image_url', label: 'Photograph', type: 'image' },
    ],
  },
  {
    slug: 'legacy',
    table: 'legacy_sections',
    label: 'Legacy sections',
    singular: 'section',
    description: 'What continues after him, shown on the Life & Legacy page.',
    group: 'Content',
    orderBy: 'sort_order, id',
    titleField: 'heading',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text', required: true },
      { name: 'body', label: 'Text', type: 'longtext', required: true },
      { name: 'image_url', label: 'Photograph', type: 'image' },
      SORT,
    ],
  },
  {
    slug: 'photos',
    table: 'photos',
    label: 'Photographs',
    singular: 'photograph',
    description: 'Every image in the gallery. The first featured photograph leads the homepage.',
    group: 'Content',
    orderBy: 'sort_order, id',
    titleField: 'caption',
    subtitleFields: ['album'],
    fields: [
      { name: 'url', label: 'Photograph', type: 'image', required: true },
      { name: 'caption', label: 'Caption', type: 'text' },
      { name: 'album', label: 'Album', type: 'text', half: true, placeholder: 'Childhood, Family, Career…' },
      { name: 'taken_on', label: 'When it was taken', type: 'text', half: true, placeholder: 'August 1974' },
      FEATURED,
      SORT,
    ],
  },
  {
    slug: 'videos',
    table: 'videos',
    label: 'Videos',
    singular: 'video',
    description: 'YouTube, Vimeo or uploaded video links.',
    group: 'Content',
    orderBy: 'sort_order, id',
    titleField: 'title',
    subtitleFields: ['category'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'url', label: 'Video link', type: 'url', required: true, placeholder: 'https://www.youtube.com/watch?v=…' },
      { name: 'category', label: 'Category', type: 'text', half: true, placeholder: 'Tribute, Interview, Service…' },
      SORT,
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'thumbnail_url', label: 'Custom thumbnail', type: 'image', help: 'Optional — YouTube thumbnails are found automatically.' },
    ],
  },
  {
    slug: 'events',
    table: 'events',
    label: 'Funeral & events',
    singular: 'event',
    description: 'Services, gatherings and anniversaries, with venue and map.',
    group: 'Content',
    orderBy: 'event_date NULLS LAST, sort_order, id',
    titleField: 'title',
    subtitleFields: ['venue'],
    fields: [
      { name: 'title', label: 'Event name', type: 'text', required: true },
      { name: 'event_date', label: 'Date', type: 'date', half: true },
      { name: 'time_label', label: 'Time', type: 'text', half: true, placeholder: '11:00 am' },
      { name: 'venue', label: 'Venue', type: 'text' },
      { name: 'address', label: 'Address', type: 'text' },
      { name: 'map_query', label: 'What to search for on the map', type: 'text', help: 'Leave empty to use the venue and address.' },
      { name: 'livestream_url', label: 'Livestream or recording link', type: 'url' },
      { name: 'description', label: 'Details', type: 'longtext' },
      SORT,
    ],
  },
  {
    slug: 'quotes',
    table: 'quotes',
    label: 'Words of wisdom',
    singular: 'saying',
    description: 'Things he said. A featured saying appears on the homepage.',
    group: 'Content',
    orderBy: 'sort_order, id',
    titleField: 'text',
    fields: [
      { name: 'text', label: 'The words', type: 'textarea', required: true },
      { name: 'source', label: 'Where it came from', type: 'text', half: true, placeholder: 'Told to his grandchildren' },
      { name: 'context', label: 'Context', type: 'textarea' },
      FEATURED,
      SORT,
    ],
  },
  {
    slug: 'media',
    table: 'media_items',
    label: 'Featured media',
    singular: 'item',
    description: 'Articles, publications and recordings about his life.',
    group: 'Content',
    orderBy: 'sort_order, id',
    titleField: 'title',
    subtitleFields: ['outlet'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'outlet', label: 'Publication', type: 'text', half: true },
      { name: 'kind', label: 'Type', type: 'text', half: true, placeholder: 'Article, Interview, Book…' },
      { name: 'url', label: 'Link', type: 'url' },
      { name: 'published_on', label: 'Date', type: 'text', half: true, placeholder: 'March 2019' },
      SORT,
      { name: 'excerpt', label: 'Summary', type: 'textarea' },
    ],
  },
  {
    slug: 'tributes',
    table: 'tributes',
    label: 'Tributes',
    singular: 'tribute',
    description: 'Messages left by visitors. These publish immediately — hold or reject anything that should not be there.',
    group: 'Moderation',
    orderBy: "(status = 'pending') DESC, created_at DESC",
    moderated: true,
    titleField: 'name',
    subtitleFields: ['kind', 'relationship', 'location'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, half: true },
      {
        name: 'kind',
        label: 'Kind',
        type: 'select',
        options: ['flower', 'candle', 'note'],
        half: true,
      },
      { name: 'relationship', label: 'Relationship', type: 'text', half: true },
      { name: 'location', label: 'Location', type: 'text', half: true },
      STATUS,
      { name: 'message', label: 'Tribute', type: 'longtext', required: true },
      { name: 'photo_url', label: 'Photograph', type: 'image' },
      FEATURED,
    ],
  },
  {
    slug: 'stories',
    table: 'stories',
    label: 'Stories',
    singular: 'story',
    description: 'Memories from visitors, and stories you write yourself. These publish immediately.',
    group: 'Moderation',
    orderBy: "(status = 'pending') DESC, created_at DESC",
    moderated: true,
    titleField: 'title',
    subtitleFields: ['author_name', 'relationship'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'Web address', type: 'text', half: true, help: 'Letters, numbers and hyphens only.' },
      STATUS,
      { name: 'author_name', label: 'Written by', type: 'text', required: true, half: true },
      { name: 'relationship', label: 'Relationship', type: 'text', half: true },
      { name: 'body', label: 'The story', type: 'longtext', required: true },
      { name: 'image_url', label: 'Photograph', type: 'image' },
      { name: 'author_photo', label: 'Photo of the author', type: 'image' },
      FEATURED,
    ],
  },
  {
    slug: 'guestbook',
    table: 'guestbook',
    label: 'Guestbook',
    singular: 'entry',
    description: 'Signatures and short messages. These publish immediately.',
    group: 'Moderation',
    orderBy: "(status = 'pending') DESC, created_at DESC",
    moderated: true,
    titleField: 'name',
    subtitleFields: ['location'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, half: true },
      { name: 'location', label: 'Location', type: 'text', half: true },
      STATUS,
      { name: 'message', label: 'Message', type: 'textarea', required: true },
    ],
  },
  {
    slug: 'candles',
    table: 'candles',
    label: 'Candles',
    singular: 'candle',
    description: 'Candles from the earlier version of the site. New ones are recorded as tributes.',
    group: 'Moderation',
    orderBy: 'created_at DESC',
    moderated: true,
    titleField: 'name',
    fields: [
      { name: 'name', label: 'Lit by', type: 'text', required: true, half: true },
      STATUS,
      { name: 'message', label: 'Message', type: 'textarea' },
    ],
  },
];

export function findCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

/** Singleton content blocks edited on /admin/settings. */
export const SETTING_GROUPS: {
  key: string;
  label: string;
  description: string;
  fields: FieldDef[];
}[] = [
  {
    key: 'profile',
    label: 'Who the memorial is for',
    description: 'His name, dates and portrait. These appear across the whole website.',
    fields: [
      { name: 'fullName', label: 'Full name', type: 'text', required: true },
      { name: 'shortName', label: 'Name in the header', type: 'text', half: true },
      { name: 'initials', label: 'Monogram initials', type: 'text', half: true },
      { name: 'birthDate', label: 'Date of birth', type: 'date', half: true },
      { name: 'deathDate', label: 'Date of passing', type: 'date', half: true },
      { name: 'birthPlace', label: 'Place of birth', type: 'text' },
      { name: 'tagline', label: 'Tagline', type: 'text', placeholder: 'Brother. Father. Grandfather.' },
      { name: 'heroQuote', label: 'Opening quote', type: 'textarea' },
      { name: 'heroImageUrl', label: 'Homepage portrait', type: 'image' },
      { name: 'portraitUrl', label: 'About page portrait', type: 'image' },
      { name: 'squarePortraitUrl', label: 'Sharing image', type: 'image', help: 'Square. Used when the link is shared on WhatsApp or Facebook.' },
      { name: 'signatureUrl', label: 'Signature image', type: 'image' },
    ],
  },
  {
    key: 'intro',
    label: 'Homepage introduction',
    description: 'The short introduction under the hero, also used at the top of the About page.',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text', required: true },
      { name: 'body', label: 'Introduction', type: 'longtext', required: true },
      { name: 'quote', label: 'Highlighted line', type: 'textarea' },
    ],
  },
  {
    key: 'legacyIntro',
    label: 'Legacy introduction',
    description: 'Opens the Life & Legacy page and the legacy band on the homepage.',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text', required: true },
      { name: 'body', label: 'Text', type: 'longtext', required: true },
    ],
  },
  {
    key: 'candlesIntro',
    label: 'Candle page wording',
    description: 'What visitors read before they light a candle.',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text', required: true },
      { name: 'body', label: 'Text', type: 'textarea' },
    ],
  },
  {
    key: 'audio',
    label: 'Background music',
    description: 'Plays quietly after a visitor first interacts with the page, and remembers if they turn it off.',
    fields: [
      { name: 'enabled', label: 'Play music on the site', type: 'boolean' },
      { name: 'trackUrl', label: 'Audio file', type: 'text', help: 'Upload an MP3 to public/audio, or paste a direct link to one.' },
      { name: 'title', label: 'Track name', type: 'text', half: true },
    ],
  },
  {
    key: 'footer',
    label: 'Footer and contacts',
    description: 'The closing message and the numbers visitors can call.',
    fields: [
      { name: 'message', label: 'Remembrance message', type: 'text' },
      { name: 'yorubaFarewell', label: 'Farewell line', type: 'text', half: true },
      { name: 'contactEmail', label: 'Contact email', type: 'text', half: true },
      { name: 'phones', label: 'Phone numbers', type: 'text', help: 'Separate each number with a comma.' },
    ],
  },
  {
    key: 'seo',
    label: 'Search and sharing',
    description: 'How the memorial appears on Google and when the link is shared.',
    fields: [
      { name: 'title', label: 'Page title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'ogImage', label: 'Sharing image', type: 'image' },
    ],
  },
];
