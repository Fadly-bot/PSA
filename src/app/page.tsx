import Link from 'next/link';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/index';
import { authors, books, categories } from '@/db/schema';
import { getSettings } from '@/server/settings';
import PublicNavbar from '@/components/public-navbar';
import BookCover from '@/components/book-cover';

export const dynamic = 'force-dynamic';

/** Warm editorial palette for category tiles (Figma reference). */
const TILE_COLORS = [
  '#2d6a4f',
  '#e76f51',
  '#1e6fa8',
  '#c17a1d',
  '#7a4fa0',
  '#0e7c7b',
  '#b4521e',
  '#5b7a2f',
  '#8a5a44',
  '#35557d',
];

export default async function Home() {
  const [latestBooks, categoryRows, settings] = await Promise.all([
    db
      .select({
        id: books.id,
        title: books.title,
        slug: books.slug,
        coverImage: books.coverImage,
        publicationYear: books.publicationYear,
        authorName: authors.name,
        categoryName: categories.name,
      })
      .from(books)
      .leftJoin(authors, eq(books.authorId, authors.id))
      .leftJoin(categories, eq(books.categoryId, categories.id))
      .where(and(isNull(books.deletedAt), eq(books.status, 'active')))
      .orderBy(desc(books.createdAt))
      .limit(8),
    db
      .select({
        id: categories.id,
        name: categories.name,
        count: sql<number>`count(${books.id})`,
      })
      .from(categories)
      .leftJoin(books, eq(books.categoryId, categories.id))
      .where(and(isNull(books.deletedAt), eq(books.status, 'active')))
      .groupBy(categories.id)
      .orderBy(categories.name)
      .limit(12),
    getSettings(),
  ]);

  const libraryName = String(settings.libraryName || 'TBM Semesta Alam');
  const libraryAddress = String(settings.libraryAddress || '');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar active="/" />

      {/* Hero */}
      <section className="hero">
        <div className="container" style={{ textAlign: 'center', maxWidth: 760 }}>
          <h1>Selamat Datang di {libraryName}</h1>
          <p>
            Telusuri koleksi buku, penulis, dan kategori perpustakaan kami. Gratis untuk semua.
          </p>
          <form action="/books" method="get" className="search-box">
            <input
              type="search"
              name="q"
              placeholder="Cari judul buku, penulis, atau ISBN..."
              aria-label="Cari buku"
            />
            <button type="submit">Cari</button>
          </form>
        </div>
      </section>

      {/* Latest books */}
      <main className="container" style={{ flex: 1 }}>
        <section>
          <div className="section-header">
            <div>
              <h2>Buku Terbaru</h2>
              <p>Koleksi terbaru yang baru saja masuk perpustakaan.</p>
            </div>
            <Link href="/books" className="btn secondary sm">
              Lihat Semua →
            </Link>
          </div>

          {latestBooks.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📚</div>
              <p className="title">Koleksi buku belum tersedia</p>
              <p>Silakan kembali lagi nanti.</p>
            </div>
          ) : (
            <div className="grid grid-4">
              {latestBooks.map((b) => (
                <Link key={b.id} href={`/books/${b.slug}`} className="book-card">
                  <div className="cover">
                    <BookCover
                      src={b.coverImage}
                      alt={`Sampul buku ${b.title}`}
                      title={b.title}
                    />
                  </div>
                  <div className="body">
                    {b.categoryName && <p className="category">{b.categoryName}</p>}
                    <h3 className="title">{b.title}</h3>
                    <p className="meta">
                      {b.authorName ?? '—'}
                      {b.publicationYear ? ` · ${b.publicationYear}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Categories — Figma-style browse tiles */}
        <section style={{ margin: '52px 0' }}>
          <div className="section-header">
            <div>
              <h2>Jelajahi Kategori</h2>
              <p>Temukan buku berdasarkan topik favorit Anda.</p>
            </div>
            <Link href="/books" className="btn secondary sm">
              Lihat Semua →
            </Link>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {categoryRows.map((c, i) => {
              const color = TILE_COLORS[i % TILE_COLORS.length];
              return (
                <Link
                  key={c.id}
                  href={`/books?category=${encodeURIComponent(c.name)}`}
                  className="category-tile"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="tile-dot" style={{ background: color }} aria-hidden="true" />
                  {c.name}
                  <span className="tile-count">{Number(c.count ?? 0)} buku</span>
                </Link>
              );
            })}
            {categoryRows.length === 0 && (
              <div className="empty-state" style={{ width: '100%', padding: 24 }}>
                <p className="title">Belum ada kategori.</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section
          className="card"
          style={{
            margin: '52px 0',
            padding: 44,
            textAlign: 'center',
            background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
            border: 'none',
            color: '#fff',
            borderRadius: 20,
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '0 0 8px' }}>
            Bergabung dengan {libraryName}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0 auto 20px', maxWidth: 560 }}>
            Daftar menjadi anggota dan nikmati akses membaca koleksi kami.
            {libraryAddress ? ` Berlokasi di ${libraryAddress}.` : ''}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn" style={{ background: '#fff', color: 'var(--primary-dark)' }}>
              Daftar Menjadi Anggota
            </Link>
            <Link href="/books" className="btn outline" style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}>
              Lihat Katalog
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            fontSize: 14,
          }}
        >
          <div>
            <div style={{ fontWeight: 800 }}>{libraryName}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Taman Bacaan Masyarakat</div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/books">Katalog</Link>
            <Link href="/login">Masuk</Link>
            <Link href="/register">Daftar</Link>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>© {new Date().getFullYear()} {libraryName}</div>
        </div>
      </footer>
    </div>
  );
}
