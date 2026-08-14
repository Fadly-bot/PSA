'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Toast, { useToast } from '@/components/toast';
import ConfirmDialog from '@/components/confirm-dialog';

type ReturnRow = {
  id: string;
  returnDate: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  borrowing?: {
    id: string;
    borrowCode: string;
    borrowDate: string;
    dueDate: string;
    status: string;
    member?: { id: string; memberCode: string; user?: { name?: string | null } | null } | null;
  } | null;
};

export default function ReturnsPage() {
  const [items, setItems] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const load = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/returns', window.location.origin);
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

  const onDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/returns/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Gagal menghapus.');
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotal((t) => t - 1);
      showToast({ type: 'success', message: 'Pengembalian berhasil dihapus.' });
    } catch (e: any) {
      showToast({ type: 'error', message: e?.message ?? 'Gagal menghapus pengembalian.' });
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Pengembalian</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Total {total} transaksi pengembalian</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {error ? (
          <div style={{ padding: 24, color: 'crimson' }}>{error}</div>
        ) : loading ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Belum ada pengembalian. Proses dari halaman detail peminjaman.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>No Pinjam</th>
                <th>Anggota</th>
                <th>Tgl Pinjam</th>
                <th>Jatuh Tempo</th>
                <th>Tgl Kembali</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.borrowing?.borrowCode ?? '—'}</td>
                  <td>{r.borrowing?.member?.user?.name ?? r.borrowing?.member?.memberCode ?? '—'}</td>
                  <td>{r.borrowing?.borrowDate ?? '—'}</td>
                  <td>{r.borrowing?.dueDate ?? '—'}</td>
                  <td>{r.returnDate}</td>
                  <td><span className={`badge ${r.status === 'late' ? 'error' : 'success'}`}>{r.status === 'late' ? 'Terlambat' : 'Tepat Waktu'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/dashboard/borrowings/${r.borrowing?.id}`} className="btn secondary">Detail</Link>
                      <button className="btn secondary" onClick={() => setConfirmId(r.id)} disabled={deletingId === r.id}>
                        {deletingId === r.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
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
      <Toast toast={toast} />
      <ConfirmDialog
        open={confirmId !== null}
        title="Hapus Pengembalian"
        message={`Apakah Anda yakin ingin menghapus pengembalian "${items.find((i) => i.id === confirmId)?.borrowing?.borrowCode ?? ''}" beserta transaksi peminjaman terkait? Tindakan ini tidak dapat dibatalkan.`}
        busy={deletingId !== null}
        onConfirm={() => { if (confirmId) onDelete(confirmId); }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
