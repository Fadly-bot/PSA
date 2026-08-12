'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { authClient, signOut } from '@/lib/auth-client';

type NavItem = {
  href: string;
  label: string;
  section: 'main' | 'master' | 'library' | 'admin';
  adminOnly?: boolean;
  icon: string;
};

const ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  book: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20V4a2 2 0 00-2-2H6.5A2.5 2.5 0 004 4.5v15z" />
      <path d="M4 19.5A2.5 2.5 0 006.5 22H20v-5" />
    </svg>
  ),
  inventory: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" />
    </svg>
  ),
  source: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /><path d="M3 18l9 5 9-5" />
    </svg>
  ),
  category: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <circle cx="7" cy="7" r="1.5" />
    </svg>
  ),
  author: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  ),
  publisher: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 9h1M9 13h1M14 9h1M14 13h1M10 21v-4h4v4" />
    </svg>
  ),
  shelf: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3v18M20 3v18M4 8h16M4 16h16" />
    </svg>
  ),
  members: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  staff: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /><path d="M21 7v6M18 10h6" />
    </svg>
  ),
  borrowings: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3" />
      <path d="M8 12h8" />
    </svg>
  ),
  returns: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" /><path d="M3 13a9 9 0 109-9 9 9 0 00-6.7 3L3 7" />
    </svg>
  ),
  fines: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  ),
  reports: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" />
    </svg>
  ),
  settings: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  audit: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
};

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dasbor', section: 'main', icon: 'dashboard' },
  { href: '/dashboard/books', label: 'Katalog Buku', section: 'master', icon: 'book' },
  { href: '/dashboard/inventories', label: 'Inventaris Buku', section: 'master', icon: 'inventory' },
  { href: '/dashboard/book-sources', label: 'Sumber Buku', section: 'master', icon: 'source' },
  { href: '/dashboard/categories', label: 'Kategori', section: 'master', icon: 'category' },
  { href: '/dashboard/authors', label: 'Penulis', section: 'master', icon: 'author' },
  { href: '/dashboard/publishers', label: 'Penerbit', section: 'master', icon: 'publisher' },
  { href: '/dashboard/shelves', label: 'Rak Buku', section: 'master', icon: 'shelf' },
  { href: '/dashboard/staff', label: 'Kelola Petugas', section: 'admin', adminOnly: true, icon: 'staff' },
  { href: '/dashboard/members', label: 'Anggota', section: 'library', icon: 'members' },
  { href: '/dashboard/borrowings', label: 'Peminjaman', section: 'library', icon: 'borrowings' },
  { href: '/dashboard/returns', label: 'Pengembalian', section: 'library', icon: 'returns' },
  { href: '/dashboard/fines', label: 'Denda', section: 'library', icon: 'fines' },
  { href: '/dashboard/reports', label: 'Laporan', section: 'admin', icon: 'reports' },
  { href: '/dashboard/settings', label: 'Pengaturan', section: 'admin', adminOnly: true, icon: 'settings' },
  { href: '/dashboard/audit-logs', label: 'Audit Log', section: 'admin', adminOnly: true, icon: 'audit' },
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
    authClient
      .getSession()
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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');
  const isAdmin = role === 'admin';
  const isStaff = isAdmin || role === 'staff';

  const visibleNav = NAV.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  const sections = ['main', 'master', 'library', 'admin'] as const;
  const closeDrawer = () => setDrawerOpen(false);

  const onLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const renderNavLinks = (items: NavItem[]) =>
    items.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        onClick={closeDrawer}
        aria-current={isActive(item.href) ? 'page' : undefined}
        className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
      >
        <span className="nav-icon" aria-hidden="true">
          {ICONS[item.icon] ?? ICONS.dashboard}
        </span>
        <span className="nav-label">{item.label}</span>
        {item.adminOnly && (
          <span className="nav-admin-tag">admin</span>
        )}
      </Link>
    ));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Mobile top bar — hamburger + brand. */}
      <nav className="mobile-nav" style={{ justifyContent: 'space-between' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Image
            src="/logo-tbm-semesta-alam-nav.png"
            alt="TBM Semesta Alam"
            width={1233}
            height={578}
            style={{ height: 24, width: 'auto' }}
          />
        </Link>
        <button
          className="mobile-hamburger"
          aria-label="Buka menu navigasi"
          aria-expanded={drawerOpen}
          aria-controls="dashboard-drawer"
          onClick={() => setDrawerOpen(true)}
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            borderRadius: 8,
            width: 40,
            height: 40,
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
          <div
            id="dashboard-drawer"
            className="hamburger-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Image
                src="/logo-tbm-semesta-alam-nav.png"
                alt="TBM Semesta Alam"
                width={1233}
                height={578}
                style={{ height: 26, width: 'auto' }}
              />
              <button
                aria-label="Tutup menu"
                onClick={closeDrawer}
                style={{ border: 'none', background: 'transparent', fontSize: 24, cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sections.map((section) => {
                const items = visibleNav.filter((i) => i.section === section);
                if (items.length === 0) return null;
                return (
                  <div key={section}>
                    {SECTION_LABEL[section] && (
                      <div className="nav-section-label">{SECTION_LABEL[section]}</div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {renderNavLinks(items)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 12 }}>
              {user ? (
                <button className="btn secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onLogout}>
                  Keluar
                </button>
              ) : (
                <Link className="btn secondary" href="/login" style={{ width: '100%', justifyContent: 'center' }}>
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </>
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <aside className="sidebar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Link
              href="/dashboard"
              aria-label="TBM Semesta Alam — Dasbor"
              style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, lineHeight: 0 }}
            >
              <Image
                src="/logo-tbm-semesta-alam-nav.png"
                alt="TBM Semesta Alam"
                width={1233}
                height={578}
                style={{ height: 30, width: 'auto' }}
              />
            </Link>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }} aria-label="Navigasi utama">
            {sections.map((section) => {
              const items = visibleNav.filter((i) => i.section === section);
              if (items.length === 0) return null;
              return (
                <div key={section}>
                  {SECTION_LABEL[section] && (
                    <div className="nav-section-label">{SECTION_LABEL[section]}</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {renderNavLinks(items)}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Sidebar footer — user profile + logout */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 8 }}>
            {loading ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat...</div>
            ) : user ? (
              <div className="sidebar-profile">
                <div className="sidebar-avatar" aria-hidden="true">
                  {(user.name ?? 'U').slice(0, 1).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.name ?? 'Pengguna'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {role === 'admin' ? 'Admin' : isStaff ? 'Petugas' : user.email}
                  </div>
                </div>
                <button
                  aria-label="Keluar dari akun"
                  title="Keluar"
                  className="btn outline"
                  style={{ padding: 6, width: 34, height: 34, justifyContent: 'center', flexShrink: 0 }}
                  onClick={onLogout}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <path d="M16 17l5-5-5-5M21 12H9" />
                  </svg>
                </button>
              </div>
            ) : (
              <Link className="btn secondary" href="/login" style={{ width: '100%', justifyContent: 'center' }}>
                Masuk
              </Link>
            )}
          </div>
        </aside>

        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
