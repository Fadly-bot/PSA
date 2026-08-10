'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Member = { id: string; memberCode: string; user?: { name?: string | null; email?: string | null } | null };
type InventoryItem = { id: string; inventoryCode: string; book?: { id: string; title: string; isbn?: string | null } | null };

export default function NewBorrowingPage() {
  const [memberId, setMemberId] = useState('');
  const [inventoryIds, setInventoryIds] = useState<string[]>([]);
  const [borrowDate, setBorrowDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState('');

  const [members, setMembers] = useState<Member[]>([]);
  const [inventories, setInventories] = useState<InventoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/members?limit=100&status=true').then((r) => r.json()),
      fetch('/api/inventories?limit=100&status=available').then((r) => r.json()),
    ])
      .then(([m, inv]) => {
        setMembers(m.items ?? []);
        setInventories(inv.items ?? []);
      })
      .catch(() => {});
  }, []);

  const toggleInventory = (id: string) => {
    setInventoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/borrowings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, borrowDate, dueDate, notes: notes || null, inventoryIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Gagal menyimpan.');
      window.location.href = `/dashboard/borrowings/${data.id}`;
    } catch (err: any) {
      setError(err?.message ?? 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 };

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Peminjaman Baru</h1>
        <Link href="/dashboard/borrowings" className="btn secondary">Kembali</Link>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 8 }}>{error}</div>}

        <div className="form-grid form-grid-3">
          <div>
            <label style={labelStyle}>Anggota *</label>
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} required style={inputStyle}>
              <option value="">— Pilih Anggota —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.user?.name ?? m.memberCode} ({m.memberCode})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tanggal Pinjam *</label>
            <input type="date" value={borrowDate} onChange={(e) => setBorrowDate(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Jatuh Tempo *</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Pilih Eksemplar (Inventaris) — tersedia {inventories.length} *</label>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, maxHeight: 320, overflow: 'auto' }}>
            {inventories.length === 0 ? (
              <div style={{ padding: 16, color: 'var(--muted)', fontSize: 13 }}>
                Tidak ada eksemplar tersedia. Tambahkan inventaris terlebih dahulu di menu Inventaris.
              </div>
            ) : (
              inventories.map((inv) => {
                const checked = inventoryIds.includes(inv.id);
                return (
                  <label
                    key={inv.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderBottom: '1px solid var(--border)', cursor: 'pointer',
                      background: checked ? 'var(--primary-light)' : 'transparent',
                    }}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleInventory(inv.id)} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{inv.inventoryCode}</span>
                    <span style={{ fontSize: 13 }}>{inv.book?.title ?? '—'}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>{inv.book?.isbn ?? ''}</span>
                  </label>
                );
              })
            )}
          </div>
          {inventoryIds.length > 0 && (
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '6px 0 0' }}>Dipilih: {inventoryIds.length} eksemplar</p>
          )}
        </div>

        <div>
          <label style={labelStyle}>Catatan</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={1000} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Link href="/dashboard/borrowings" className="btn secondary">Batal</Link>
          <button className="btn" type="submit" disabled={loading || inventoryIds.length === 0}>
            {loading ? 'Menyimpan...' : 'Simpan Peminjaman'}
          </button>
        </div>
      </form>
    </div>
  );
}
