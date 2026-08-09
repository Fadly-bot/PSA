'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type MasterItem = { id: string; name: string };
type Book = {
  id: string;
  title: string;
  isbn: string;
  description?: string | null;
  synopsis?: string | null;
  language?: string | null;
  publicationYear?: number | null;
  pages?: number | null;
  status: 'active' | 'inactive';
  coverImage?: string | null;
  author?: { id: string } | null;
  publisher?: { id: string } | null;
  category?: { id: string } | null;
};

export default function EditBookPage({ params }: { params: { id: string } }) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [authors, setAuthors] = useState<MasterItem[]>([]);
  const [publishers, setPublishers] = useState<MasterItem[]>([]);
  const [categories, setCategories] = useState<MasterItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/books/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) setNotFound(true);
          throw new Error('Gagal memuat data.');
        }
        const data = await res.json();
        if (!cancelled) setBook(data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Terjadi kesalahan.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [params.id]);

  useEffect(() => {
    Promise.all([
      fetch('/api/authors?limit=100').then((r) => r.json()),
      fetch('/api/publishers?limit=100').then((r) => r.json()),
      fetch('/api/categories?limit=100').then((r) => r.json()),
    ])
      .then(([a, p, c]) => {
        setAuthors(a.items ?? []);
        setPublishers(p.items ?? []);
        setCategories(c.items ?? []);
      })
      .catch(() => {});
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !book) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Format file tidak diizinkan. Gunakan JPG, JPEG, PNG, atau WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5 MB.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slug', book.title.trim() || 'cover');
      const res = await fetch('/api/books/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Gagal mengunggah cover.');
      setBook({ ...book, coverImage: data.url });
    } catch (err: any) {
      setError(err?.message ?? 'Gagal mengunggah cover.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const update = (patch: Partial<Book>) => setBook((prev) => (prev ? { ...prev, ...patch } : prev));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/books/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: book.title,
          isbn: book.isbn,
          description: book.description || null,
          synopsis: book.synopsis || null,
          language: book.language || null,
          publicationYear: book.publicationYear ?? null,
          pages: book.pages ?? null,
          authorId: book.author?.id ?? null,
          publisherId: book.publisher?.id ?? null,
          categoryId: book.category?.id ?? null,
          status: book.status,
          coverImage: book.coverImage || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Gagal menyimpan.');
      window.location.href = '/dashboard/books';
    } catch (err: any) {
      setError(err?.message ?? 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <div style={{ maxWidth: 860 }}>
        <div style={{ marginBottom: 16 }}><Link href="/dashboard/books" className="btn secondary">Kembali</Link></div>
        <div className="card" style={{ padding: 24 }}>Data buku tidak ditemukan.</div>
      </div>
    );
  }

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 };

  return (
    <div style={{ maxWidth: 860 }}>
      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Edit Buku</h1>
        <Link href="/dashboard/books" className="btn secondary">Kembali</Link>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 8 }}>{error}</div>}
        {loading ? (
          <div style={{ color: 'var(--muted)' }}>Memuat...</div>
        ) : book ? (
          <>
            <div className="form-grid form-grid-cover">
              <div>
                <label style={labelStyle}>Cover Buku</label>
                <div style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  {book.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.coverImage} alt="Preview cover" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 6 }} />
                  ) : (
                    <div style={{ color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>Belum ada cover</div>
                  )}
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} style={{ display: 'none' }} id="cover-input" />
                  <label htmlFor="cover-input" className="btn secondary" style={{ marginTop: 8, cursor: 'pointer', fontSize: 13, width: '100%', justifyContent: 'center' }}>
                    {uploading ? 'Mengunggah...' : 'Ganti Cover'}
                  </label>
                  {book.coverImage && (
                    <button type="button" className="btn secondary" style={{ marginTop: 6, width: '100%', justifyContent: 'center', fontSize: 13 }} onClick={() => update({ coverImage: null })}>
                      Hapus Cover
                    </button>
                  )}
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '6px 0 0' }}>JPG, JPEG, PNG, WebP. Maks 5 MB.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Judul *</label>
                  <input value={book.title} onChange={(e) => update({ title: e.target.value })} required minLength={3} maxLength={255} style={inputStyle} />
                </div>
                <div className="form-grid form-grid-2">
                  <div>
                    <label style={labelStyle}>ISBN *</label>
                    <input value={book.isbn} onChange={(e) => update({ isbn: e.target.value })} required maxLength={20} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Bahasa *</label>
                    <input value={book.language ?? ''} onChange={(e) => update({ language: e.target.value })} minLength={2} maxLength={50} style={inputStyle} />
                  </div>
                </div>
                <div className="form-grid form-grid-2">
                  <div>
                    <label style={labelStyle}>Tahun Terbit</label>
                    <input type="number" value={book.publicationYear ?? ''} onChange={(e) => update({ publicationYear: e.target.value ? Number(e.target.value) : null })} min={1000} max={new Date().getFullYear() + 1} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Jumlah Halaman</label>
                    <input type="number" value={book.pages ?? ''} onChange={(e) => update({ pages: e.target.value ? Number(e.target.value) : null })} min={1} style={inputStyle} />
                  </div>
                </div>
                <div className="form-grid form-grid-3">
                  <div>
                    <label style={labelStyle}>Penulis</label>
                    <select value={book.author?.id ?? ''} onChange={(e) => update({ author: e.target.value ? { id: e.target.value } : null })} style={inputStyle}>
                      <option value="">— Pilih —</option>
                      {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Penerbit</label>
                    <select value={book.publisher?.id ?? ''} onChange={(e) => update({ publisher: e.target.value ? { id: e.target.value } : null })} style={inputStyle}>
                      <option value="">— Pilih —</option>
                      {publishers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Kategori</label>
                    <select value={book.category?.id ?? ''} onChange={(e) => update({ category: e.target.value ? { id: e.target.value } : null })} style={inputStyle}>
                      <option value="">— Pilih —</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Status Katalog</label>
                  <select value={book.status} onChange={(e) => update({ status: e.target.value as 'active' | 'inactive' })} style={inputStyle}>
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Deskripsi</label>
              <textarea value={book.description ?? ''} onChange={(e) => update({ description: e.target.value })} rows={2} maxLength={5000} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Sinopsis</label>
              <textarea value={book.synopsis ?? ''} onChange={(e) => update({ synopsis: e.target.value })} rows={4} maxLength={5000} style={inputStyle} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Link href="/dashboard/books" className="btn secondary">Batal</Link>
              <button className="btn" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </>
        ) : null}
      </form>
    </div>
  );
}
