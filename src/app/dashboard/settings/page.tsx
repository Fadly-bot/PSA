'use client';

import { useEffect, useState } from 'react';

type SettingMap = Record<string, string | number | boolean>;

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (!d?.settings) throw new Error('Gagal memuat pengaturan.');
        setSettings(d.settings);
      })
      .catch((e: any) => setError(e?.message ?? 'Gagal memuat pengaturan.'))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: string, value: string | number | boolean) =>
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? 'Gagal menyimpan pengaturan.');
      setSettings(d.settings);
      alert('Pengaturan berhasil disimpan.');
    } catch (err: any) {
      setError(err?.message ?? 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 };

  const field = (key: string, label: string, type: 'text' | 'number' = 'text', placeholder = '') => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={settings?.[key] === undefined ? '' : String(settings[key])}
        onChange={(e) => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );

  if (loading) {
    return <div className="card" style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>;
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Pengaturan</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Konfigurasi perpustakaan (hanya admin)</p>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 8 }}>{error}</div>}

        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Profil Perpustakaan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {field('libraryName', 'Nama Perpustakaan')}
            {field('libraryAddress', 'Alamat')}
            <div className="form-grid form-grid-2">
              {field('libraryEmail', 'Email')}
              {field('libraryPhone', 'Nomor Telepon')}
            </div>
            {field('libraryOpenHours', 'Jam Operasional')}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Aturan Peminjaman</h3>
          <div className="form-grid form-grid-2">
            {field('maxBorrowDays', 'Lama Maksimal Pinjam (hari)', 'number')}
            {field('maxBorrowBooks', 'Maksimal Jumlah Buku', 'number')}
            {field('finePerDay', 'Denda per Hari (Rp)', 'number')}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</button>
        </div>
      </form>
    </div>
  );
}
