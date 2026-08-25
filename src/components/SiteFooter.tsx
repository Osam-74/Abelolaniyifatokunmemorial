import Link from 'next/link';
import ShareRow from './ShareRow';

type Props = {
  name: string;
  initials: string;
  lifespanLabel: string;
  message: string;
  farewell: string;
  email: string;
  phones: string[];
};

const COLUMNS = [
  {
    heading: 'His life',
    links: [
      { href: '/about', label: 'About' },
      { href: '/life', label: 'Life' },
      { href: '/timeline', label: 'Timeline' },
      { href: '/quotes', label: 'Words of Wisdom' },
    ],
  },
  {
    heading: 'Remember',
    links: [
      { href: '/gallery', label: 'Gallery' },
      { href: '/videos', label: 'Videos' },
      { href: '/stories', label: 'Stories' },
      { href: '/media', label: 'Featured Media' },
    ],
  },
  {
    heading: 'Take part',
    links: [
      { href: '/tributes', label: 'Tributes' },
      { href: '/candles', label: 'Light a Candle' },
      { href: '/guestbook', label: 'Guestbook' },
      { href: '/events', label: 'Funeral & Events' },
    ],
  },
];

export default function SiteFooter({
  name,
  initials,
  lifespanLabel,
  message,
  farewell,
  email,
  phones,
}: Props) {
  return (
    <footer className="bg-ink text-mist">
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-mist/35 font-util text-xs tracking-[0.14em]">
                {initials}
              </span>
              <div>
                <p className="font-display text-2xl leading-tight">{name}</p>
                {lifespanLabel && (
                  <p className="eyebrow mt-1 text-mist/55">{lifespanLabel}</p>
                )}
              </div>
            </div>
            <p className="mt-7 max-w-sm font-display text-xl leading-snug text-mist/85">
              {message}
            </p>
            {farewell && (
              <p className="mt-3 font-display text-lg italic text-soft/80">{farewell}</p>
            )}
            <ShareRow className="mt-8" />
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <h3 className="eyebrow text-mist/45">{column.heading}</h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-[0.95rem] text-mist/75 transition-colors hover:text-mist"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {(email || phones.length > 0) && (
          <div className="mt-16 border-t border-mist/12 pt-8">
            <h3 className="eyebrow text-mist/45">Family enquiries</h3>
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 font-util text-sm text-mist/75">
              {phones.map((phone) => (
                <a key={phone} href={`tel:${phone}`} className="hover:text-mist">
                  {phone}
                </a>
              ))}
              {email && (
                <a href={`mailto:${email}`} className="hover:text-mist">
                  {email}
                </a>
              )}
            </div>
          </div>
        )}

        <div className="mt-12 flex flex-col gap-3 border-t border-mist/12 pt-8 font-util text-[0.72rem] uppercase tracking-[0.12em] text-mist/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} The family of {name}
          </p>
          <p>Sùn re o</p>
        </div>
      </div>
    </footer>
  );
}
