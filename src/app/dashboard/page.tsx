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
  memberName?: string | null;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [role, setRole] = useState<string>('');
  const [recent, setRecent] = useState<RecentBorrowing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) throw new Error(d.error);
        setStats(d.stats ?? {});
        setRole(d.role ?? '');
        setRecent(d.recentBorrowings ?? []);
      })
      .catch((e: any) => setError(e?.message ?? 'Gagal memuat statistik.'))
      .finally(() => setLoading(false));
  }, []);

  const isStaff = role === 'staff' || role === 'admin';

  const staffCards = [
    { label: 'Total Buku', value: stats?.totalBooks, href: '/dashboard/books' },
    { label: 'Total Inventaris', value: stats?.totalInventories, href: '/dashboard/inventories' },
    { label: 'Eksemplar Tersedia', value: stats?.availableInventories, href: '/dashboard/inventories' },
    { label: 'Eksemplar Dipinjam', value: stats?.borrowedInventories, href: '/dashboard/inventories' },
    { label: 'Anggota Aktif', value: stats?.totalMembers, href: '/dashboard/members' },
    { label: 'Peminjaman Aktif', value: stats?.activeBorrowings, href: '/dashboard/borrowings' },
    { label: 'Terlambat', value: stats?.overdueBorrowings, href: '/dashboard/borrowings?status=overdue' },
    { label: 'Denda Belum Bayar', value: stats?.unpaidFineTotal, href: '/dashboard/fines' },
  ];

  const memberCards = [
    { label: 'Peminjaman Aktif', value: stats?.activeBorrowings, href: '/dashboard/borrowings' },
    { label: 'Total Riwayat Pinjam', value: stats?.totalBorrowings, href: '/dashboard/borrowings' },
    { label: 'Denda Belum Bayar', value: stats?.outstandingFines, href: '/dashboard/fines' },
    { label: 'Total Denda', value: stats?.fineTotal, href: '/dashboard/fines' },
  ];

  const cards = isStaff ? staffCards : memberCards;
  const statusLabel: Record<string, string> = { borrowed: 'Dipinjam', returned: 'Dikembalikan', overdue: 'Terlambat', cancelled: 'Dibatalkan' };
  const statusTone: Record<string, string> = {
    borrowed: 'info',
    returned: 'success',
    overdue: 'error',
    cancelled: 'neutral',
  };

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <div className="skeleton" style={{ height: 28, width: 180, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: 240 }} />
        </div>
        <div className="grid grid-4" style={{ marginBottom: 20 }}>
          {Array.from({ length: 8 }).map((_, i) => (
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
        <p className="title">Gagal memuat statistik</p>
        <p>{error}</p>
        <button className="btn secondary sm" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
          Coba lagi
        </button>
      </div>
    );
  }

  const cardTones = ['', 'info', 'warning', 'accent', ''] as const;

  return (
    <div>
      <div className="section-header">
        <div>
          <h2>Dasbor</h2>
          <p>{isStaff ? 'Ringkasan operasional perpustakaan' : 'Ringkasan peminjaman Anda'}</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {cards.map((c, i) => (
          <Link key={c.label} href={c.href} className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className={`icon ${cardTones[i % cardTones.length]}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
            <div style={{ minWidth: 0 }}>
              <p className="label">{c.label}</p>
              <p className="value">{c.value ?? '—'}</p>
            </div>
          </Link>
        ))}
      </div>

      {isStaff && (
        <div className="grid grid-2" style={{ marginBottom: 20 }}>
          <Link href="/dashboard/inventories" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="icon warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <div>
              <p className="label">Eksemplar Perawatan</p>
              <p className="value">{stats?.maintenanceInventories ?? '—'}</p>
            </div>
          </Link>
          <Link href="/dashboard/inventories" className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="icon error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            <div>
              <p className="label">Eksemplar Hilang</p>
              <p className="value">{stats?.lostInventories ?? '—'}</p>
            </div>
          </Link>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div className="section-header" style={{ padding: '14px 16px', margin: 0, borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: 18 }}>Peminjaman Terbaru</h2>
          </div>
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Belum ada peminjaman.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>No Pinjam</th>
                {isStaff && <th>Anggota</th>}
                <th>Tgl Pinjam</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>
                    <Link href={`/dashboard/borrowings/${b.id}`}>{b.borrowCode}</Link>
                  </td>
                  {isStaff && <td>{b.memberName ?? '—'}</td>}
                  <td>{b.borrowDate}</td>
                  <td>{b.dueDate}</td>
                  <td><span className={`badge ${statusTone[b.status] ?? 'neutral'}`}>{statusLabel[b.status] ?? b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
