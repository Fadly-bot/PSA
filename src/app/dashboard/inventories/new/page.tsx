'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type MasterItem = { id: string; name: string };
type BookItem = { id: string; title: string; isbn?: string | null };

function NewInventoryForm() {
  const searchParams = useSearchParams();
  const presetBookId = searchParams.get('bookId') ?? '';

  const [inventoryCode, setInventoryCode] = useState('');
  const [bookId, setBookId] = useState(presetBookId);
  const [sourceId, setSourceId] = useState('');
  const [shelfId, setShelfId] = useState('');
  const [condition, setCondition] = useState<'good' | 'damaged' | 'lost'>('good');
  const [status, setStatus] = useState<'available' | 'borrowed' | 'maintenance' | 'lost'>('available');
  const [notes, setNotes] = useState('');

  const [books, setBooks] = useState<BookItem[]>([]);
  const [sources, setSources] = useState<MasterItem[]>([]);
  const [shelves, setShelves] = useState<MasterItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/books?limit=100&status=active').then((r) => r.json()),
      fetch('/api/book-sources?limit=100').then((r) => r.json()),
      fetch('/api/shelves?limit=100').then((r) => r.json()),
    ])
      .then(([b, s, sh]) => {
        setBooks(b.items ?? []);
        setSources(s.items ?? []);
        setShelves(sh.items ?? []);
      })
      .catch(() => {});
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/inventories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryCode,
          bookId,
          sourceId,
          shelfId: shelfId || null,
          condition,
          status,
          notes: notes || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Gagal menyimpan.');
      window.location.href = '/dashboard/inventories';
    } catch (err: any) {
      setError(err?.message ?? 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Tambah Inventaris</h1>
        <Link href="/dashboard/inventories" className="btn secondary">Kembali</Link>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 8 }}>{error}</div>}

        <div>
          <label style={labelStyle}>Buku (Judul) *</label>
          <select value={bookId} onChange={(e) => setBookId(e.target.value)} required style={inputStyle}>
            <option value="">— Pilih Buku —</option>
            {books.map((b) => <option key={b.id} value={b.id}>{b.title}{b.isbn ? ` (${b.isbn})` : ''}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Kode Inventaris *</label>
          <input value={inventoryCode} onChange={(e) => setInventoryCode(e.target.value)} required minLength={3} maxLength={50} placeholder="INV-2026-000001" style={inputStyle} />
        </div>

        <div className="form-grid form-grid-2">
          <div>
            <label style={labelStyle}>Sumber Buku *</label>
            <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} required style={inputStyle}>
              <option value="">— Pilih Sumber —</option>
              {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Rak</label>
            <select value={shelfId} onChange={(e) => setShelfId(e.target.value)} style={inputStyle}>
              <option value="">— Pilih Rak —</option>
              {shelves.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-grid form-grid-2">
          <div>
            <label style={labelStyle}>Kondisi</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value as typeof condition)} style={inputStyle}>
              <option value="good">Baik</option>
              <option value="damaged">Rusak</option>
              <option value="lost">Hilang</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} style={inputStyle}>
              <option value="available">Tersedia</option>
              <option value="borrowed">Dipinjam</option>
              <option value="maintenance">Perawatan</option>
              <option value="lost">Hilang</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Catatan</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Link href="/dashboard/inventories" className="btn secondary">Batal</Link>
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </form>
    </div>
  );
}

export default function NewInventoryPage() {
  return (
    <Suspense fallback={<div className="card" style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>}>
      <NewInventoryForm />
    </Suspense>
  );
}
