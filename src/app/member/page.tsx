'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BookCover from '@/components/book-cover';
import StatusBadge, { BORROW_STATUS_LABEL, BORROW_STATUS_TONE } from '@/components/status-badge';
import { authClient } from '@/lib/auth-client';

type Stats = Record<string, string | number>;

type MemberProfile = {
  memberCode: string;
  joinDate: string;
  status: boolean;
};

type BorrowItem = {
  bookId: string;
  bookSlug: string;
  bookTitle: string;
  coverImage: string | null;
  inventoryCode: string;
};

type Borrowing = {
  id: string;
  borrowCode: string;
  borrowDate: string;
  dueDate: string;
  status: string;
  items?: BorrowItem[];
};

type Book = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  publicationYear: number | null;
  availableInventory: number;
  author?: { name?: string | null } | null;
  category?: { name?: string | null } | null;
};

function effectiveStatus(b: Borrowing): string {
  if (b.status === 'borrowed' && b.dueDate < new Date().toISOString().slice(0, 10)) {
    return 'overdue';
  }
  return b.status;
}

const STATUS_LABEL = BORROW_STATUS_LABEL;
const STATUS_TONE = BORROW_STATUS_TONE;

export default function MemberHomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [active, setActive] = useState<Borrowing[]>([]);
  const [recent, setRecent] = useState<Borrowing[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name?: string } | null>(null);

  useEffect(() => {
    authClient
      .getSession()
      .then((s) => {
        const u = (s as any)?.user ?? (s as any)?.data?.user ?? null;
        setUser(u);
      })
      .catch(() => setUser(null));

    Promise.all([
      fetch('/api/dashboard').then((r) => r.json()),
      fetch('/api/members/me').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/borrowings?limit=100').then((r) => r.json()),
      fetch('/api/books?limit=4&includeInventories=0').then((r) => r.json()),
    ])
      .then(([dash, me, brw, books]) => {
        if (dash?.error) throw new Error(dash.error);
        setStats(dash.stats ?? {});
        setRecent(dash.recentBorrowings ?? []);
        setProfile(me?.memberCode ? me : null);

        const all = (brw?.items ?? []) as Borrowing[];
        // Active = borrowed (including overdue past the due date).
        const activeOnes = all.filter(
          (b) => b.status === 'borrowed' || b.status === 'overdue',
        );
        setActive(activeOnes);

        const rec = (books?.items ?? []) as Book[];
        // Prefer books with available stock for the recommendation row.
        rec.sort((a, b) => Number(b.availableInventory ?? 0) - Number(a.availableInventory ?? 0));
        setRecommendations(rec.slice(0, 4));
      })
      .catch((e: any) => setError(e?.message ?? 'Gagal memuat data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 30, width: 240, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: 300, marginBottom: 20 }} />
        <div className="grid grid-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
        <p className="title">Gagal memuat data</p>
        <p>{error}</p>
        <button className="btn secondary sm" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
          Coba lagi
        </button>
      </div>
    );
  }

  const firstName = (user?.name ?? '').trim().split(/\s+/)[0] || 'Anggota';
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Nearest due date among currently borrowed books (REF1 "Tenggat Waktu").
  // Derived from the most recent 100 borrowings — sufficient for a dashboard
  // widget; the full history remains accurate on /member/my-books.
  const dueDates = active
    .map((b) => b.dueDate)
    .filter(Boolean)
    .sort();
  const nearestDue = dueDates[0];
  const nearestDueLabel = nearestDue
    ? new Date(`${nearestDue}T00:00:00`).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Tidak ada';

  const joinYear = profile?.joinDate ? new Date(`${profile.joinDate}T00:00:00`).getFullYear() : null;

  const cards = [
    {
      label: 'Buku Dipinjam',
      value: stats?.activeBorrowings ?? 0,
      href: '/member/my-books',
      icon: 'book',
      tone: 'info',
    },
    {
      label: 'Tenggat Waktu',
      value: nearestDueLabel,
      href: '/member/my-books',
      icon: 'clock',
      tone: 'accent',
    },
    {
      label: 'Riwayat Peminjaman',
      value: stats?.totalBorrowings ?? 0,
      href: '/member/history',
      icon: 'history',
      tone: '',
    },
    {
      label: 'Denda Aktif',
      value: typeof stats?.fineTotal === 'string' ? stats.fineTotal : 'Rp 0',
      href: '/member/fines',
      icon: 'coin',
      tone: 'error',
    },
  ];

  const cardIcons: Record<string, React.ReactNode> = {
    book: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20V4a2 2 0 00-2-2H6.5A2.5 2.5 0 004 4.5v15z" />
        <path d="M4 19.5A2.5 2.5 0 006.5 22H20v-5" />
      </svg>
    ),
    clock: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    history: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v5h5" />
        <path d="M3.05 13A9 9 0 106 5.3L3 8" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
    coin: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/member/books?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div>
      {/* Greeting + member card (REF1 header & profile). */}
      <div
        className="card"
        style={{
          marginTop: 8,
          marginBottom: 20,
          padding: '22px 24px',
          background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
          border: 'none',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 700 }}>{today}</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: '2px 0 0', lineHeight: 1.2 }}>
            Halo, {firstName}! 👋
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.92 }}>
            Selamat datang kembali di area anggota. Nikmati membaca!
          </p>
        </div>
        <Link
          href="/member/books"
          className="btn"
          style={{ background: '#fff', color: 'var(--primary-dark)', flexShrink: 0 }}
        >
          Cari Buku
        </Link>
      </div>

      {/* Kartu Anggota (REF1) + search. */}
      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <div
          className="card"
          style={{
            padding: 18,
            background: 'var(--primary-dark)',
            border: 'none',
            color: '#fff',
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 150,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', right: -40, top: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} aria-hidden="true" />
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.75 }}>
              Kartu Anggota
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginTop: 4, letterSpacing: '0.02em' }}>
              {profile?.memberCode ?? '—'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              className="badge"
              style={{
                background: profile?.status === false ? 'var(--danger-bg)' : 'rgba(255,255,255,0.16)',
                color: profile?.status === false ? 'var(--danger)' : '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              {profile?.status === false ? 'Nonaktif' : 'Aktif'}
            </span>
            {joinYear && (
              <span style={{ fontSize: 13, opacity: 0.8 }}>Anggota sejak {joinYear}</span>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Cari Buku
          </div>
          <form onSubmit={handleSearch} role="search" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="search"
              name="q"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul, penulis, atau ISBN..."
              aria-label="Cari buku"
              style={{ flex: '1 1 180px', minWidth: 0 }}
            />
            <button type="submit" className="btn">
              Cari
            </button>
          </form>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '10px 0 0' }}>
            Telusuri seluruh koleksi, lihat ketersediaan, dan pinjam langsung.
          </p>
        </div>
      </div>

      <div className="section-header">
        <div>
          <h2>Ringkasan Aktivitas</h2>
          <p>Ringkasan aktivitas membaca dan peminjaman Anda.</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className={`icon ${c.tone}`}>{cardIcons[c.icon]}</span>
            <div style={{ minWidth: 0 }}>
              <p className="label">{c.label}</p>
              <p className="value" style={{ fontSize: c.icon === 'clock' ? 22 : undefined }}>
                {c.value}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Buku yang sedang dipinjam (REF1) — covers + status. */}
      <div className="card" style={{ padding: 0, marginBottom: 24 }}>
        <div className="section-header" style={{ padding: '14px 16px', margin: 0, borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: 18 }}>Buku yang Sedang Dipinjam</h2>
          </div>
          <Link href="/member/my-books" className="btn secondary sm">Lihat Semua →</Link>
        </div>
        {active.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="icon">📚</div>
            <p className="title">Tidak ada buku yang sedang dipinjam</p>
            <p>Jelajahi katalog dan pinjam buku pertama Anda.</p>
            <Link href="/member/books" className="btn sm" style={{ marginTop: 12 }}>
              Lihat Katalog
            </Link>
          </div>
        ) : (
          <div style={{ padding: '4px 16px 16px' }}>
            {active.slice(0, 4).map((b) => {
              const item = b.items?.[0];
              const st = effectiveStatus(b);
              return (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'center',
                    padding: '12px 4px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <Link href={`/books/${item?.bookSlug ?? ''}`} style={{ width: 44, flexShrink: 0, display: 'block' }}>
                    <div style={{ aspectRatio: '2/3', borderRadius: 6, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                      <BookCover src={item?.coverImage} alt={item?.bookTitle ?? 'Buku'} title={item?.bookTitle} />
                    </div>
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/books/${item?.bookSlug ?? ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.35 }}>{item?.bookTitle ?? b.borrowCode}</div>
                    </Link>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      {b.borrowCode} · Jatuh tempo {b.dueDate}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <StatusBadge status={st} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rekomendasi Buku (REF1). */}
      {recommendations.length > 0 && (
        <section style={{ marginBottom: 28 }}>
          <div className="section-header" style={{ marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 20 }}>Rekomendasi untuk Anda</h2>
              <p style={{ margin: 0 }}>Koleksi pilihan untuk dibaca berikutnya.</p>
            </div>
            <Link href="/member/books" className="btn secondary sm">Lihat Semua →</Link>
          </div>
          <div className="grid grid-4">
            {recommendations.map((b) => (
              <Link key={b.id} href={`/books/${b.slug}`} className="book-card">
                <div className="cover">
                  <BookCover src={b.coverImage} alt={`Sampul buku ${b.title}`} title={b.title} />
                </div>
                <div className="body">
                  {b.category?.name && <p className="category">{b.category.name}</p>}
                  <h3 className="title">{b.title}</h3>
                  <p className="meta">
                    {b.author?.name ?? '—'}
                    {b.publicationYear ? ` · ${b.publicationYear}` : ''}
                  </p>
                  <div className="availability">
                    {(b.availableInventory ?? 0) > 0 ? (
                      <span className="yes">✓ Tersedia ({b.availableInventory})</span>
                    ) : (
                      <span className="no">Stok kosong</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent borrowings table (kept — quick activity log). */}
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div className="section-header" style={{ padding: '14px 16px', margin: 0, borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: 18 }}>Riwayat Peminjaman Terbaru</h2>
          </div>
          <Link href="/member/history" className="btn secondary sm">Riwayat Lengkap →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="icon">🗂️</div>
            <p className="title">Belum ada riwayat peminjaman</p>
            <p>Setiap peminjaman dan pengembalian akan tercatat di sini.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>No Pinjam</th>
                <th>Tgl Pinjam</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.borrowCode}</td>
                  <td>{b.borrowDate}</td>
                  <td>{b.dueDate}</td>
                  <td>
                    <span className={`badge ${STATUS_TONE[b.status] ?? 'neutral'}`}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
