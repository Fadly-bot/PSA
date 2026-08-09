'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Fine = {
  id: string;
  amount: string;
  paidAt?: string | null;
  status: string;
  createdAt: string;
  borrowing?: {
    id: string;
    borrowCode: string;
    dueDate: string;
    returnDate?: string | null;
    member?: { id: string; memberCode: string; user?: { name?: string | null; email?: string | null } | null } | null;
  } | null;
};

export default function FinesPage() {
  const [items, setItems] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async (pageNum: number, statusFilter?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/fines', window.location.origin);
      if (statusFilter) url.searchParams.set('status', statusFilter);
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

  const onPay = async (id: string) => {
    if (!confirm('Tandai denda ini sebagai lunas?')) return;
    setPayingId(id);
    try {
      const res = await fetch(`/api/fines/${id}`, { method: 'PATCH' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Gagal memproses.');
      await load(page, status);
    } catch (e: any) {
      alert(e?.message ?? 'Gagal memproses pembayaran.');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Denda</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Total {total} denda</p>
        </div>
        <Link href="/dashboard/borrowings" className="btn secondary">Ke Peminjaman</Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={status} onChange={(e) => { setStatus(e.target.value); load(1, e.target.value); }} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6 }}>
            <option value="">Semua Status</option>
            <option value="unpaid">Belum Dibayar</option>
            <option value="paid">Lunas</option>
          </select>
        </div>

        {error ? (
          <div style={{ padding: 24, color: 'crimson' }}>{error}</div>
        ) : loading ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Belum ada data denda.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>No Pinjam</th>
                <th>Anggota</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Dibayar</th>
                <th style={{ width: 140 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600 }}>{f.borrowing?.borrowCode ?? '—'}</td>
                  <td>{f.borrowing?.member?.user?.name ?? f.borrowing?.member?.memberCode ?? '—'}</td>
                  <td style={{ fontWeight: 600 }}>Rp{f.amount}</td>
                  <td><span className="badge">{f.status === 'paid' ? 'Lunas' : 'Belum Dibayar'}</span></td>
                  <td>{f.paidAt ? new Date(f.paidAt).toLocaleDateString('id-ID') : '—'}</td>
                  <td>
                    {f.status === 'unpaid' ? (
                      <button className="btn" style={{ padding: '6px 10px', fontSize: 13 }} onClick={() => onPay(f.id)} disabled={payingId === f.id}>
                        {payingId === f.id ? '...' : 'Tandai Lunas'}
                      </button>
                    ) : (
                      <Link href={`/dashboard/borrowings/${f.borrowing?.id}`} className="btn secondary">Detail</Link>
                    )}
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
              <button className="btn secondary" disabled={page <= 1} onClick={() => load(page - 1, status)}>Sebelum</button>
              <button className="btn secondary" disabled={page >= totalPages} onClick={() => load(page + 1, status)}>Berikut</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
