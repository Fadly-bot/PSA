'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type Inventory = {
  id: string;
  inventoryCode: string;
  condition: string;
  status: string;
  notes?: string | null;
};

type Book = {
  id: string;
  title: string;
  isbn?: string | null;
  slug: string;
  publicationYear?: number | null;
  language?: string | null;
  status: string;
  coverImage?: string | null;
  author?: { id: string; name: string } | null;
  publisher?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  totalInventory?: number;
  availableInventory?: number;
  inventories?: Inventory[];
};

type MasterItem = { id: string; name: string };

export default function BooksPage() {
  const [items, setItems] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<MasterItem[]>([]);
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingInventories, setLoadingInventories] = useState<Set<string>>(new Set());

  const load = useCallback(async (pageNum: number, opts?: { query?: string; categoryId?: string; status?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/books', window.location.origin);
      if (opts?.query) url.searchParams.set('q', opts.query);
      if (opts?.categoryId) url.searchParams.set('category', opts.categoryId);
      url.searchParams.set('status', opts?.status ?? 'active');
      url.searchParams.set('page', String(pageNum));
      url.searchParams.set('limit', '10');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Gagal memuat data.');
      const data = await res.json();
      setItems(data.items ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
      setPage(data.page ?? pageNum);
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  useEffect(() => {
    fetch('/api/categories?limit=100')
      .then((r) => r.json())
      .then((d) => setCategories(d.items ?? []))
      .catch(() => {});
  }, []);

  const toggleExpand = async (bookId: string) => {
    const next = new Set(expanded);
    if (next.has(bookId)) {
      next.delete(bookId);
      setExpanded(next);
      return;
    }
    next.add(bookId);
    setExpanded(next);
    // Fetch the inventories for this book.
    setLoadingInventories((prev) => new Set(prev).add(bookId));
    try {
      const res = await fetch(`/api/books/${bookId}`);
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => prev.map((b) => (b.id === bookId ? { ...b, inventories: data.inventories ?? [] } : b)));
      }
    } catch {
      // keep existing inventories
    } finally {
      setLoadingInventories((prev) => {
        const nextSet = new Set(prev);
        nextSet.delete(bookId);
        return nextSet;
      });
    }
  };

  const onDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus buku "${title}"? (soft delete)`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Gagal menghapus.');
      }
      setItems((prev) => prev.filter((b) => b.id !== id));
      setTotal((t) => t - 1);
    } catch (e: any) {
      alert(e?.message ?? 'Gagal menghapus.');
    } finally {
      setDeletingId(null);
    }
  };

  const statusLabel = (s: string) => (s === 'active' ? 'Aktif' : 'Nonaktif');
  const inventoryStatusLabel = (s: string) =>
    ({ available: 'Tersedia', borrowed: 'Dipinjam', maintenance: 'Perawatan', lost: 'Hilang' })[s] ?? s;
  const conditionLabel = (c: string) => ({ good: 'Baik', damaged: 'Rusak', lost: 'Hilang' })[c] ?? c;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Katalog Buku</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Total {total} judul</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/dashboard/inventories" className="btn secondary">Kelola Inventaris</Link>
          <Link href="/dashboard/books/new" className="btn">+ Tambah Buku</Link>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Cari judul / ISBN / penulis..."
            defaultValue={q}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setQ((e.target as HTMLInputElement).value);
                load(1, { query: (e.target as HTMLInputElement).value, categoryId: category, status });
              }
            }}
            style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, minWidth: 240, flex: 1 }}
          />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              load(1, { query: q, categoryId: e.target.value, status });
            }}
            style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6 }}
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              load(1, { query: q, categoryId: category, status: e.target.value });
            }}
            style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6 }}
          >
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        {error ? (
          <div style={{ padding: 24, color: 'crimson' }}>{error}</div>
        ) : loading ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Belum ada data buku.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Judul</th>
                <th>Kategori</th>
                <th>Penulis</th>
                <th>Penerbit</th>
                <th>ISBN</th>
                <th>Stok</th>
                <th>Status</th>
                <th style={{ width: 200 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => {
                const isExpanded = expanded.has(b.id);
                const isLoadingInv = loadingInventories.has(b.id);
                return (
                  <FragmentRow
                    key={b.id}
                    book={b}
                    isExpanded={isExpanded}
                    isLoadingInv={isLoadingInv}
                    onToggle={() => toggleExpand(b.id)}
                    onDelete={() => onDelete(b.id, b.title)}
                    deleting={deletingId === b.id}
                    statusLabel={statusLabel}
                    inventoryStatusLabel={inventoryStatusLabel}
                    conditionLabel={conditionLabel}
                  />
                );
              })}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div style={{ padding: 12, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Halaman {page} dari {totalPages}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn secondary" disabled={page <= 1} onClick={() => load(page - 1)}>Sebelum</button>
              <button className="btn secondary" disabled={page >= totalPages} onClick={() => load(page + 1)}>Berikut</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FragmentRow({
  book,
  isExpanded,
  isLoadingInv,
  onToggle,
  onDelete,
  deleting,
  statusLabel,
  inventoryStatusLabel,
  conditionLabel,
}: {
  book: Book;
  isExpanded: boolean;
  isLoadingInv: boolean;
  onToggle: () => void;
  onDelete: () => void;
  deleting: boolean;
  statusLabel: (s: string) => string;
  inventoryStatusLabel: (s: string) => string;
  conditionLabel: (s: string) => string;
}) {
  return (
    <>
      <tr>
        <td>
          <button className="btn secondary" onClick={onToggle} style={{ padding: '4px 8px', fontSize: 12 }} title={isExpanded ? 'Tutup' : 'Lihat inventaris'}>
            {isExpanded ? '−' : '+'}
          </button>
        </td>
        <td style={{ fontWeight: 600 }}>
          <Link href={`/books/${book.slug}`}>{book.title}</Link>
        </td>
        <td>{book.category?.name ?? '—'}</td>
        <td>{book.author?.name ?? '—'}</td>
        <td>{book.publisher?.name ?? '—'}</td>
        <td style={{ color: 'var(--muted)' }}>{book.isbn ?? '—'}</td>
        <td>
          <span style={{ fontWeight: 600 }}>{book.availableInventory ?? 0}</span>
          <span style={{ color: 'var(--muted)' }}> / {book.totalInventory ?? 0}</span>
        </td>
        <td><span className="badge">{statusLabel(book.status)}</span></td>
        <td>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/dashboard/books/${book.id}/edit`} className="btn secondary">Edit</Link>
            <button className="btn secondary" onClick={onDelete} disabled={deleting}>
              {deleting ? '...' : 'Hapus'}
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={9} style={{ background: '#f8fafc', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong style={{ fontSize: 13 }}>Inventaris (eksemplar)</strong>
              <Link href={`/dashboard/inventories/new?bookId=${book.id}`} className="btn" style={{ padding: '6px 10px', fontSize: 12 }}>+ Inventaris</Link>
            </div>
            {isLoadingInv ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Memuat inventaris...</div>
            ) : !book.inventories || book.inventories.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 13 }}>Belum ada eksemplar untuk judul ini.</div>
            ) : (
              <table className="table" style={{ fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Kode Inventaris</th>
                    <th>Kondisi</th>
                    <th>Status</th>
                    <th>Catatan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {book.inventories.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600 }}>{inv.inventoryCode}</td>
                      <td>{conditionLabel(inv.condition)}</td>
                      <td><span className="badge">{inventoryStatusLabel(inv.status)}</span></td>
                      <td style={{ color: 'var(--muted)' }}>{inv.notes ?? '—'}</td>
                      <td>
                        <Link href={`/dashboard/inventories/${inv.id}/edit`} className="btn secondary" style={{ padding: '4px 8px', fontSize: 12 }}>Edit</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
