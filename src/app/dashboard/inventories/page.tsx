'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Inventory = {
  id: string;
  inventoryCode: string;
  condition: string;
  status: string;
  notes?: string | null;
  book?: { id: string; title: string; isbn?: string | null } | null;
  source?: { id: string; name: string } | null;
  shelf?: { id: string; code: string; name: string } | null;
};

const statusOptions = ['available', 'borrowed', 'maintenance', 'lost'];
const conditionOptions = ['good', 'damaged', 'lost'];

const statusLabel: Record<string, string> = { available: 'Tersedia', borrowed: 'Dipinjam', maintenance: 'Perawatan', lost: 'Hilang' };
const conditionLabel: Record<string, string> = { good: 'Baik', damaged: 'Rusak', lost: 'Hilang' };

export default function InventoriesPage() {
  const [items, setItems] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [condition, setCondition] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (pageNum: number, opts?: { query?: string; status?: string; condition?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/inventories', window.location.origin);
      if (opts?.query) url.searchParams.set('q', opts.query);
      if (opts?.status) url.searchParams.set('status', opts.status);
      if (opts?.condition) url.searchParams.set('condition', opts.condition);
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

  const onDelete = async (id: string, code: string) => {
    if (!confirm(`Hapus inventaris "${code}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/inventories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Gagal menghapus.');
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotal((t) => t - 1);
    } catch (e: any) {
      alert(e?.message ?? 'Gagal menghapus.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Inventaris Buku</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Total {total} eksemplar</p>
        </div>
        <Link href="/dashboard/inventories/new" className="btn">+ Tambah Inventaris</Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Cari kode inventaris / judul / ISBN / rak / sumber..."
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setQ((e.target as HTMLInputElement).value);
                load(1, { query: (e.target as HTMLInputElement).value, status, condition });
              }
            }}
            style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, minWidth: 260, flex: 1 }}
          />
          <select value={status} onChange={(e) => { setStatus(e.target.value); load(1, { query: q, status: e.target.value, condition }); }} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6 }}>
            <option value="">Semua Status</option>
            {statusOptions.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
          </select>
          <select value={condition} onChange={(e) => { setCondition(e.target.value); load(1, { query: q, status, condition: e.target.value }); }} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6 }}>
            <option value="">Semua Kondisi</option>
            {conditionOptions.map((c) => <option key={c} value={c}>{conditionLabel[c]}</option>)}
          </select>
        </div>

        {error ? (
          <div style={{ padding: 24, color: 'crimson' }}>{error}</div>
        ) : loading ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Belum ada data inventaris.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Kode Inventaris</th>
                <th>Judul Buku</th>
                <th>ISBN</th>
                <th>Rak</th>
                <th>Sumber</th>
                <th>Kondisi</th>
                <th>Status</th>
                <th style={{ width: 160 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600 }}>{inv.inventoryCode}</td>
                  <td>{inv.book ? <Link href={`/books/${inv.book.title}`}>{inv.book.title}</Link> : '—'}</td>
                  <td style={{ color: 'var(--muted)' }}>{inv.book?.isbn ?? '—'}</td>
                  <td>{inv.shelf ? `${inv.shelf.code} - ${inv.shelf.name}` : '—'}</td>
                  <td>{inv.source?.name ?? '—'}</td>
                  <td><span className="badge">{conditionLabel[inv.condition] ?? inv.condition}</span></td>
                  <td><span className="badge">{statusLabel[inv.status] ?? inv.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/dashboard/inventories/${inv.id}/edit`} className="btn secondary">Edit</Link>
                      <button className="btn secondary" onClick={() => onDelete(inv.id, inv.inventoryCode)} disabled={deletingId === inv.id}>
                        {deletingId === inv.id ? '...' : 'Hapus'}
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
    </div>
  );
}
