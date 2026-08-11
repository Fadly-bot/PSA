'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { authClient, signOut } from '@/lib/auth-client';

type NavLink = { href: string; label: string };

const GUEST_LINKS: NavLink[] = [
  { href: '/', label: 'Beranda' },
  { href: '/books', label: 'Katalog' },
];

/** Links shown to logged-in members (browse + self-service). */
const MEMBER_LINKS: NavLink[] = [
  { href: '/', label: 'Beranda' },
  { href: '/books', label: 'Katalog Buku' },
  { href: '/member/my-books', label: 'Buku Saya' },
  { href: '/member', label: 'Area Anggota' },
];

/** Links shown to staff/admin. */
const STAFF_LINKS: NavLink[] = [
  { href: '/', label: 'Beranda' },
  { href: '/books', label: 'Katalog' },
];

export default function PublicNavbar({ active }: { active?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [role, setRole] = useState<string>('');
  const [checked, setChecked] = useState(false);

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
            // ignore — dashboard link fallback
          }
        }
      })
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
  }, []);

  const isMember = role === 'member';
  const links = !user ? GUEST_LINKS : isMember ? MEMBER_LINKS : STAFF_LINKS;

  const isActive = (href: string) =>
    (active ?? pathname) === href || (href !== '/' && (active ?? pathname).startsWith(href));

  const close = () => setOpen(false);

  const onLogout = async () => {
    await signOut();
    close();
    window.location.href = '/';
  };

  return (
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
        <Link href="/" aria-label="TBM Semesta Alam — Beranda" style={{ display: 'inline-flex', lineHeight: 0 }}>
          <Image src="/logo-tbm-semesta-alam-nav.png" alt="TBM Semesta Alam" width={1233} height={578} className="brand-logo" priority />
        </Link>

        {/* Desktop links */}
        <nav className="nav-links" aria-label="Navigasi utama" style={{ gap: 16, alignItems: 'center', fontSize: 14, flexWrap: 'wrap' }}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} style={{ color: 'var(--text)', fontWeight: isActive(l.href) ? 700 : 500 }}>
              {l.label}
            </Link>
          ))}
          {checked && user ? (
            <>
              {!isMember && (
                <Link href="/dashboard" style={{ color: 'var(--text)', fontWeight: 600 }}>
                  Dasbor
                </Link>
              )}
              <button className="btn outline sm" onClick={onLogout} style={{ cursor: 'pointer' }}>
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: 'var(--text)', fontWeight: 500 }}>
                Masuk
              </Link>
              <Link href="/register" className="btn sm" style={{ padding: '8px 14px' }}>
                Daftar
              </Link>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="nav-toggle"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          aria-controls="public-mobile-menu"
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
          id="public-mobile-menu"
          aria-label="Navigasi mobile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '4px 16px 14px',
            gap: 2,
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                color: 'var(--text)',
                fontWeight: isActive(l.href) ? 700 : 500,
                background: isActive(l.href) ? 'var(--primary-light)' : 'transparent',
              }}
            >
              {l.label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
          {checked && user ? (
            <>
              {!isMember && (
                <Link href="/dashboard" onClick={close} style={{ padding: '10px 12px', borderRadius: 8, color: 'var(--text)', fontWeight: 600 }}>
                  Dasbor
                </Link>
              )}
              <button className="btn outline" onClick={onLogout} style={{ marginTop: 6, justifyContent: 'center' }}>
                Keluar
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <Link href="/login" onClick={close} className="btn outline" style={{ flex: 1, justifyContent: 'center' }}>
                Masuk
              </Link>
              <Link href="/register" onClick={close} className="btn" style={{ flex: 1, justifyContent: 'center' }}>
                Daftar
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
