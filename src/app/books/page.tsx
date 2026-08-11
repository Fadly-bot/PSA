import Link from 'next/link';
import type { Metadata } from 'next';
import { and, asc, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/db/index';
import { authors, bookInventories, books, categories, publishers } from '@/db/schema';
import { SITE_URL } from '@/app/layout';
import PublicNavbar from '@/components/public-navbar';
import BookCover from '@/components/book-cover';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Katalog Buku',
  description:
    'Telusuri katalog buku TBM Semesta Alam — cari berdasarkan judul, penulis, ISBN, atau kategori.',
  alternates: { canonical: '/books' },
  openGraph: {
    title: 'Katalog Buku | TBM Semesta Alam',
    description: 'Telusuri katalog buku TBM Semesta Alam secara gratis.',
    url: `${SITE_URL}/books`,
    type: 'website',
  },
};

const PAGE_SIZE = 12;

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? '').trim().slice(0, 100);
  const category = (params.category ?? '').trim();
  const sort = params.sort ?? 'newest';
  const page = Math.max(1, Number(params.page ?? '1'));
  const offset = (page - 1) * PAGE_SIZE;

  const conditions: any[] = [isNull(books.deletedAt), eq(books.status, 'active')];

  if (q) {
    conditions.push(
      or(
        ilike(books.title, `%${q}%`),
        ilike(books.isbn, `%${q}%`),
        ilike(authors.name, `%${q}%`),
      )!,
    );
  }
  if (category) {
    conditions.push(sql`${categories.name} ILIKE ${category}`);
  }

  const where = and(...conditions);

  const orderBy =
    sort === 'title-asc'
      ? asc(books.title)
      : sort === 'title-desc'
        ? desc(books.title)
        : sort === 'oldest'
          ? asc(books.createdAt)
          : desc(books.createdAt);

  const [rows, [{ count }], categoryRows] = await Promise.all([
    db
      .select({
        id: books.id,
        title: books.title,
        slug: books.slug,
        isbn: books.isbn,
        coverImage: books.coverImage,
        publicationYear: books.publicationYear,
        authorName: authors.name,
        categoryName: categories.name,
        publisherName: publishers.name,
      })
      .from(books)
      .leftJoin(authors, eq(books.authorId, authors.id))
      .leftJoin(categories, eq(books.categoryId, categories.id))
      .leftJoin(publishers, eq(books.publisherId, publishers.id))
      .where(where)
      .orderBy(orderBy)
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .leftJoin(authors, eq(books.authorId, authors.id))
      .leftJoin(categories, eq(books.categoryId, categories.id))
      .leftJoin(publishers, eq(books.publisherId, publishers.id))
      .where(where),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name),
  ]);

  const total = Number(count);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Availability counts for the page's books.
  const ids = rows.map((r) => r.id);
  const availability: Record<string, number> = {};
  if (ids.length > 0) {
    const invRows = await db
      .select({ bookId: bookInventories.bookId, status: bookInventories.status })
      .from(bookInventories)
      .where(and(isNull(bookInventories.deletedAt), sql`${bookInventories.bookId} IN (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})`));
    for (const inv of invRows) {
      if (inv.status === 'available') availability[inv.bookId] = (availability[inv.bookId] ?? 0) + 1;
    }
  }

  const buildHref = (patch: Record<string, string>) => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (category) sp.set('category', category);
    if (sort !== 'newest') sp.set('sort', sort);
    for (const [k, v] of Object.entries(patch)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    const qs = sp.toString();
    return qs ? `/books?${qs}` : '/books';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar active="/books" />

      <main className="container" style={{ flex: 1 }}>
        <div className="section-header" style={{ marginTop: 12 }}>
          <div>
            <h2>Katalog Buku</h2>
            <p>{total} judul buku tersedia</p>
          </div>
        </div>

        {/* Search + filter bar */}
        <form method="get" action="/books" className="card" style={{ padding: 14, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Cari judul, penulis, atau ISBN..."
              aria-label="Cari judul, penulis, atau ISBN"
              style={{ flex: '1 1 200px', minWidth: 0 }}
            />
            <select name="category" defaultValue={category} aria-label="Filter kategori" style={{ width: 'auto', flex: '0 1 180px' }}>
              <option value="">Semua Kategori</option>
              {categoryRows.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <select name="sort" defaultValue={sort} aria-label="Urutkan" style={{ width: 'auto' }}>
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="title-asc">A-Z</option>
              <option value="title-desc">Z-A</option>
            </select>
            <button type="submit" className="btn">Cari</button>
            {(q || category || sort !== 'newest') && (
              <Link href="/books" className="btn secondary">Reset</Link>
            )}
          </div>
        </form>

        {rows.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <p className="title">Tidak ada buku yang cocok</p>
            <p>Coba ubah kata kunci atau filter pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid grid-4">
            {rows.map((b) => (
              <Link key={b.id} href={`/books/${b.slug}`} className="book-card">
                <div className="cover">
                  <BookCover src={b.coverImage} alt={`Sampul buku ${b.title}`} title={b.title} />
                </div>
                <div className="body">
                  {b.categoryName && <p className="category">{b.categoryName}</p>}
                  <h3 className="title">{b.title}</h3>
                  <p className="meta">
                    {b.authorName ?? '—'}
                    {b.publicationYear ? ` · ${b.publicationYear}` : ''}
                  </p>
                  <div className="availability">
                    {(availability[b.id] ?? 0) > 0 ? (
                      <span className="yes">✓ Tersedia ({availability[b.id]})</span>
                    ) : (
                      <span className="no">Stok kosong</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', margin: '28px 0', flexWrap: 'wrap' }}>
            {page > 1 && <Link className="btn secondary" href={buildHref({ page: String(page - 1) })}>← Sebelum</Link>}
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 12px', color: 'var(--muted)', fontSize: 14 }}>
              Halaman {page} dari {totalPages}
            </span>
            {page < totalPages && <Link className="btn secondary" href={buildHref({ page: String(page + 1) })}>Berikut →</Link>}
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="container" style={{ fontSize: 14 }}>
          © {new Date().getFullYear()} TBM Semesta Alam
        </div>
      </footer>
    </div>
  );
}
