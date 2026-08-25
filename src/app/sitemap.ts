import type { MetadataRoute } from 'next';
import { safeQuery } from '@/lib/content';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  if (!base) return [];

  const pages = [
    '', '/about', '/life-and-legacy', '/timeline', '/gallery', '/stories',
    '/tributes', '/videos', '/events', '/guestbook', '/candles', '/quotes', '/media',
  ];

  const stories = await safeQuery<{ slug: string; created_at: string }>(
    `SELECT slug, created_at FROM stories WHERE status = 'approved'`
  );

  return [
    ...pages.map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
    })),
    ...stories.map((story) => ({
      url: `${base}/stories/${story.slug}`,
      lastModified: new Date(story.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
}
