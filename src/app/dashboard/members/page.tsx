'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Member = {
  id: string;
  memberCode: string;
  phone?: string | null;
  joinDate?: string | null;
  status: boolean;
  user?: { id: string; name: string; email: string } | null;
};

export default function MembersPage() {
  const [items, setItems] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (pageNum: number, opts?: { query?: string; status?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/members', window.location.origin);
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

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus anggota "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Gagal menghapus.');
      }
      setItems((prev) => prev.filter((m) => m.id !== id));
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
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Anggota</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Total {total} anggota</p>
        </div>
        <Link href="/dashboard/members/new" className="btn">+ Tambah Anggota</Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Cari kode / nama / email / telepon..."
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
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </div>

        {error ? (
          <div style={{ padding: 24, color: 'crimson' }}>{error}</div>
        ) : loading ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Belum ada anggota.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Telepon</th>
                <th>Tanggal Bergabung</th>
                <th>Status</th>
                <th style={{ width: 180 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.memberCode}</td>
                  <td>{m.user?.name ?? '—'}</td>
                  <td>{m.user?.email ?? '—'}</td>
                  <td>{m.phone ?? '—'}</td>
                  <td>{m.joinDate ?? '—'}</td>
                  <td><span className="badge">{m.status ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/dashboard/members/${m.id}/edit`} className="btn secondary">Edit</Link>
                      <button className="btn secondary" onClick={() => onDelete(m.id, m.user?.name ?? m.memberCode)} disabled={deletingId === m.id}>
                        {deletingId === m.id ? '...' : 'Hapus'}
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
