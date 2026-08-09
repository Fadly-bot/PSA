'use client';

import { useCallback, useEffect, useState } from 'react';

type AuditLog = {
  id: string;
  action: string;
  module: string;
  description?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: { id: string; name?: string | null; email?: string | null } | null;
};

const MODULES = ['AUTH', 'BOOKS', 'BOOK_INVENTORIES', 'BOOK_SOURCES', 'MEMBERS', 'BORROWINGS', 'RETURNS', 'FINES', 'REPORTS', 'SETTINGS', 'USERS', 'DASHBOARD', 'AUTHORS', 'PUBLISHERS', 'CATEGORIES', 'SHELVES'];

export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [module, setModule] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (pageNum: number, opts?: { query?: string; module?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/audit-logs', window.location.origin);
      if (opts?.query) url.searchParams.set('q', opts.query);
      if (opts?.module) url.searchParams.set('module', opts.module);
      url.searchParams.set('page', String(pageNum));
      url.searchParams.set('limit', '20');
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
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Audit Log</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
          Riwayat aktivitas sistem (immutable, hanya admin) — Total {total}
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Cari user / deskripsi..."
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setQ((e.target as HTMLInputElement).value);
                load(1, { query: (e.target as HTMLInputElement).value, module });
              }
            }}
            style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, minWidth: 240, flex: 1 }}
          />
          <select value={module} onChange={(e) => { setModule(e.target.value); load(1, { query: q, module: e.target.value }); }} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6 }}>
            <option value="">Semua Modul</option>
            {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {error ? (
          <div style={{ padding: 24, color: 'crimson' }}>{error}</div>
        ) : loading ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Belum ada audit log.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>User</th>
                <th>Modul</th>
                <th>Aksi</th>
                <th>Deskripsi</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {items.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString('id-ID')}</td>
                  <td>{log.user?.name ?? log.user?.email ?? '—'}</td>
                  <td><span className="badge">{log.module}</span></td>
                  <td><span className="badge">{log.action}</span></td>
                  <td style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.description ?? '—'}</td>
                  <td style={{ color: 'var(--muted)' }}>{log.ipAddress ?? '—'}</td>
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
