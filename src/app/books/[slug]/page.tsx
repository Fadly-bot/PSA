import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/index';
import { authors, bookInventories, books, categories, publishers, shelves } from '@/db/schema';
import { SITE_URL } from '@/app/layout';

export const dynamic = 'force-dynamic';

async function getBook(slug: string) {
  const [row] = await db
    .select({
      id: books.id,
      title: books.title,
      isbn: books.isbn,
      slug: books.slug,
      description: books.description,
      synopsis: books.synopsis,
      coverImage: books.coverImage,
      publicationYear: books.publicationYear,
      language: books.language,
      pages: books.pages,
      status: books.status,
      author: { name: authors.name },
      publisher: { name: publishers.name },
      category: { name: categories.name },
    })
    .from(books)
    .leftJoin(authors, eq(books.authorId, authors.id))
    .leftJoin(publishers, eq(books.publisherId, publishers.id))
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .where(and(eq(books.slug, slug), isNull(books.deletedAt)))
    .limit(1);

  if (!row || row.status !== 'active') return null;

  const [invRows] = await Promise.all([
    db
      .select({
        inventoryCode: bookInventories.inventoryCode,
        status: bookInventories.status,
        condition: bookInventories.condition,
        shelfCode: shelves.code,
        shelfName: shelves.name,
      })
      .from(bookInventories)
      .leftJoin(shelves, eq(bookInventories.shelfId, shelves.id))
      .where(and(eq(bookInventories.bookId, row.id), isNull(bookInventories.deletedAt)))
      .orderBy(bookInventories.inventoryCode),
  ]);

  const total = invRows.length;
  const available = invRows.filter((i) => i.status === 'available').length;

  return { ...row, inventories: invRows, total, available };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) {
    return { title: 'Buku Tidak Ditemukan' };
  }

  const description =
    book.synopsis?.slice(0, 155) ||
    book.description?.slice(0, 155) ||
    `Buku "${book.title}" di katalog TBM Semesta Alam.`;

  return {
    title: book.title,
    description,
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: {
      title: book.title,
      description,
      url: `${SITE_URL}/books/${book.slug}`,
      type: 'book',
      images: book.coverImage ? [{ url: book.coverImage, alt: `Sampul buku ${book.title}` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: book.title,
      description,
      images: book.coverImage ? [book.coverImage] : undefined,
    },
  };
}

export default async function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) notFound();

  const statusLabel: Record<string, string> = {
    available: 'Tersedia',
    borrowed: 'Dipinjam',
    maintenance: 'Perawatan',
    lost: 'Hilang',
  };
  const conditionLabel: Record<string, string> = { good: 'Baik', damaged: 'Rusak', lost: 'Hilang' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 14, paddingBottom: 14 }}>
          <Link href="/" aria-label="TBM Semesta Alam — Beranda" style={{ display: 'inline-flex', lineHeight: 0 }}>
            <Image src="/logo-tbm-semesta-alam-nav.png" alt="TBM Semesta Alam" width={1233} height={578} className="brand-logo" />
          </Link>
          <nav style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 14, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: 'var(--text)' }}>Beranda</Link>
            <Link href="/books" style={{ color: 'var(--text)', fontWeight: 600 }}>Katalog</Link>
            <Link href="/login" style={{ color: 'var(--text)' }}>Masuk</Link>
            <Link href="/register" className="btn" style={{ padding: '8px 14px' }}>Daftar</Link>
          </nav>
        </div>
      </header>

      <main className="container" style={{ flex: 1 }}>
        <nav style={{ fontSize: 13, color: 'var(--muted)', margin: '20px 0' }}>
          <Link href="/books" style={{ color: 'var(--muted)' }}>Katalog</Link>
          {' / '}
          <span>{book.title}</span>
        </nav>

        <div className="detail-grid">
          {/* Cover */}
          <div>
            <div style={{ aspectRatio: '2/3', background: '#eef2ff', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
              {book.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={book.coverImage} alt={`Sampul buku ${book.title}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 40 }}>📖</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>{book.title}</h1>
            <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
              {book.author?.name && <span>oleh <strong>{book.author.name}</strong></span>}
              {book.category?.name && <span> · {book.category.name}</span>}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <span className="badge" style={{ padding: '6px 14px', fontSize: 13 }}>
                {book.available > 0
                  ? `Tersedia (${book.available}/${book.total})`
                  : 'Stok kosong'}
              </span>
              {book.language && <span className="badge" style={{ padding: '6px 14px', fontSize: 13 }}>{book.language}</span>}
              {book.publicationYear && <span className="badge" style={{ padding: '6px 14px', fontSize: 13 }}>{book.publicationYear}</span>}
              {book.pages && <span className="badge" style={{ padding: '6px 14px', fontSize: 13 }}>{book.pages} halaman</span>}
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <table style={{ width: '100%', fontSize: 14 }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 12px 8px 0', color: 'var(--muted)', width: 140 }}>ISBN</td>
                    <td style={{ padding: '8px 0', fontWeight: 600 }}>{book.isbn}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px 8px 0', color: 'var(--muted)' }}>Penulis</td>
                    <td style={{ padding: '8px 0' }}>{book.author?.name ?? '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px 8px 0', color: 'var(--muted)' }}>Penerbit</td>
                    <td style={{ padding: '8px 0' }}>{book.publisher?.name ?? '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px 8px 0', color: 'var(--muted)' }}>Kategori</td>
                    <td style={{ padding: '8px 0' }}>{book.category?.name ?? '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {(book.synopsis || book.description) && (
              <div className="card" style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>Sinopsis</h2>
                <p style={{ margin: 0, color: '#334155', whiteSpace: 'pre-wrap' }}>{book.synopsis ?? book.description}</p>
              </div>
            )}

            <div className="card" style={{ overflowX: 'auto' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>Lokasi Eksemplar</h2>
              {book.inventories.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>Belum ada eksemplar tercatat.</p>
              ) : (
                <table className="table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>Kode Inventaris</th>
                      <th>Rak</th>
                      <th>Kondisi</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {book.inventories.map((inv) => (
                      <tr key={inv.inventoryCode}>
                        <td style={{ fontWeight: 600 }}>{inv.inventoryCode}</td>
                        <td>{inv.shelfName ? `${inv.shelfCode ?? ''} ${inv.shelfName}` : '—'}</td>
                        <td>{conditionLabel[inv.condition] ?? inv.condition}</td>
                        <td><span className="badge">{statusLabel[inv.status] ?? inv.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '20px 0' }}>
        <div className="container" style={{ fontSize: 14 }}>
          © {new Date().getFullYear()} TBM Semesta Alam
        </div>
      </footer>
    </div>
  );
}
