'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authClient, signOut } from '@/lib/auth-client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authClient.getSession()
      .then((s) => {
        const u = (s as any)?.user ?? (s as any)?.data?.user ?? null;
        setUser(u);
      })
      .finally(() => setLoading(false));
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar" style={{ position: 'sticky', top: 0, height: '100vh', padding: 16, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>TBM Semesta Alam</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <Link href="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>Dasbor</Link>
          <Link href="/dashboard/books" className={`nav-item ${isActive('/dashboard/books') ? 'active' : ''}`}>Katalog Buku</Link>
          <Link href="/dashboard/authors" className={`nav-item ${isActive('/dashboard/authors') ? 'active' : ''}`}>Penulis</Link>
          <Link href="/dashboard/publishers" className={`nav-item ${isActive('/dashboard/publishers') ? 'active' : ''}`}>Penerbit</Link>
          <Link href="/dashboard/categories" className={`nav-item ${isActive('/dashboard/categories') ? 'active' : ''}`}>Kategori</Link>
          <Link href="/dashboard/members" className={`nav-item ${isActive('/dashboard/members') ? 'active' : ''}`}>Anggota</Link>
          <Link href="/dashboard/borrowings" className={`nav-item ${isActive('/dashboard/borrowings') ? 'active' : ''}`}>Peminjaman</Link>
          <Link href="/dashboard/shelves" className={`nav-item ${isActive('/dashboard/shelves') ? 'active' : ''}`}>Rak Buku</Link>
          <Link href="/dashboard/book-sources" className={`nav-item ${isActive('/dashboard/book-sources') ? 'active' : ''}`}>Sumber Buku</Link>
        </nav>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8 }}>
          {loading ? (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat...</div>
          ) : user ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name ?? 'Pengguna'}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user.email}</div>
              <button className="btn secondary" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={() => signOut()}>
                Keluar
              </button>
            </>
          ) : (
            <Link className="btn secondary" href="/login" style={{ width: '100%', justifyContent: 'center' }}>Masuk</Link>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, padding: 24, maxWidth: '100%' }}>
        {children}
      </main>
    </div>
  );
}
