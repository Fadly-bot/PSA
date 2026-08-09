'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Shelf = {
  id: string;
  code: string;
  name: string;
  floor?: number | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function ShelvesPage() {
  const [items, setItems] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async (pageNum: number, query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/shelves', window.location.origin);
      if (query) url.searchParams.set('q', query);
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
  };

  useEffect(() => {
    load(1);
  }, []);

  const onSearch = (value: string) => {
    setQ(value);
    load(1, value);
  };

  const onDelete = async (id: string) => {
    if (!confirm('Hapus rak ini?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/shelves/${id}`, { method: 'DELETE' });
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
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Rak Buku</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Total {total} data</p>
        </div>
        <Link href="/dashboard/shelves/new" className="btn">+ Tambah Rak</Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Cari rak..."
            defaultValue={q}
            onBlur={(e) => onSearch(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch((e.target as HTMLInputElement).value);
            }}
            style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, minWidth: 240, flex: 1 }}
          />
        </div>

        {error ? (
          <div style={{ padding: 24, color: 'crimson' }}>{error}</div>
        ) : loading ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Belum ada data rak.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                <th>Lantai</th>
                <th>Deskripsi</th>
                <th style={{ width: 180 }}>Dibuat</th>
                <th style={{ width: 180 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.code}</td>
                  <td>{item.name}</td>
                  <td>{item.floor ?? '—'}</td>
                  <td style={{ color: 'var(--muted)' }}>{item.description ? `${item.description.slice(0, 60)}${item.description.length > 60 ? '...' : ''}` : '—'}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/dashboard/shelves/${item.id}/edit`} className="btn secondary">Edit</Link>
                      <button className="btn secondary" onClick={() => onDelete(item.id)} disabled={deletingId === item.id}>
                        {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
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
              <button className="btn secondary" disabled={page <= 1} onClick={() => load(page - 1, q)}>Sebelum</button>
              <button className="btn secondary" disabled={page >= totalPages} onClick={() => load(page + 1, q)}>Berikut</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
