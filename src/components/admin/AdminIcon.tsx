/**
 * A small, shared line-icon set for the admin nav — same idea as EduCBT's
 * PortalIcon (one dictionary keyed by name, every item picks one), so the
 * sidebar reads as a proper icon menu instead of plain text links.
 */
const ICONS: Record<string, string> = {
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  book: '<path d="M4 4.6A2.6 2.6 0 0 1 6.6 2H20v17H6.6A2.6 2.6 0 0 0 4 21.6v-17Z"/><path d="M4 21.6A2.6 2.6 0 0 1 6.6 19H20"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5-4 4-3-3-5 5"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5-6-3.5Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  quote: '<path d="M7 8.5c-2.2 0-4 1.8-4 4S4.8 16.5 7 16.5c0-3.5 1.5-6 4-7.5"/><path d="M17 8.5c-2.2 0-4 1.8-4 4s1.8 4 4 4c0-3.5 1.5-6 4-7.5"/>',
  heart: '<path d="M12 20s-7.4-4.4-9.7-8.9C.7 8 2.5 4.8 6 4.8c2 0 3.4 1.2 6 3.6 2.6-2.4 4-3.6 6-3.6 3.5 0 5.3 3.2 3.7 6.3C19.4 15.6 12 20 12 20Z"/>',
  message: '<path d="M3 10.2v3.6h3l4.3 4.3V5.9L6 10.2H3Z"/><path d="M14.3 8.3a4.3 4.3 0 0 1 0 7.4"/>',
  flame: '<path d="M12 22c-4 0-6.5-2.6-6.5-6 0-2.4 1.4-3.8 2.2-5.3.6-1.2.8-2.4.6-3.9 2.6 1 4.3 3.3 4.5 5.7.9-1.1 1.3-2.4 1.2-4 2.7 1.6 4.5 4.4 4.5 7.5 0 3.4-2.5 6-6.5 6Z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
};

export default function AdminIcon({ name }: { name: string }) {
  const path = ICONS[name] ?? ICONS.grid;
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: path }} />
  );
}
