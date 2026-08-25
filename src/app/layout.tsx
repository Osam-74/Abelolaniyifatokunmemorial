import type { Metadata, Viewport } from 'next';
import { Fraunces, Newsreader, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { getSetting } from '@/lib/content';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
});

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
});

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plex',
  weight: ['400', '500', '600'],
});

export const viewport: Viewport = {
  themeColor: '#03045E',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSetting<{ title: string; description: string; ogImage: string }>('seo');
  const base = process.env.NEXT_PUBLIC_SITE_URL;

  return {
    metadataBase: base ? new URL(base) : undefined,
    title: { default: seo.title, template: `%s — ${seo.title}` },
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: 'profile',
      images: seo.ogImage ? [{ url: seo.ogImage, width: 800, height: 800 }] : undefined,
    },
    twitter: { card: 'summary_large_image', title: seo.title, description: seo.description },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${newsreader.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  );
}
