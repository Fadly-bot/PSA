'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Publisher = {
  id: string;
  name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
};

export default function EditPublisherPage({ params }: { params: { id: string } }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/publishers/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) setNotFound(true);
          throw new Error('Gagal memuat data.');
        }
        const data = (await res.json()) as Publisher;
        if (!cancelled) {
          setName(data.name ?? '');
          setAddress(data.address ?? '');
          setEmail(data.email ?? '');
          setPhone(data.phone ?? '');
          setWebsite(data.website ?? '');
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
      const res = await fetch(`/api/publishers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, email, phone, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? 'Gagal menyimpan.');
      }
      window.location.href = '/dashboard/publishers';
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <div style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 16 }}><Link href="/dashboard/publishers" className="btn secondary">Kembali</Link></div>
        <div className="card" style={{ padding: 24 }}>Data penerbit tidak ditemukan.</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Edit Penerbit</h1>
        <Link href="/dashboard/publishers" className="btn secondary">Kembali</Link>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && <div style={{ color: 'crimson' }}>{error}</div>}
        {loading ? (
          <div style={{ color: 'var(--muted)' }}>Memuat...</div>
        ) : (
          <>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nama *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={200} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Alamat</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Telepon</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Website</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Link href="/dashboard/publishers" className="btn secondary">Batal</Link>
              <button className="btn" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
