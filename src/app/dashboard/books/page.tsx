'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Book = {
  id: string;
  title: string;
  isbn?: string | null;
  publishedYear?: number | null;
  category?: { name: string } | null;
  author?: { name: string } | null;
  publisher?: { name: string } | null;
};

export default function BooksPage() {
  const [items, setItems] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/books')
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Katalog Buku</h1>
        <button className="btn">+ Tambah Buku</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Kategori</th>
                <th>Penulis</th>
                <th>Penerbit</th>
                <th>Tahun</th>
                <th>ISBN</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.title}</td>
                  <td>{b.category?.name ?? '—'}</td>
                  <td>{b.author?.name ?? '—'}</td>
                  <td>{b.publisher?.name ?? '—'}</td>
                  <td>{b.publishedYear ?? '—'}</td>
                  <td style={{ color: 'var(--muted)' }}>{b.isbn ?? '—'}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>Belum ada data buku.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
