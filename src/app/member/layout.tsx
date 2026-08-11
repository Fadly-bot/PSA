'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { authClient, signOut } from '@/lib/auth-client';

type MemberLink = { href: string; label: string };

const LINKS: MemberLink[] = [
  { href: '/member', label: 'Beranda' },
  { href: '/member/books', label: 'Katalog Buku' },
  { href: '/member/my-books', label: 'Buku Saya' },
  { href: '/member/history', label: 'Riwayat' },
  { href: '/member/fines', label: 'Denda' },
  { href: '/member/profile', label: 'Profil' },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string } | null>(null);

  useEffect(() => {
    authClient
      .getSession()
      .then((s) => {
        const u = (s as any)?.user ?? (s as any)?.data?.user ?? null;
        setUser(u);
      })
      .catch(() => setUser(null));
  }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== '/member' && pathname.startsWith(href + '/'));

  const close = () => setOpen(false);

  const onLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const renderLinks = (withClose: boolean) =>
    LINKS.map((l) => (
      <Link
        key={l.href}
        href={l.href}
        onClick={withClose ? close : undefined}
        aria-current={isActive(l.href) ? 'page' : undefined}
        style={{
          padding: '9px 12px',
          borderRadius: 8,
          color: 'var(--text)',
          fontWeight: isActive(l.href) ? 700 : 500,
          background: isActive(l.href) ? 'var(--primary-light)' : 'transparent',
          whiteSpace: 'nowrap',
        }}
      >
        {l.label}
      </Link>
    ));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="public-nav">
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          <Link href="/member" aria-label="TBM Semesta Alam — Area Anggota" style={{ display: 'inline-flex', lineHeight: 0 }}>
            <Image src="/logo-tbm-semesta-alam-nav.png" alt="TBM Semesta Alam" width={1233} height={578} className="brand-logo" priority />
          </Link>

          {/* Desktop links */}
          <nav
            aria-label="Navigasi anggota"
            className="nav-links member-nav-links"
            style={{ gap: 4, alignItems: 'center', fontSize: 14, flexWrap: 'wrap', justifyContent: 'flex-end' }}
          >
            {renderLinks(false)}
            <button
              className="btn outline sm"
              onClick={onLogout}
              style={{ cursor: 'pointer', marginLeft: 6 }}
            >
              Keluar
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="nav-toggle"
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            aria-controls="member-mobile-menu"
            onClick={() => setOpen((v) => !v)}
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
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <nav
            id="member-mobile-menu"
            aria-label="Navigasi anggota mobile"
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '4px 16px 14px',
              gap: 2,
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
            }}
          >
            {renderLinks(true)}
            <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
            {user ? (
              <button className="btn outline" onClick={onLogout} style={{ justifyContent: 'center' }}>
                Keluar
              </button>
            ) : (
              <Link href="/login" className="btn outline" style={{ justifyContent: 'center' }}>
                Masuk
              </Link>
            )}
          </nav>
        )}
      </header>

      <main className="container" style={{ flex: 1, width: '100%' }}>
        {children}
      </main>

      <footer className="footer">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 14 }}>
          <div>© {new Date().getFullYear()} TBM Semesta Alam</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/books">Katalog</Link>
            <Link href="/member">Beranda</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
