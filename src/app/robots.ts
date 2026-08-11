import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/app/layout';

/**
 * robots.txt for TBM Semesta Alam.
 *
 * Crawlers are allowed on public pages (/, /books, /books/[slug]) and
 * blocked from private/authenticated/internal paths.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/books'],
        disallow: [
          '/login',
          '/register',
          '/member',
          '/dashboard',
          '/admin',
          '/settings',
          '/profile',
          '/api',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
