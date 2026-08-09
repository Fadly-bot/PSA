import type { MetadataRoute } from 'next';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/index';
import { books } from '@/db/schema';
import { SITE_URL } from '@/app/layout';

export const dynamic = 'force-dynamic';

/**
 * Dynamic sitemap for TBM Semesta Alam.
 *
 * Only PUBLIC, indexable pages are included:
 *   - Homepage (/)
 *   - Public catalog (/books)
 *   - Public book details (/books/[slug])
 *
 * Private/authenticated pages (/login, /register, /dashboard, /settings,
 * /profile, /api/*) are intentionally excluded.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/books`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    const bookRows = await db
      .select({ slug: books.slug, updatedAt: books.updatedAt })
      .from(books)
      .where(and(isNull(books.deletedAt), eq(books.status, 'active')))
      .orderBy(books.slug);

    for (const book of bookRows) {
      entries.push({
        url: `${SITE_URL}/books/${book.slug}`,
        lastModified: book.updatedAt ?? new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  } catch (error) {
    // Database unavailable — sitemap must still be valid with static entries.
    console.error('[sitemap] failed to load books', error);
  }

  return entries;
}
