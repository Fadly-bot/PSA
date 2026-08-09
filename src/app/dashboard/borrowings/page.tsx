'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Borrowing = {
  id: string;
  borrowCode: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: string;
  member?: { id: string; memberCode: string; user?: { name?: string | null; email?: string | null } | null } | null;
  items?: Array<{ id: string; inventoryCode: string; bookTitle?: string }> | null;
};

const statusLabel: Record<string, string> = {
  borrowed: 'Dipinjam',
  returned: 'Dikembalikan',
  overdue: 'Terlambat',
  cancelled: 'Dibatalkan',
};

export default function BorrowingsPage() {
  const [items, setItems] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (pageNum: number, opts?: { query?: string; status?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/borrowings', window.location.origin);
      if (opts?.query) url.searchParams.set('q', opts.query);
      if (opts?.status) url.searchParams.set('status', opts.status);
      url.searchParams.set('page', String(pageNum));
      url.searchParams.set('limit', '10');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Gagal memuat data.');
      const data = await res.json();
      setItems(data.items ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
      setPage(data.page ?? pageNum);
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Peminjaman</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Total {total} transaksi</p>
        </div>
        <Link href="/dashboard/borrowings/new" className="btn">+ Peminjaman Baru</Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Cari no pinjam / anggota..."
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setQ((e.target as HTMLInputElement).value);
                load(1, { query: (e.target as HTMLInputElement).value, status });
              }
            }}
            style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, minWidth: 240, flex: 1 }}
          />
          <select value={status} onChange={(e) => { setStatus(e.target.value); load(1, { query: q, status: e.target.value }); }} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6 }}>
            <option value="">Semua Status</option>
            <option value="borrowed">Dipinjam</option>
            <option value="returned">Dikembalikan</option>
            <option value="overdue">Terlambat</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>

        {error ? (
          <div style={{ padding: 24, color: 'crimson' }}>{error}</div>
        ) : loading ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Belum ada peminjaman.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>No Pinjam</th>
                <th>Anggota</th>
                <th>Eksemplar</th>
                <th>Tgl Pinjam</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
                <th style={{ width: 100 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.borrowCode}</td>
                  <td>{b.member?.user?.name ?? b.member?.memberCode ?? '—'}</td>
                  <td>{b.items?.length ?? 0} eks.</td>
                  <td>{b.borrowDate}</td>
                  <td>{b.dueDate}</td>
                  <td><span className="badge">{statusLabel[b.status] ?? b.status}</span></td>
                  <td>
                    <Link href={`/dashboard/borrowings/${b.id}`} className="btn secondary">Detail</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div style={{ padding: 12, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Halaman {page} dari {totalPages}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn secondary" disabled={page <= 1} onClick={() => load(page - 1)}>Sebelum</button>
              <button className="btn secondary" disabled={page >= totalPages} onClick={() => load(page + 1)}>Berikut</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
