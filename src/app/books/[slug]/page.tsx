import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/index';
import { authors, bookInventories, books, categories, publishers, shelves } from '@/db/schema';
import { SITE_URL } from '@/app/layout';
import { getCurrentUser } from '@/server/auth-utils';
import PublicNavbar from '@/components/public-navbar';
import BorrowPanel from '@/components/borrow-panel';
import BookCover from '@/components/book-cover';

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
  const [currentUser, book] = await Promise.all([getCurrentUser(), getBook(slug)]);
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
      <PublicNavbar
        active="/books"
        initialUser={currentUser ? { name: currentUser.name } : null}
        initialRole={currentUser?.role ?? null}
      />

      <main className="container" style={{ flex: 1 }}>
        <nav style={{ fontSize: 13, color: 'var(--muted)', margin: '20px 0' }}>
          <Link href="/books" style={{ color: 'var(--muted)' }}>Katalog</Link>
          {' / '}
          <span>{book.title}</span>
        </nav>

        <div className="detail-grid">
          {/* Cover */}
          <div>
            <div style={{ aspectRatio: '2/3', background: 'var(--surface-2)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              <BookCover src={book.coverImage} alt={`Sampul buku ${book.title}`} title={book.title} />
            </div>
          </div>

          {/* Info */}
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400, margin: '0 0 8px', lineHeight: 1.15 }}>{book.title}</h1>
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

            {/* Self-service borrow panel — members can borrow directly here. */}
            <BorrowPanel bookId={book.id} available={book.available} />

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
                <p style={{ margin: 0, color: 'var(--text-subtle)', whiteSpace: 'pre-wrap' }}>{book.synopsis ?? book.description}</p>
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
                        <td>                <span className={`badge ${inv.status === 'available' ? 'success' : inv.status === 'borrowed' ? 'info' : inv.status === 'maintenance' ? 'warning' : 'error'}`}>
                  {statusLabel[inv.status] ?? inv.status}
                </span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="container" style={{ fontSize: 14 }}>
          © {new Date().getFullYear()} TBM Semesta Alam
        </div>
      </footer>
    </div>
  );
}
