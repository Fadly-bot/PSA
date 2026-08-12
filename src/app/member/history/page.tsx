'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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

type Fine = {
  id: string;
  amount: string;
  paidAt: string | null;
  status: string;
  borrowing: {
    id: string;
    borrowCode: string;
    dueDate: string;
    returnDate: string | null;
    status: string;
  } | null;
};

export default function HistoryPage() {
  const [items, setItems] = useState<Borrowing[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/borrowings?limit=100').then((r) => r.json()),
      fetch('/api/fines?limit=100').then((r) => r.json()),
    ])
      .then(([b, f]) => {
        if (b?.error) throw new Error(b.error);
        if (f?.error) throw new Error(f.error);
        setItems(b.items ?? []);
        setFines(f.items ?? []);
      })
      .catch((e: any) => setError(e?.message ?? 'Gagal memuat riwayat.'))
      .finally(() => setLoading(false));
  }, []);

  const fineByBorrowCode = useMemo(() => {
    const map = new Map<string, Fine>();
    for (const f of fines) if (f.borrowing?.borrowCode) map.set(f.borrowing.borrowCode, f);
    return map;
  }, [fines]);

  const rows = useMemo(
    () =>
      [...items].sort((a, b) => (a.borrowDate < b.borrowDate ? 1 : -1)),
    [items],
  );

  const fmt = (v: string | number | null | undefined) =>
    v == null || v === '' ? '—' : `Rp ${Number(v).toLocaleString('id-ID')}`;

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 30, width: 200, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: 260, marginBottom: 20 }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10, marginBottom: 8 }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ padding: 48 }}>
        <div className="icon">⚠️</div>
        <p className="title">Gagal memuat riwayat</p>
        <p>{error}</p>
        <button className="btn secondary sm" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
          Coba lagi
        </button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 56 }}>
        <div className="icon">🗂️</div>
        <p className="title">Belum ada riwayat peminjaman</p>
        <p>Riwayat peminjaman Anda akan muncul di sini.</p>
        <Link href="/member/books" className="btn" style={{ marginTop: 12 }}>
          Lihat Katalog
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header" style={{ marginTop: 8 }}>
        <div>
          <h2>Riwayat Peminjaman</h2>
          <p>{rows.length} peminjaman tercatat.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table mobile-table-card" style={{ minWidth: 0 }}>
          <thead>
            <tr>
              <th>Buku</th>
              <th>No Pinjam</th>
              <th>Tgl Pinjam</th>
              <th>Jatuh Tempo</th>
              <th>Tgl Kembali</th>
              <th>Status</th>
              <th>Denda</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const item = b.items?.[0];
              const fine = fineByBorrowCode.get(b.borrowCode);
              return (
                <tr key={b.id}>
                  <td data-label="Buku">
                    {item?.bookSlug ? (
                      <Link href={`/books/${item.bookSlug}`} style={{ fontWeight: 600 }}>
                        {item.bookTitle}
                      </Link>
                    ) : (
                      b.borrowCode
                    )}
                  </td>
                  <td data-label="No Pinjam" style={{ fontWeight: 600 }}>
                    {b.borrowCode}
                  </td>
                  <td data-label="Tgl Pinjam">{b.borrowDate}</td>
                  <td data-label="Jatuh Tempo">{b.dueDate}</td>
                  <td data-label="Tgl Kembali">{b.returnDate ?? '—'}</td>
                  <td data-label="Status">
                    <StatusBadge status={b.status} />
                  </td>
                  <td data-label="Denda">
                    {fine ? (
                      <span className={fine.status === 'paid' ? 'badge success' : 'badge warning'}>
                        {fmt(fine.amount)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
