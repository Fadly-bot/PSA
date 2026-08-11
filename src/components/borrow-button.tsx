'use client';

import { useState } from 'react';

type Toast = { type: 'success' | 'error'; message: string } | null;

/**
 * "Pinjam Buku" button for members. Uses the existing borrowing API
 * (POST /api/borrowings with `bookId`) — the server resolves an available
 * copy and applies the library loan rules. Works on hover overlays AND as an
 * always-visible button on mobile.
 */
export default function BorrowButton({
  bookId,
  available,
  alreadyBorrowed = false,
  variant = 'primary',
  block = true,
  onBorrowed,
}: {
  bookId: string;
  /** Whether the book currently has at least one available copy. */
  available: boolean;
  /** Disable when the member is already borrowing this book. */
  alreadyBorrowed?: boolean;
  variant?: 'primary' | 'secondary';
  block?: boolean;
  /** Called after a successful borrow so the parent can refresh. */
  onBorrowed?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (t: Toast) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 4000);
  };

  const disabled = loading || !available || alreadyBorrowed;

  let label = 'Pinjam Buku';
  if (alreadyBorrowed) label = 'Sedang Dipinjam';
  else if (!available) label = 'Stok Tidak Tersedia';

  const onClick = async () => {
    if (disabled) return;
    setLoading(true);
    try {
      const res = await fetch('/api/borrowings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      });
      if (res.status === 201) {
        showToast({ type: 'success', message: 'Buku berhasil dipinjam! 🎉' });
        onBorrowed?.();
      } else {
        let message = 'Gagal meminjam buku.';
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // keep default
        }
        const friendly: Record<string, string> = {
          INVENTORY_NOT_AVAILABLE: 'Stok buku sedang tidak tersedia.',
          INVENTORY_ALREADY_BORROWED: 'Buku ini sedang dipinjam.',
          MEMBER_BLOCKED: 'Profil anggota tidak aktif.',
          MAX_BORROW_LIMIT: 'Maksimal 3 buku per peminjaman.',
        };
        for (const [key, label] of Object.entries(friendly)) {
          if (message.includes(key)) {
            message = label;
            break;
          }
        }
        if (res.status === 401) message = 'Sesi berakhir. Silakan masuk kembali.';
        showToast({ type: 'error', message });
      }
    } catch {
      showToast({ type: 'error', message: 'Gagal terhubung ke server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`btn ${variant === 'secondary' ? 'secondary' : ''}`}
        onClick={onClick}
        disabled={disabled}
        aria-disabled={disabled}
        style={{ width: block ? '100%' : 'auto', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Memproses...' : label}
      </button>
      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
    </>
  );
}
