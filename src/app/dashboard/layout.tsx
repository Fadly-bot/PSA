'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { authClient, signOut } from '@/lib/auth-client';

type NavItem = { href: string; label: string; section: 'main' | 'master' | 'library' | 'admin'; adminOnly?: boolean };

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dasbor', section: 'main' },
  { href: '/dashboard/books', label: 'Katalog Buku', section: 'master' },
  { href: '/dashboard/inventories', label: 'Inventaris Buku', section: 'master' },
  { href: '/dashboard/book-sources', label: 'Sumber Buku', section: 'master' },
  { href: '/dashboard/categories', label: 'Kategori', section: 'master' },
  { href: '/dashboard/authors', label: 'Penulis', section: 'master' },
  { href: '/dashboard/publishers', label: 'Penerbit', section: 'master' },
  { href: '/dashboard/shelves', label: 'Rak Buku', section: 'master' },
  { href: '/dashboard/staff', label: 'Kelola Petugas', section: 'admin', adminOnly: true },
  { href: '/dashboard/members', label: 'Anggota', section: 'library' },
  { href: '/dashboard/borrowings', label: 'Peminjaman', section: 'library' },
  { href: '/dashboard/returns', label: 'Pengembalian', section: 'library' },
  { href: '/dashboard/fines', label: 'Denda', section: 'library' },
  { href: '/dashboard/reports', label: 'Laporan', section: 'admin' },
  { href: '/dashboard/settings', label: 'Pengaturan', section: 'admin', adminOnly: true },
  { href: '/dashboard/audit-logs', label: 'Audit Log', section: 'admin', adminOnly: true },
];

const SECTION_LABEL: Record<NavItem['section'], string> = {
  main: '',
  master: 'Master Data',
  library: 'Perpustakaan',
  admin: 'Administrasi',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    authClient.getSession()
      .then(async (s) => {
        const u = (s as any)?.user ?? (s as any)?.data?.user ?? null;
        setUser(u);
        if (u?.id) {
          try {
            const res = await fetch('/api/auth/role');
            if (res.ok) {
              const d = await res.json();
              setRole(d.role ?? '');
            }
          } catch {
            // fallback below
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const isAdmin = role === 'admin';

  const visibleNav = NAV.filter((item) => {
    if (item.section === 'admin' && !item.adminOnly) return true; // reports visible to staff
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const sections = ['main', 'master', 'library', 'admin'] as const;
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Mobile top bar — hamburger + logo. */}
      <nav className="mobile-nav" style={{ justifyContent: 'space-between' }}>
        <Link href="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
          Dasbor
        </Link>
        <button
          className="mobile-hamburger"
          aria-label="Buka menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            borderRadius: 8,
            width: 38,
            height: 38,
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile drawer overlay. */}
      {drawerOpen && (
        <>
          <div className="hamburger-backdrop" onClick={closeDrawer} />
          <div className="hamburger-panel" role="dialog" aria-modal="true" aria-label="Menu navigasi">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Image src="/logo-tbm-semesta-alam-nav.png" alt="TBM Semesta Alam" width={1233} height={578} style={{ height: 26, width: 'auto' }} />
              <button aria-label="Tutup menu" onClick={closeDrawer} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {visibleNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeDrawer}
                  className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 12 }}>
              {user ? (
                <button
                  className="btn secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={async () => {
                    await signOut();
                    window.location.href = '/';
                  }}
                >
                  Keluar
                </button>
              ) : (
                <Link className="btn secondary" href="/login" style={{ width: '100%', justifyContent: 'center' }}>Masuk</Link>
              )}
            </div>
          </div>
        </>
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <aside className="sidebar" style={{ position: 'sticky', top: 0, height: '100vh', padding: 16, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
            <Link href="/dashboard" aria-label="TBM Semesta Alam — Dasbor" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, lineHeight: 0 }}>
              <Image src="/logo-tbm-semesta-alam-nav.png" alt="TBM Semesta Alam" width={1233} height={578} style={{ height: 28, width: 'auto' }} />
              <span style={{ lineHeight: 1.3 }}>TBM Semesta Alam</span>
            </Link>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            {sections.map((section) => {
              const items = visibleNav.filter((i) => i.section === section);
              if (items.length === 0) return null;
              return (
                <div key={section}>
                  {SECTION_LABEL[section] && (
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', margin: '0 0 6px', paddingLeft: 6 }}>
                      {SECTION_LABEL[section]}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                      >
                        {item.label}
                        {item.adminOnly && <span style={{ fontSize: 10, marginLeft: 'auto', opacity: 0.7 }}>admin</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8 }}>
            {loading ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat...</div>
            ) : user ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name ?? 'Pengguna'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user.email}</div>
                <button
                  className="btn secondary"
                  style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
                  onClick={async () => {
                    await signOut();
                    window.location.href = '/';
                  }}
                >
                  Keluar
                </button>
              </>
            ) : (
              <Link className="btn secondary" href="/login" style={{ width: '100%', justifyContent: 'center' }}>Masuk</Link>
            )}
          </div>
        </aside>

        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
}
