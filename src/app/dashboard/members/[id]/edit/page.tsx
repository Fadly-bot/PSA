'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Member = {
  id: string;
  memberCode: string;
  phone?: string | null;
  address?: string | null;
  birthDate?: string | null;
  joinDate?: string | null;
  status: boolean;
  user?: { id: string; name: string; email: string } | null;
};

export default function EditMemberPage({ params }: { params: { id: string } }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/members/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) setNotFound(true);
          throw new Error('Gagal memuat data.');
        }
        const data = await res.json();
        if (!cancelled) setMember(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Terjadi kesalahan.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [params.id]);

  const update = (patch: Partial<Member>) => setMember((prev) => (prev ? { ...prev, ...patch } : prev));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/members/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: member.user?.name,
          email: member.user?.email,
          phone: member.phone || null,
          address: member.address || null,
          birthDate: member.birthDate || null,
          joinDate: member.joinDate || null,
          status: member.status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Gagal menyimpan.');
      window.location.href = '/dashboard/members';
    } catch (err: any) {
      setError(err?.message ?? 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <div style={{ maxWidth: 640 }}>
        <div style={{ marginBottom: 16 }}><Link href="/dashboard/members" className="btn secondary">Kembali</Link></div>
        <div className="card" style={{ padding: 24 }}>Data anggota tidak ditemukan.</div>
      </div>
    );
  }

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Edit Anggota</h1>
        <Link href="/dashboard/members" className="btn secondary">Kembali</Link>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 8 }}>{error}</div>}
        {loading ? (
          <div style={{ color: 'var(--muted)' }}>Memuat...</div>
        ) : member ? (
          <>
            <div>
              <label style={labelStyle}>Kode Anggota</label>
              <input value={member.memberCode} disabled style={{ ...inputStyle, background: '#f1f5f9' }} />
            </div>
            <div className="form-grid form-grid-2">
              <div>
                <label style={labelStyle}>Nama Lengkap *</label>
                <input value={member.user?.name ?? ''} onChange={(e) => update({ user: { ...(member.user ?? { id: '', email: '' }), name: e.target.value } })} required minLength={3} maxLength={150} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" value={member.user?.email ?? ''} onChange={(e) => update({ user: { ...(member.user ?? { id: '', name: '' }), email: e.target.value } })} required style={inputStyle} />
              </div>
            </div>
            <div className="form-grid form-grid-2">
              <div>
                <label style={labelStyle}>Nomor Telepon</label>
                <input value={member.phone ?? ''} onChange={(e) => update({ phone: e.target.value })} maxLength={20} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Tanggal Lahir</label>
                <input type="date" value={member.birthDate ?? ''} onChange={(e) => update({ birthDate: e.target.value })} max={new Date().toISOString().slice(0, 10)} style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Alamat</label>
              <textarea value={member.address ?? ''} onChange={(e) => update({ address: e.target.value })} rows={2} maxLength={500} style={inputStyle} />
            </div>
            <div className="form-grid form-grid-2">
              <div>
                <label style={labelStyle}>Tanggal Bergabung</label>
                <input type="date" value={member.joinDate ?? ''} onChange={(e) => update({ joinDate: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={member.status ? 'active' : 'inactive'} onChange={(e) => update({ status: e.target.value === 'active' })} style={inputStyle}>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Link href="/dashboard/members" className="btn secondary">Batal</Link>
              <button className="btn" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </>
        ) : null}
      </form>
    </div>
  );
}
