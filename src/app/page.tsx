import Link from 'next/link';
import Image from 'next/image';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/index';
import { authors, books, categories } from '@/db/schema';
import { getSettings } from '@/server/settings';

export const dynamic = 'force-dynamic';

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
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .orderBy(categories.name)
      .limit(12),
    getSettings(),
  ]);

  const libraryName = String(settings.libraryName || 'TBM Semesta Alam');
  const libraryAddress = String(settings.libraryAddress || '');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 14, paddingBottom: 14 }}>
          <Link href="/" aria-label="TBM Semesta Alam — Beranda" style={{ display: 'inline-flex', lineHeight: 0 }}>
            <Image src="/logo-tbm-semesta-alam-nav.png" alt="TBM Semesta Alam" width={1233} height={578} className="brand-logo" priority />
          </Link>
          <nav style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 14, flexWrap: 'wrap' }}>
            <Link href="/books" style={{ color: 'var(--text)' }}>Katalog</Link>
            <Link href="/login" style={{ color: 'var(--text)' }}>Masuk</Link>
            <Link href="/register" className="btn" style={{ padding: '8px 14px' }}>Daftar</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', color: '#fff', padding: '48px 0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 720 }}>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.2 }}>
            Selamat Datang di {libraryName}
          </h1>
          <p style={{ fontSize: 17, opacity: 0.9, margin: '0 0 28px' }}>
            Telusuri koleksi buku, penulis, dan kategori perpustakaan kami. Gratis untuk semua.
          </p>
          <form action="/books" method="get" style={{ display: 'flex', gap: 8, maxWidth: 520, margin: '0 auto', flexWrap: 'wrap' }}>
            <input
              type="text"
              name="q"
              placeholder="Cari judul buku, penulis, atau ISBN..."
              aria-label="Cari buku"
              style={{ flex: '1 1 180px', padding: '12px 16px', borderRadius: 10, border: 'none', fontSize: 15, minWidth: 0 }}
            />
            <button type="submit" className="btn" style={{ background: '#fff', color: '#1e3a8a', padding: '12px 20px', flex: '0 0 auto' }}>
              Cari
            </button>
          </form>
        </div>
      </section>

      {/* Latest books */}
      <section className="container" style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '32px 0 16px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Buku Terbaru</h2>
          <Link href="/books" className="btn secondary">Lihat Semua</Link>
        </div>

        {latestBooks.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
            Koleksi buku belum tersedia. Silakan kembali lagi nanti.
          </div>
        ) : (
          <div className="grid grid-4">
            {latestBooks.map((b) => (
              <Link key={b.id} href={`/books/${b.slug}`} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: 0, overflow: 'hidden' }}>
                <div style={{ aspectRatio: '2/3', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  {b.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.coverImage} alt={`Sampul buku ${b.title}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  ) : (
                    '📖'
                  )}
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, lineHeight: 1.4 }}>{b.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {b.authorName ?? '—'}{b.categoryName ? ` · ${b.categoryName}` : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Categories */}
        <div style={{ margin: '40px 0 16px' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Kategori</h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {categoryRows.map((c) => (
            <Link key={c.id} href={`/books?category=${encodeURIComponent(c.name)}`} className="btn secondary" style={{ textDecoration: 'none' }}>
              {c.name}
            </Link>
          ))}
          {categoryRows.length === 0 && (
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>Belum ada kategori.</div>
          )}
        </div>

        {/* About snippet */}
        <div className="card" style={{ margin: '40px 0', padding: 28, textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Tentang {libraryName}</h2>
          <p style={{ color: 'var(--muted)', margin: '0 0 16px', maxWidth: 640, marginInline: 'auto' }}>
            Taman Baca Masyarakat yang menyediakan akses baca bagi masyarakat. {libraryAddress ? `Berlokasi di ${libraryAddress}.` : ''}
          </p>
          <Link href="/register" className="btn">Daftar Menjadi Anggota</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '20px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 14 }}>
          <div>© {new Date().getFullYear()} {libraryName}</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/books">Katalog</Link>
            <Link href="/login">Masuk</Link>
            <Link href="/register">Daftar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
