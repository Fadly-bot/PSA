'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BorrowButton from '@/components/borrow-button';

/**
 * Borrow action shown on the public book detail page:
 *  - member  → "Pinjam Buku" (disabled with "Stok Tidak Tersedia" when empty)
 *  - guest   → "Masuk" / "Daftar" prompts
 *  - staff/admin → nothing (they manage loans from the dashboard)
 */
export default function BorrowPanel({
  bookId,
  available,
  alreadyBorrowed,
}: {
  bookId: string;
  available: number;
  alreadyBorrowed?: boolean;
}) {
  const [role, setRole] = useState<'member' | 'staff' | 'guest' | 'loading'>('loading');

  useEffect(() => {
    fetch('/api/auth/role')
      .then((r) => r.json())
      .then((d) => {
        if (d?.authenticated && d?.role === 'member') setRole('member');
        else if (d?.authenticated) setRole('staff');
        else setRole('guest');
      })
      .catch(() => setRole('guest'));
  }, []);

  if (role === 'loading' || role === 'staff') return null;

  if (role === 'guest') {
    return (
      <div className="card" style={{ marginBottom: 20, background: 'var(--primary-light)', borderColor: 'var(--primary-100)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Ingin meminjam buku ini?</h2>
        <p style={{ margin: '0 0 12px', color: 'var(--text-subtle)', fontSize: 14 }}>
          Masuk atau daftar sebagai anggota untuk meminjam koleksi kami secara gratis.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/login" className="btn sm">
            Masuk
          </Link>
          <Link href="/register" className="btn secondary sm">
            Daftar Menjadi Anggota
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 20, borderColor: 'var(--primary-100)' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Pinjam Buku Ini</h2>
      <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 14 }}>
        {available > 0
          ? `${available} eksemplar tersedia untuk dipinjam.`
          : 'Semua eksemplar sedang dipinjam atau dalam perawatan.'}
      </p>
      <BorrowButton bookId={bookId} available={available > 0} alreadyBorrowed={alreadyBorrowed} />
      <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--muted)' }}>
        Setelah dipinjam, buku akan muncul di{' '}
        <Link href="/member/my-books" style={{ fontWeight: 700 }}>
          Buku Saya
        </Link>
        .
      </p>
    </div>
  );
}
