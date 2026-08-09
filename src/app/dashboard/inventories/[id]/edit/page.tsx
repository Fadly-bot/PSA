'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type MasterItem = { id: string; name: string };
type BookItem = { id: string; title: string; isbn?: string | null };
type Inventory = {
  id: string;
  inventoryCode: string;
  condition: 'good' | 'damaged' | 'lost';
  status: 'available' | 'borrowed' | 'maintenance' | 'lost';
  notes?: string | null;
  book?: { id: string } | null;
  source?: { id: string } | null;
  shelf?: { id: string } | null;
};

export default function EditInventoryPage({ params }: { params: { id: string } }) {
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [sources, setSources] = useState<MasterItem[]>([]);
  const [shelves, setShelves] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [invRes, bRes, sRes, shRes] = await Promise.all([
          fetch(`/api/inventories/${params.id}`),
          fetch('/api/books?limit=100&status=active'),
          fetch('/api/book-sources?limit=100'),
          fetch('/api/shelves?limit=100'),
        ]);
        if (!invRes.ok) {
          if (invRes.status === 404) setNotFound(true);
          throw new Error('Gagal memuat data.');
        }
        const [inv, b, s, sh] = await Promise.all([invRes.json(), bRes.json(), sRes.json(), shRes.json()]);
        if (!cancelled) {
          setInventory(inv);
          setBooks(b.items ?? []);
          setSources(s.items ?? []);
          setShelves(sh.items ?? []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Terjadi kesalahan.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [params.id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventory) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/inventories/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryCode: inventory.inventoryCode,
          bookId: inventory.book?.id ?? null,
          sourceId: inventory.source?.id ?? null,
          shelfId: inventory.shelf?.id ?? null,
          condition: inventory.condition,
          status: inventory.status,
          notes: inventory.notes || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Gagal menyimpan.');
      window.location.href = '/dashboard/inventories';
    } catch (err: any) {
      setError(err?.message ?? 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  const update = (patch: Partial<Inventory>) => setInventory((prev) => (prev ? { ...prev, ...patch } : prev));

  if (notFound) {
    return (
      <div style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 16 }}><Link href="/dashboard/inventories" className="btn secondary">Kembali</Link></div>
        <div className="card" style={{ padding: 24 }}>Data inventaris tidak ditemukan.</div>
      </div>
    );
  }

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Edit Inventaris</h1>
        <Link href="/dashboard/inventories" className="btn secondary">Kembali</Link>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 8 }}>{error}</div>}
        {loading ? (
          <div style={{ color: 'var(--muted)' }}>Memuat...</div>
        ) : inventory ? (
          <>
            <div>
              <label style={labelStyle}>Buku (Judul) *</label>
              <select value={inventory.book?.id ?? ''} onChange={(e) => update({ book: e.target.value ? { id: e.target.value } : null })} required style={inputStyle}>
                <option value="">— Pilih Buku —</option>
                {books.map((b) => <option key={b.id} value={b.id}>{b.title}{b.isbn ? ` (${b.isbn})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Kode Inventaris *</label>
              <input value={inventory.inventoryCode} onChange={(e) => update({ inventoryCode: e.target.value })} required minLength={3} maxLength={50} style={inputStyle} />
            </div>
            <div className="form-grid form-grid-2">
              <div>
                <label style={labelStyle}>Sumber Buku *</label>
                <select value={inventory.source?.id ?? ''} onChange={(e) => update({ source: e.target.value ? { id: e.target.value } : null })} required style={inputStyle}>
                  <option value="">— Pilih Sumber —</option>
                  {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Rak</label>
                <select value={inventory.shelf?.id ?? ''} onChange={(e) => update({ shelf: e.target.value ? { id: e.target.value } : null })} style={inputStyle}>
                  <option value="">— Pilih Rak —</option>
                  {shelves.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-grid form-grid-2">
              <div>
                <label style={labelStyle}>Kondisi</label>
                <select value={inventory.condition} onChange={(e) => update({ condition: e.target.value as Inventory['condition'] })} style={inputStyle}>
                  <option value="good">Baik</option>
                  <option value="damaged">Rusak</option>
                  <option value="lost">Hilang</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={inventory.status} onChange={(e) => update({ status: e.target.value as Inventory['status'] })} style={inputStyle}>
                  <option value="available">Tersedia</option>
                  <option value="borrowed">Dipinjam</option>
                  <option value="maintenance">Perawatan</option>
                  <option value="lost">Hilang</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Catatan</label>
              <textarea value={inventory.notes ?? ''} onChange={(e) => update({ notes: e.target.value })} rows={3} maxLength={1000} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Link href="/dashboard/inventories" className="btn secondary">Batal</Link>
              <button className="btn" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </>
        ) : null}
      </form>
    </div>
  );
}
