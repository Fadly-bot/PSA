'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import BookCover from '@/components/book-cover';
import BorrowButton from '@/components/borrow-button';

type Book = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  publicationYear: number | null;
  availableInventory: number;
  totalInventory: number;
  author?: { name?: string | null } | null;
  category?: { name?: string | null } | null;
  publisher?: { name?: string | null } | null;
};

export default function MemberBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [borrowedBookIds, setBorrowedBookIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [inputQ, setInputQ] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBorrowings = useCallback(async () => {
    try {
      const res = await fetch('/api/borrowings?limit=100');
      if (!res.ok) return;
      const d = await res.json();
      const ids = new Set<string>();
      const today = new Date().toISOString().slice(0, 10);
      for (const b of d.items ?? []) {
        // Active = borrowed (including overdue past the due date).
        if (b.status === 'borrowed' && b.dueDate >= today) {
          for (const item of b.items ?? []) if (item.bookId) ids.add(item.bookId);
        }
      }
      setBorrowedBookIds(ids);
    } catch {
      // ignore — buttons just stay enabled
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ limit: '100', includeInventories: '0' });
    if (q) params.set('q', q);
    if (category) params.set('category', category);

    fetch(`/api/books?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.error) throw new Error(d.error);
        setBooks(d.items ?? []);
        setTotal(Number(d.total ?? 0));
      })
      .catch((e: any) => setError(e?.message ?? 'Gagal memuat katalog.'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q, category]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        const list = Array.isArray(d) ? d : d?.items ?? [];
        setCategories(list.map((c: any) => ({ id: c.id, name: c.name })));
      })
      .catch(() => setCategories([]));
    loadBorrowings();
  }, [loadBorrowings]);

  const onBorrowed = () => loadBorrowings();

  return (
    <div>
      <div className="section-header" style={{ marginTop: 8 }}>
        <div>
          <h2>Katalog Buku</h2>
          <p>{total} judul buku tersedia untuk dipinjam.</p>
        </div>
      </div>

      {/* Search + category filter */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQ(inputQ.trim());
        }}
        className="card"
        style={{ padding: 14, marginBottom: 20 }}
        role="search"
      >
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            type="search"
            name="q"
            value={inputQ}
            onChange={(e) => setInputQ(e.target.value)}
            placeholder="Cari judul, penulis, atau ISBN..."
            aria-label="Cari buku"
            style={{ flex: '1 1 200px', minWidth: 0 }}
          />
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter kategori"
            style={{ width: 'auto', flex: '0 1 200px' }}
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn">
            Cari
          </button>
          {(q || category) && (
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setQ('');
                setInputQ('');
                setCategory('');
              }}
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="grid grid-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="book-card" style={{ padding: 0 }}>
              <div className="cover">
                <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
              </div>
              <div className="body">
                <div className="skeleton" style={{ height: 10, width: '40%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '85%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state" style={{ padding: 48 }}>
          <div className="icon">⚠️</div>
          <p className="title">Gagal memuat katalog</p>
          <p>{error}</p>
          <button className="btn secondary sm" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
            Coba lagi
          </button>
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state" style={{ padding: 48 }}>
          <div className="icon">🔍</div>
          <p className="title">{q || category ? 'Tidak ada buku yang cocok' : 'Belum ada buku yang tersedia'}</p>
          <p>{q || category ? 'Coba ubah kata kunci atau filter pencarian Anda.' : 'Silakan kembali lagi nanti.'}</p>
          {(q || category) && (
            <button
              className="btn secondary sm"
              style={{ marginTop: 12 }}
              onClick={() => {
                setQ('');
                setInputQ('');
                setCategory('');
              }}
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-4">
          {books.map((b) => {
            const alreadyBorrowed = borrowedBookIds.has(b.id);
            const hasStock = (b.availableInventory ?? 0) > 0;
            return (
              <div key={b.id} className="book-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="cover">
                  <Link href={`/books/${b.slug}`} aria-label={`Lihat detail ${b.title}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                    <BookCover src={b.coverImage} alt={`Sampul buku ${b.title}`} title={b.title} />
                  </Link>
                  {/* Hover action (desktop only). */}
                  <div className="cover-overlay">
                    <BorrowButton
                      bookId={b.id}
                      available={hasStock}
                      alreadyBorrowed={alreadyBorrowed}
                      block
                      onBorrowed={onBorrowed}
                    />
                  </div>
                </div>
                <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  {b.category?.name && <p className="category">{b.category.name}</p>}
                  <Link href={`/books/${b.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3 className="title">{b.title}</h3>
                  </Link>
                  <p className="meta">
                    {b.author?.name ?? '—'}
                    {b.publicationYear ? ` · ${b.publicationYear}` : ''}
                  </p>
                  <div className="availability" style={{ marginBottom: 8 }}>
                    {hasStock ? (
                      <span className="yes">✓ Tersedia ({b.availableInventory})</span>
                    ) : (
                      <span className="no">Stok kosong</span>
                    )}
                  </div>
                  {/* Always-visible borrow button (esp. mobile — no hover). */}
                  <div style={{ marginTop: 'auto' }}>
                    <BorrowButton
                      bookId={b.id}
                      available={hasStock}
                      alreadyBorrowed={alreadyBorrowed}
                      block
                      onBorrowed={onBorrowed}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
