import Link from 'next/link';

export default function DashboardPage() {
  const stats = [
    { label: 'Total Buku', value: '—', href: '/dashboard/books' },
    { label: 'Anggota', value: '—', href: '/dashboard/members' },
    { label: 'Peminjaman Aktif', value: '—', href: '/dashboard/borrowings' },
    { label: 'Denda', value: '—', href: '/dashboard/borrowings' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 16px' }}>Dasbor</h1>
      <div className="grid grid-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{s.value}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
