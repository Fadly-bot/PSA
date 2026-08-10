'use client';

import { useCallback, useEffect, useState } from 'react';

type StaffRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt?: string | null;
  role: { name: string } | null;
  member: { id: string; memberCode: string | null; status: boolean } | null;
};

const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14 };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 };

export default function StaffPage() {
  const [items, setItems] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async (pageNum: number, opts?: { query?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/users?role=staff', window.location.origin);
      if (opts?.query) url.searchParams.set('q', opts.query);
      url.searchParams.set('page', String(pageNum));
      url.searchParams.set('limit', '10');
      const res = await fetch(url.toString());
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error ?? 'Gagal memuat data.');
      }
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

  const refresh = () => load(page, { query: q });

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const name = String(fd.get('name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    const password = String(fd.get('password') ?? '');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'staff' }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? 'Gagal menyimpan.');
      setShowAdd(false);
      await load(1, { query: q });
    } catch (err: any) {
      setFormError(err?.message ?? 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  const onEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setFormError(null);
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const name = String(fd.get('name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    const status = String(fd.get('status') ?? 'active');
    const role = String(fd.get('role') ?? 'staff');
    try {
      const res = await fetch(`/api/users/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, status, role }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? 'Gagal menyimpan.');
      setEditing(null);
      await refresh();
    } catch (err: any) {
      setFormError(err?.message ?? 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  const onToggleStatus = async (row: StaffRow) => {
    const next = row.status === 'active' ? 'inactive' : 'active';
    const action = next === 'inactive' ? 'nonaktifkan' : 'aktifkan';
    if (!confirm(`${action === 'nonaktifkan' ? 'Nonaktifkan' : 'Aktifkan'} petugas "${row.name}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? 'Gagal mengubah status.');
      await refresh();
    } catch (err: any) {
      alert(err?.message ?? 'Gagal mengubah status.');
    } finally {
      setBusy(false);
    }
  };

  const onRoleChange = async (row: StaffRow, nextRole: 'staff' | 'member') => {
    const label = nextRole === 'member' ? 'jadikan Anggota (member)' : 'jadikan Petugas (staff)';
    if (!confirm(`Ubah role "${row.name}" menjadi ${label}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? 'Gagal mengubah role.');
      await refresh();
    } catch (err: any) {
      alert(err?.message ?? 'Gagal mengubah role.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Kelola Petugas</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Total {total} petugas</p>
        </div>
        <button className="btn" onClick={() => { setFormError(null); setShowAdd(true); }}>+ Tambah Petugas</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Cari nama / email petugas..."
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = (e.target as HTMLInputElement).value;
                setQ(v);
                load(1, { query: v });
              }
            }}
            style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, minWidth: 240, flex: 1 }}
          />
        </div>

        {error ? (
          <div style={{ padding: 24, color: 'crimson' }}>{error}</div>
        ) : loading ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>
            {q ? 'Tidak ada petugas yang cocok dengan pencarian.' : 'Belum ada petugas.'}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ width: 260 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600 }}>{row.name}</td>
                  <td>{row.email}</td>
                  <td>
                    <span className="badge">{row.role?.name ?? '—'}</span>
                  </td>
                  <td>
                    <span className={`badge ${row.status === 'active' ? '' : ''}`} style={row.status === 'inactive' ? { opacity: 0.6 } : undefined}>
                      {row.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn secondary" disabled={busy} onClick={() => { setFormError(null); setEditing(row); }}>Edit</button>
                      <button className="btn secondary" disabled={busy} onClick={() => onToggleStatus(row)}>
                        {row.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button className="btn secondary" disabled={busy} onClick={() => onRoleChange(row, 'member')}>Jadikan Member</button>
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
              <button className="btn secondary" disabled={page <= 1} onClick={() => load(page - 1, { query: q })}>Sebelum</button>
              <button className="btn secondary" disabled={page >= totalPages} onClick={() => load(page + 1, { query: q })}>Berikut</button>
            </div>
          </div>
        )}
      </div>

      {/* Tambah Petugas */}
      {showAdd && (
        <Modal title="Tambah Petugas" onClose={() => setShowAdd(false)}>
          <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {formError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 8 }}>{formError}</div>}
            <div>
              <label style={labelStyle}>Nama Lengkap *</label>
              <input name="name" required minLength={3} maxLength={150} placeholder="Nama petugas" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input name="email" type="email" required placeholder="nama@perpus.id" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Password *</label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={100}
                pattern="(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}"
                title="Minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka"
                placeholder="Min. 8 karakter (huruf besar, kecil, angka)"
                style={inputStyle}
              />
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>Minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn secondary" onClick={() => setShowAdd(false)}>Batal</button>
              <button type="submit" className="btn" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Petugas */}
      {editing && (
        <Modal title={`Edit Petugas — ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={onEdit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {formError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 8 }}>{formError}</div>}
            <div>
              <label style={labelStyle}>Nama Lengkap *</label>
              <input name="name" required minLength={3} maxLength={150} defaultValue={editing.name} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input name="email" type="email" required defaultValue={editing.email} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select name="role" defaultValue={editing.role?.name === 'member' ? 'member' : 'staff'} style={inputStyle}>
                <option value="staff">Petugas (staff)</option>
                <option value="member">Anggota (member)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select name="status" defaultValue={editing.status} style={inputStyle}>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn secondary" onClick={() => setEditing(null)}>Batal</button>
              <button type="submit" className="btn" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--card, #fff)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, width: '100%', maxWidth: 440, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{title}</h2>
          <button aria-label="Tutup" onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
