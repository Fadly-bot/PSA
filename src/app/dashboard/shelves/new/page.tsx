'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function NewShelfPage() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [floor, setFloor] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: any = { code, name, description };
      if (floor.trim() !== '') body.floor = Number(floor);
      const res = await fetch('/api/shelves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? 'Gagal menyimpan.');
      }
      window.location.href = '/dashboard/shelves';
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Tambah Rak</h1>
        <Link href="/dashboard/shelves" className="btn secondary">Kembali</Link>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && <div style={{ color: 'crimson' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Kode *</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} required maxLength={30} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nama *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Lantai</label>
          <input value={floor} onChange={(e) => setFloor(e.target.value)} type="number" min={0} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Deskripsi</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Link href="/dashboard/shelves" className="btn secondary">Batal</Link>
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </form>
    </div>
  );
}
