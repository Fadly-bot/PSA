'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function NewMemberPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: phone || null,
          address: address || null,
          birthDate: birthDate || null,
          joinDate,
          status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Gagal menyimpan.');
      window.location.href = '/dashboard/members';
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
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Tambah Anggota</h1>
        <Link href="/dashboard/members" className="btn secondary">Kembali</Link>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 8 }}>{error}</div>}

        <div className="form-grid form-grid-2">
          <div>
            <label style={labelStyle}>Nama Lengkap *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={3} maxLength={150} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Password *</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Minimal 8 karakter" style={inputStyle} />
        </div>

        <div className="form-grid form-grid-2">
          <div>
            <label style={labelStyle}>Nomor Telepon</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Tanggal Lahir</label>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Alamat</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} maxLength={500} style={inputStyle} />
        </div>

        <div className="form-grid form-grid-2">
          <div>
            <label style={labelStyle}>Tanggal Bergabung *</label>
            <input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status ? 'active' : 'inactive'} onChange={(e) => setStatus(e.target.value === 'active')} style={inputStyle}>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Link href="/dashboard/members" className="btn secondary">Batal</Link>
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </form>
    </div>
  );
}
