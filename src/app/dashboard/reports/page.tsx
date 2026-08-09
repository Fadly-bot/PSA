'use client';

import { useCallback, useEffect, useState } from 'react';

type ReportData = Array<Record<string, unknown>>;

const REPORT_TYPES = [
  { value: 'books', label: 'Laporan Buku' },
  { value: 'borrowings', label: 'Laporan Peminjaman' },
  { value: 'book-borrowings', label: 'Laporan Buku + Peminjaman' },
];

export default function ReportsPage() {
  const [type, setType] = useState('books');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<ReportData>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewed, setPreviewed] = useState(false);

  const buildUrl = useCallback((format: 'json' | 'csv') => {
    const params = new URLSearchParams();
    params.set('type', type);
    params.set('format', format);
    if (status) params.set('status', status);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return `/api/reports?${params.toString()}`;
  }, [type, status, startDate, endDate]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl('json'));
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error ?? 'Gagal menghasilkan laporan.');
      }
      const d = await res.json();
      setData(d.data ?? []);
      setPreviewed(true);
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (previewed) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const fieldLabel = (key: string) =>
    ({ bookTitle: 'Judul Buku', title: 'Judul', isbn: 'ISBN', inventoryCode: 'Kode Inventaris', memberName: 'Anggota', memberCode: 'Kode Anggota', borrowCode: 'No Pinjam', borrowDate: 'Tgl Pinjam', dueDate: 'Jatuh Tempo', returnDate: 'Tgl Kembali', status: 'Status', authorName: 'Penulis', publisherName: 'Penerbit', categoryName: 'Kategori', sourceName: 'Sumber Buku', shelfCode: 'Rak', condition: 'Kondisi' })[key] ?? key;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Laporan</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>Laporan Buku, Peminjaman, dan Buku + Peminjaman</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-grid form-grid-4">
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Jenis Laporan</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }}>
              {REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }}>
              <option value="">Semua</option>
              <option value="active">Aktif (buku)</option>
              <option value="borrowed">Dipinjam</option>
              <option value="returned">Dikembalikan</option>
              <option value="overdue">Terlambat</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Dari Tanggal</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Sampai Tanggal</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
          </div>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 8, marginTop: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <button className="btn" onClick={generate} disabled={loading}>{loading ? 'Memproses...' : 'Generate Laporan'}</button>
          <a className="btn secondary" href={buildUrl('csv')} style={{ textDecoration: 'none' }}>Export Excel (CSV)</a>
          <button className="btn secondary" onClick={() => window.print()}>Cetak / PDF</button>
        </div>
      </div>

      {previewed && (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <div style={{ padding: 12, borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
            Preview — {REPORT_TYPES.find((t) => t.value === type)?.label} ({data.length} baris)
          </div>
          {loading ? (
            <div style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
          ) : data.length === 0 ? (
            <div style={{ padding: 24, color: 'var(--muted)' }}>Tidak ada data untuk filter ini.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>{columns.map((c) => <th key={c}>{fieldLabel(c)}</th>)}</tr>
              </thead>
              <tbody>
                {data.slice(0, 50).map((row, i) => (
                  <tr key={i}>
                    {columns.map((c) => <td key={c}>{String(row[c] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
