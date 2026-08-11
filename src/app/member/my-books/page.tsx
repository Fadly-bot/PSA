'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BookCover from '@/components/book-cover';
import StatusBadge from '@/components/status-badge';

type BorrowItem = {
  bookId: string;
  bookSlug: string;
  bookTitle: string;
  coverImage: string | null;
  inventoryCode: string;
};

type Borrowing = {
  id: string;
  borrowCode: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  items?: BorrowItem[];
};

function effectiveStatus(b: Borrowing): string {
  if (b.status === 'borrowed' && b.dueDate < new Date().toISOString().slice(0, 10)) {
    return 'overdue';
  }
  return b.status;
}

function GroupSection({
  title,
  empty,
  list,
}: {
  title: string;
  empty: string;
  list: Borrowing[];
}) {
  if (list.length === 0) return null;
  return (
    <section style={{ marginBottom: 28 }}>
      <div className="section-header" style={{ marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 20 }}>{title}</h2>
          <p style={{ margin: 0 }}>{list.length} item</p>
        </div>
      </div>
      {list.map((b) => {
        const item = b.items?.[0];
        return (
          <div key={b.id} className="card" style={{ display: 'flex', gap: 14, marginBottom: 10, alignItems: 'flex-start', padding: 12 }}>
            <Link href={`/books/${item?.bookSlug ?? ''}`} style={{ width: 64, flexShrink: 0, display: 'block' }}>
              <div style={{ aspectRatio: '2/3', borderRadius: 8, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <BookCover src={item?.coverImage} alt={item?.bookTitle ?? 'Buku'} title={item?.bookTitle} />
              </div>
            </Link>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/books/${item?.bookSlug ?? ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, lineHeight: 1.35 }}>{item?.bookTitle ?? b.borrowCode}</h3>
              </Link>
              <div style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 8px' }}>
                {b.borrowCode}
                {item?.inventoryCode ? ` · ${item.inventoryCode}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                <span style={{ color: 'var(--text-subtle)' }}>
                  Pinjam <strong>{b.borrowDate}</strong>
                </span>
                <span style={{ color: 'var(--text-subtle)' }}>
                  Jatuh tempo <strong>{b.dueDate}</strong>
                </span>
                {effectiveStatus(b) === 'overdue' && (
                  <span className="badge error">Terlambat {b.dueDate}</span>
                )}
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <StatusBadge status={effectiveStatus(b)} />
            </div>
          </div>
        );
      })}
      {list.length === 0 && (
        <div className="empty-state" style={{ padding: 24 }}>
          <p className="title">{empty}</p>
        </div>
      )}
    </section>
  );
}

export default function MyBooksPage() {
  const [data, setData] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/borrowings?limit=100')
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) throw new Error(d.error);
        setData(d.items ?? []);
      })
      .catch((e: any) => setError(e?.message ?? 'Gagal memuat data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 30, width: 220, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: 280, marginBottom: 20 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
            <div className="skeleton" style={{ width: 64, height: 96, borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 12, width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ padding: 48 }}>
        <div className="icon">⚠️</div>
        <p className="title">Gagal memuat data</p>
        <p>{error}</p>
        <button className="btn secondary sm" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
          Coba lagi
        </button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 56 }}>
        <div className="icon">📚</div>
        <p className="title">Belum ada buku yang sedang Anda pinjam</p>
        <p>Jelajahi katalog dan pinjam buku favorit Anda.</p>
        <Link href="/member/books" className="btn" style={{ marginTop: 12 }}>
          Lihat Katalog
        </Link>
      </div>
    );
  }

  const overdue = data.filter((b) => effectiveStatus(b) === 'overdue');
  const active = data.filter((b) => effectiveStatus(b) === 'borrowed');
  const returned = data.filter((b) => effectiveStatus(b) === 'returned');

  return (
    <div>
      <div className="section-header" style={{ marginTop: 8 }}>
        <div>
          <h2>Buku Saya</h2>
          <p>Buku yang sedang atau pernah Anda pinjam.</p>
        </div>
        <Link href="/member/books" className="btn">
          Cari Buku
        </Link>
      </div>

      <GroupSection
        title="⏰ Terlambat"
        empty="Tidak ada buku terlambat."
        list={overdue}
      />
      <GroupSection
        title="📖 Sedang Dipinjam"
        empty="Tidak ada buku aktif."
        list={active}
      />
      <GroupSection
        title="✅ Sudah Dikembalikan"
        empty="Belum ada pengembalian."
        list={returned}
      />

      {overdue.length === 0 && active.length === 0 && returned.length > 0 && (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Semua buku sudah dikembalikan. Lihat riwayat lengkap di{' '}
          <Link href="/member/history" style={{ fontWeight: 700 }}>
            Riwayat
          </Link>
          .
        </p>
      )}
    </div>
  );
}
