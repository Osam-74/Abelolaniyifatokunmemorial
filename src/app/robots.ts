import type { MetadataRoute } from 'next';

import { siteOrigin } from '@/lib/siteUrl';

export default function robots(): MetadataRoute.Robots {
  const base = siteOrigin();
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
