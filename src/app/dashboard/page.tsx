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

  if (loading) {
    return <div className="card" style={{ padding: 24, color: 'var(--muted)' }}>Memuat statistik...</div>;
  }

  if (error) {
    return <div className="card" style={{ padding: 24, color: 'crimson' }}>{error}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Dasbor</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
          {isStaff ? 'Ringkasan operasional perpustakaan' : 'Ringkasan peminjaman Anda'}
        </p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{c.value ?? '—'}</div>
          </Link>
        ))}
      </div>

      {isStaff && (
        <div className="grid grid-2" style={{ marginBottom: 20 }}>
          <Link href="/dashboard/inventories" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>Perawatan</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats?.maintenanceInventories ?? '—'}</div>
          </Link>
          <Link href="/dashboard/inventories" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>Eksemplar Hilang</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stats?.lostInventories ?? '—'}</div>
          </Link>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
          Peminjaman Terbaru
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
                  <td><span className="badge">{statusLabel[b.status] ?? b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
