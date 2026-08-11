'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Fine = {
  id: string;
  amount: string;
  paidAt: string | null;
  status: string;
  createdAt: string;
  borrowing: {
    id: string;
    borrowCode: string;
    dueDate: string;
    returnDate: string | null;
    status: string;
  } | null;
};

type BorrowItem = { bookSlug: string; bookTitle: string };

type Borrowing = { borrowCode: string; items?: BorrowItem[] };

const daysLate = (dueDate: string, returnDate: string | null): number => {
  const due = new Date(`${dueDate}T00:00:00`).getTime();
  const end = returnDate
    ? new Date(`${returnDate}T00:00:00`).getTime()
    : Date.now();
  return Math.max(0, Math.floor((end - due) / (1000 * 60 * 60 * 24)));
};

const fmt = (v: string | number | null | undefined) =>
  v == null || v === '' ? 'Rp 0' : `Rp ${Number(v).toLocaleString('id-ID')}`;

export default function FinesPage() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/fines?limit=100').then((r) => r.json()),
      fetch('/api/borrowings?limit=100').then((r) => r.json()),
    ])
      .then(([f, b]) => {
        if (f?.error) throw new Error(f.error);
        if (b?.error) throw new Error(b.error);
        setFines(f.items ?? []);
        setBorrowings(b.items ?? []);
      })
      .catch((e: any) => setError(e?.message ?? 'Gagal memuat data denda.'))
      .finally(() => setLoading(false));
  }, []);

  const bookByCode = useMemo(() => {
    const map = new Map<string, BorrowItem>();
    for (const b of borrowings) {
      const item = b.items?.[0];
      if (item && !map.has(b.borrowCode)) {
        map.set(b.borrowCode, item);
      }
    }
    return map;
  }, [borrowings]);

  const totalUnpaid = fines
    .filter((f) => f.status !== 'paid')
    .reduce((sum, f) => sum + Number(f.amount ?? 0), 0);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 30, width: 180, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: 260, marginBottom: 20 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 72, borderRadius: 10, marginBottom: 8 }} />
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

  if (fines.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 56 }}>
        <div className="icon">🎉</div>
        <p className="title">Tidak ada denda</p>
        <p>Anda tidak memiliki denda keterlambatan.</p>
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
          <h2>Denda</h2>
          <p>Keterlambatan pengembalian buku Anda.</p>
        </div>
      </div>

      {totalUnpaid > 0 && (
        <div className="card" style={{ marginBottom: 16, background: 'var(--warning-bg)', borderColor: '#ecd9b0' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning)' }}>
            Total denda belum dibayar
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--text)', marginTop: 2 }}>
            {fmt(totalUnpaid)}
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-subtle)' }}>
            Silakan hubungi petugas perpustakaan untuk pembayaran denda.
          </p>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="table mobile-table-card" style={{ minWidth: 0 }}>
          <thead>
            <tr>
              <th>Buku</th>
              <th>No Pinjam</th>
              <th>Jatuh Tempo</th>
              <th>Keterlambatan</th>
              <th>Nominal</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fines.map((f) => {
              const book = f.borrowing ? bookByCode.get(f.borrowing.borrowCode) : undefined;
              const late = f.borrowing ? daysLate(f.borrowing.dueDate, f.borrowing.returnDate) : 0;
              const paid = f.status === 'paid';
              return (
                <tr key={f.id}>
                  <td data-label="Buku">
                    {book?.bookSlug ? (
                      <Link href={`/books/${book.bookSlug}`} style={{ fontWeight: 600 }}>
                        {book.bookTitle}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td data-label="No Pinjam" style={{ fontWeight: 600 }}>
                    {f.borrowing?.borrowCode ?? '—'}
                  </td>
                  <td data-label="Jatuh Tempo">{f.borrowing?.dueDate ?? '—'}</td>
                  <td data-label="Keterlambatan">
                    {late > 0 ? `${late} hari` : '—'}
                  </td>
                  <td data-label="Nominal" style={{ fontWeight: 700 }}>
                    {fmt(f.amount)}
                  </td>
                  <td data-label="Status">
                    {paid ? (
                      <span className="badge success">
                        Lunas{f.paidAt ? ` · ${f.paidAt.slice(0, 10)}` : ''}
                      </span>
                    ) : (
                      <span className="badge warning">Belum dibayar</span>
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
