'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Author = {
  id: string;
  name: string;
  biography?: string | null;
  photoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function AuthorsPage() {
  const [items, setItems] = useState<Author[]>([]);
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
      const url = new URL('/api/authors', window.location.origin);
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
    if (!confirm('Hapus penulis ini?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/authors/${id}`, { method: 'DELETE' });
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Penulis</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Total {total} data</p>
        </div>
        <Link href="/dashboard/authors/new" className="btn">+ Tambah Penulis</Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Cari penulis..."
            defaultValue={q}
            onBlur={(e) => onSearch(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch((e.target as HTMLInputElement).value);
            }}
            style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, minWidth: 220 }}
          />
        </div>

        {error ? (
          <div style={{ padding: 24, color: 'crimson' }}>{error}</div>
        ) : loading ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Belum ada data penulis.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Biografi</th>
                <th style={{ width: 180 }}>Dibuat</th>
                <th style={{ width: 180 }}>Diperbarui</th>
                <th style={{ width: 180 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td style={{ color: 'var(--muted)' }}>{item.biography ? `${item.biography.slice(0, 80)}${item.biography.length > 80 ? '...' : ''}` : '—'}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                  <td>{new Date(item.updatedAt).toLocaleDateString('id-ID')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/dashboard/authors/${item.id}/edit`} className="btn secondary">Edit</Link>
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
          <div style={{ padding: 12, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
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
