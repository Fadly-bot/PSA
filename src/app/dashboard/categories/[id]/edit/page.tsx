'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Category = {
  id: string;
  name: string;
  description?: string | null;
};

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/categories/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) setNotFound(true);
          throw new Error('Gagal memuat data.');
        }
        const data = (await res.json()) as Category;
        if (!cancelled) {
          setName(data.name ?? '');
          setDescription(data.description ?? '');
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
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? 'Gagal menyimpan.');
      }
      window.location.href = '/dashboard/categories';
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <div style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 16 }}><Link href="/dashboard/categories" className="btn secondary">Kembali</Link></div>
        <div className="card" style={{ padding: 24 }}>Data kategori tidak ditemukan.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Edit Kategori</h1>
        <Link href="/dashboard/categories" className="btn secondary">Kembali</Link>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && <div style={{ color: 'crimson' }}>{error}</div>}
        {loading ? (
          <div style={{ color: 'var(--muted)' }}>Memuat...</div>
        ) : (
          <>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nama *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={150} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Deskripsi</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} rows={4} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Link href="/dashboard/categories" className="btn secondary">Batal</Link>
              <button className="btn" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
