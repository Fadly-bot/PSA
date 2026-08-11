'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Stats = Record<string, string | number>;
type RecentBorrowing = {
  id: string;
  borrowCode: string;
  borrowDate: string;
  dueDate: string;
  status: string;
};

const STATUS_LABEL: Record<string, string> = {
  borrowed: 'Dipinjam',
  returned: 'Dikembalikan',
  overdue: 'Terlambat',
  cancelled: 'Dibatalkan',
};
const STATUS_TONE: Record<string, string> = {
  borrowed: 'info',
  returned: 'success',
  overdue: 'error',
  cancelled: 'neutral',
};

export default function MemberHomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentBorrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) throw new Error(d.error);
        setStats(d.stats ?? {});
        setRecent(d.recentBorrowings ?? []);
      })
      .catch((e: any) => setError(e?.message ?? 'Gagal memuat data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 30, width: 240, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: 300, marginBottom: 20 }} />
        <div className="grid grid-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 10 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 26, width: '45%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ padding: 48 }}>
        <div className="icon">⚠️</div>
        <p className="title">Gagal memuat data</p>
        <p>{error}</p>
        <button className="btn secondary sm" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
          Coba lagi
        </button>
      </div>
    );
  }

  const cards = [
    {
      label: 'Sedang Dipinjam',
      value: stats?.activeBorrowings ?? 0,
      href: '/member/my-books',
      icon: 'book',
      tone: 'info',
    },
    {
      label: 'Sudah Dikembalikan',
      value: stats?.returnedBorrowings ?? 0,
      href: '/member/history',
      icon: 'check',
      tone: '',
    },
    {
      label: 'Terlambat',
      value: stats?.overdueBorrowings ?? 0,
      href: '/member/my-books',
      icon: 'alert',
      tone: 'warning',
    },
    {
      label: 'Denda',
      value: typeof stats?.fineTotal === 'string' ? stats.fineTotal : 'Rp 0',
      href: '/member/fines',
      icon: 'coin',
      tone: 'error',
    },
  ];

  const cardIcons: Record<string, React.ReactNode> = {
    book: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20V4a2 2 0 00-2-2H6.5A2.5 2.5 0 004 4.5v15z" />
        <path d="M4 19.5A2.5 2.5 0 006.5 22H20v-5" />
      </svg>
    ),
    check: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
    alert: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    ),
    coin: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  };

  return (
    <div>
      <div className="section-header" style={{ marginTop: 8 }}>
        <div>
          <h2>Beranda Anggota</h2>
          <p>Ringkasan aktivitas membaca dan peminjaman Anda.</p>
        </div>
        <Link href="/member/books" className="btn">
          Cari Buku
        </Link>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className={`icon ${c.tone}`}>{cardIcons[c.icon]}</span>
            <div style={{ minWidth: 0 }}>
              <p className="label">{c.label}</p>
              <p className="value">{c.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto', marginBottom: 20 }}>
        <div className="section-header" style={{ padding: '14px 16px', margin: 0, borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: 18 }}>Peminjaman Terbaru</h2>
          </div>
          <Link href="/member/my-books" className="btn secondary sm">Lihat Semua →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="icon">📚</div>
            <p className="title">Belum ada peminjaman</p>
            <p>Jelajahi katalog dan pinjam buku pertama Anda.</p>
            <Link href="/member/books" className="btn sm" style={{ marginTop: 12 }}>
              Lihat Katalog
            </Link>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>No Pinjam</th>
                <th>Tgl Pinjam</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.borrowCode}</td>
                  <td>{b.borrowDate}</td>
                  <td>{b.dueDate}</td>
                  <td>
                    <span className={`badge ${STATUS_TONE[b.status] ?? 'neutral'}`}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
