'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type MasterItem = { id: string; name: string };

export default function NewBookPage() {
  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [description, setDescription] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [language, setLanguage] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [pages, setPages] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [publisherId, setPublisherId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [stock, setStock] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const [authors, setAuthors] = useState<MasterItem[]>([]);
  const [publishers, setPublishers] = useState<MasterItem[]>([]);
  const [categories, setCategories] = useState<MasterItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (!file) return;
    // Client-side pre-check.
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
      fd.append('slug', title.trim() || 'cover');
      const res = await fetch('/api/books/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Gagal mengunggah cover.');
      setCoverImage(data.url);
      setCoverPreview(data.url);
    } catch (e: any) {
      setError(e?.message ?? 'Gagal mengunggah cover.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validasi Stok: boleh kosong (0 eksemplar), harus bilangan bulat >= 0.
    let stockNum = 0;
    if (stock.trim() !== '') {
      stockNum = Number(stock);
      if (!Number.isInteger(stockNum) || stockNum < 0) {
        setError('Stok harus berupa angka bulat yang tidak negatif.');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          isbn,
          description,
          synopsis,
          language: language || null,
          publicationYear: publicationYear ? Number(publicationYear) : null,
          pages: pages ? Number(pages) : null,
          authorId: authorId || null,
          publisherId: publisherId || null,
          categoryId: categoryId || null,
          status,
          coverImage: coverImage || null,
          stock: stockNum,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Gagal menyimpan.');
      window.location.href = '/dashboard/books';
    } catch (err: any) {
      setError(err?.message ?? 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 };

  return (
    <div style={{ maxWidth: 860 }}>
      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Tambah Buku</h1>
        <Link href="/dashboard/books" className="btn secondary">Kembali</Link>
      </div>

      <form onSubmit={onSubmit} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 8 }}>{error}</div>}

        <div className="form-grid form-grid-cover">
          <div>
            <label style={labelStyle}>Cover Buku</label>
            <div style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="Preview cover" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 6 }} />
              ) : (
                <div style={{ color: 'var(--muted)', fontSize: 13, padding: '24px 0' }}>Belum ada cover</div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFileChange} style={{ display: 'none' }} id="cover-input" />
              <label htmlFor="cover-input" className="btn secondary" style={{ marginTop: 8, cursor: 'pointer', fontSize: 13, width: '100%', justifyContent: 'center' }}>
                {uploading ? 'Mengunggah...' : 'Upload Cover'}
              </label>
              {coverImage && (
                <button type="button" className="btn secondary" style={{ marginTop: 6, width: '100%', justifyContent: 'center', fontSize: 13 }} onClick={() => { setCoverImage(''); setCoverPreview(''); }}>
                  Hapus Cover
                </button>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '6px 0 0' }}>JPG, JPEG, PNG, WebP. Maks 5 MB.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Judul *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} maxLength={255} style={inputStyle} />
            </div>
            <div className="form-grid form-grid-2">
              <div>
                <label style={labelStyle}>ISBN *</label>
                <input value={isbn} onChange={(e) => setIsbn(e.target.value)} required maxLength={20} placeholder="9786020324788" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Bahasa *</label>
                <input value={language} onChange={(e) => setLanguage(e.target.value)} minLength={2} maxLength={50} placeholder="Indonesia" style={inputStyle} />
              </div>
            </div>
            <div className="form-grid form-grid-2">
              <div>
                <label style={labelStyle}>Tahun Terbit</label>
                <input type="number" value={publicationYear} onChange={(e) => setPublicationYear(e.target.value)} min={1000} max={new Date().getFullYear() + 1} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Jumlah Halaman</label>
                <input type="number" value={pages} onChange={(e) => setPages(e.target.value)} min={1} style={inputStyle} />
              </div>
            </div>
            <div className="form-grid form-grid-3">
              <div>
                <label style={labelStyle}>Penulis</label>
                <select value={authorId} onChange={(e) => setAuthorId(e.target.value)} style={inputStyle}>
                  <option value="">— Pilih —</option>
                  {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Penerbit</label>
                <select value={publisherId} onChange={(e) => setPublisherId(e.target.value)} style={inputStyle}>
                  <option value="">— Pilih —</option>
                  {publishers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Kategori</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle}>
                  <option value="">— Pilih —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-grid form-grid-2">
              <div>
                <label style={labelStyle}>Status Katalog</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')} style={inputStyle}>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Stok</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min={0}
                  step={1}
                  placeholder="Masukkan jumlah stok"
                  style={inputStyle}
                />
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '6px 0 0' }}>Jumlah eksemplar fisik buku. Kosongkan untuk 0.</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Deskripsi</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={5000} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Sinopsis</label>
          <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows={4} maxLength={5000} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Link href="/dashboard/books" className="btn secondary">Batal</Link>
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </form>
    </div>
  );
}
