'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Profile = {
  id: string;
  memberCode: string;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  joinDate: string;
  status: boolean;
  name: string;
  email: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/members/me').then((r) => r.json()),
      fetch('/api/dashboard').then((r) => r.json()),
    ])
      .then(([p, d]) => {
        if (p?.error) throw new Error(p.error);
        if (d?.error) throw new Error(d.error);
        setProfile(p);
        setStats(d.stats ?? {});
      })
      .catch((e: any) => setError(e?.message ?? 'Gagal memuat profil.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 52, borderRadius: 10, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 52, borderRadius: 10 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ padding: 48 }}>
        <div className="icon">⚠️</div>
        <p className="title">Gagal memuat profil</p>
        <p>{error}</p>
        <button className="btn secondary sm" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
          Coba lagi
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const statItems = [
    { label: 'Sedang Dipinjam', value: stats?.activeBorrowings ?? 0, href: '/member/my-books' },
    { label: 'Total Riwayat', value: stats?.totalBorrowings ?? 0, href: '/member/history' },
    { label: 'Denda', value: typeof stats?.fineTotal === 'string' ? stats.fineTotal : 'Rp 0', href: '/member/fines' },
  ];

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="section-header" style={{ marginTop: 8 }}>
        <div>
          <h2>Profil Saya</h2>
          <p>Informasi keanggotaan perpustakaan Anda.</p>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {(profile.name ?? 'A').trim().charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, margin: 0 }}>{profile.name}</h1>
          <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: 14 }}>{profile.email}</p>
          <span className="badge" style={{ marginTop: 8 }}>
            {profile.status ? 'Aktif' : 'Nonaktif'}
            {' · '}
            Anggota
          </span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <table style={{ width: '100%', fontSize: 14 }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 12px 8px 0', color: 'var(--muted)', width: 160 }}>Nomor Anggota</td>
              <td style={{ padding: '8px 0', fontWeight: 700 }}>{profile.memberCode}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px 8px 0', color: 'var(--muted)' }}>Bergabung Sejak</td>
              <td style={{ padding: '8px 0' }}>{profile.joinDate}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px 8px 0', color: 'var(--muted)' }}>Tanggal Lahir</td>
              <td style={{ padding: '8px 0' }}>{profile.birthDate ?? '—'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px 8px 0', color: 'var(--muted)' }}>Telepon</td>
              <td style={{ padding: '8px 0' }}>{profile.phone ?? '—'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px 8px 0', color: 'var(--muted)' }}>Alamat</td>
              <td style={{ padding: '8px 0' }}>{profile.address ?? '—'}</td>
            </tr>
          </tbody>
        </table>
        <p style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--muted)' }}>
          Perlu mengubah data? Hubungi petugas perpustakaan.
        </p>
      </div>

      <div className="grid grid-3">
        {statItems.map((s) => (
          <Link key={s.label} href={s.href} className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ minWidth: 0 }}>
              <p className="label">{s.label}</p>
              <p className="value">{s.value}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
