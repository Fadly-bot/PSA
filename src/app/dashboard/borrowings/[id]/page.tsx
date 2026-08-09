'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type BorrowingDetail = {
  id: string;
  borrowCode: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: string;
  notes?: string | null;
  member?: { id: string; memberCode: string; user?: { name?: string | null; email?: string | null } | null } | null;
  fine?: { id: string; amount: string; status: string; paidAt?: string | null } | null;
  items?: Array<{ id: string; inventoryCode: string; condition: string; status: string; bookTitle?: string; bookSlug?: string; bookIsbn?: string }> | null;
};

const statusLabel: Record<string, string> = {
  borrowed: 'Dipinjam',
  returned: 'Dikembalikan',
  overdue: 'Terlambat',
  cancelled: 'Dibatalkan',
};

export default function BorrowingDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<BorrowingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [action, setAction] = useState<'extend' | 'cancel' | 'return' | null>(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnNotes, setReturnNotes] = useState('');
  const [conditions, setConditions] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/borrowings/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) setNotFound(true);
        throw new Error('Gagal memuat data.');
      }
      const d = await res.json();
      setData(d);
      setNewDueDate(d.dueDate ?? '');
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  const isActive = data?.status === 'borrowed' || data?.status === 'overdue';

  const onExtend = async () => {
    if (!newDueDate) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/borrowings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDueDate }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? 'Gagal memperpanjang.');
      setAction(null);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    if (!confirm('Batalkan peminjaman ini? Eksemplar akan kembali tersedia.')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/borrowings/${params.id}`, { method: 'DELETE' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? 'Gagal membatalkan.');
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  const onReturn = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrowingId: params.id,
          returnDate,
          notes: returnNotes || null,
          conditions,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? 'Gagal memproses pengembalian.');
      alert(d?.fineAmount ? `Buku dikembalikan. Denda keterlambatan: Rp${d.fineAmount}` : 'Buku berhasil dikembalikan.');
      setAction(null);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Terjadi kesalahan.');
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <div>
        <div style={{ marginBottom: 16 }}><Link href="/dashboard/borrowings" className="btn secondary">Kembali</Link></div>
        <div className="card" style={{ padding: 24 }}>Data peminjaman tidak ditemukan.</div>
      </div>
    );
  }

  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 };
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 };

  return (
    <div style={{ maxWidth: 860 }}>
      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Detail Peminjaman</h1>
        <Link href="/dashboard/borrowings" className="btn secondary">Kembali</Link>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>{error}</div>}

      {loading ? (
        <div className="card" style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
      ) : data ? (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>{data.borrowCode}</h2>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
                  {data.member?.user?.name ?? data.member?.memberCode ?? '—'} · {data.member?.user?.email ?? ''}
                </p>
              </div>
              <span className="badge" style={{ fontSize: 13, padding: '6px 12px' }}>{statusLabel[data.status] ?? data.status}</span>
            </div>
            <div className="form-grid form-grid-3" style={{ marginTop: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Tanggal Pinjam</div>
                <div style={{ fontWeight: 600 }}>{data.borrowDate}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Jatuh Tempo</div>
                <div style={{ fontWeight: 600 }}>{data.dueDate}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Tanggal Kembali</div>
                <div style={{ fontWeight: 600 }}>{data.returnDate ?? '—'}</div>
              </div>
            </div>
            {data.fine && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: '#fef3c7', borderRadius: 8, fontSize: 14 }}>
                Denda: <strong>Rp{data.fine.amount}</strong> · {data.fine.status === 'paid' ? 'Lunas' : 'Belum dibayar'}
              </div>
            )}
            {isActive && (
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <button className="btn" onClick={() => setAction('return')}>Proses Pengembalian</button>
                <button className="btn secondary" onClick={() => setAction('extend')}>Perpanjang</button>
                <button className="btn secondary" onClick={onCancel} disabled={busy}>Batalkan</button>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'auto', marginBottom: 16 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Kode Inventaris</th>
                  <th>Judul Buku</th>
                  <th>ISBN</th>
                  <th>Kondisi</th>
                  <th>Status Eksemplar</th>
                </tr>
              </thead>
              <tbody>
                {(data.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.inventoryCode}</td>
                    <td>{item.bookTitle ?? '—'}</td>
                    <td style={{ color: 'var(--muted)' }}>{item.bookIsbn ?? '—'}</td>
                    <td>{item.condition}</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
                {(data.items ?? []).length === 0 && (
                  <tr><td colSpan={5} style={{ color: 'var(--muted)' }}>Tidak ada eksemplar.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {action === 'extend' && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Perpanjang Masa Pinjam</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Jatuh Tempo Baru</label>
                  <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} style={inputStyle} />
                </div>
                <button className="btn" onClick={onExtend} disabled={busy}>{busy ? 'Memproses...' : 'Simpan'}</button>
                <button className="btn secondary" onClick={() => setAction(null)}>Batal</button>
              </div>
            </div>
          )}

          {action === 'return' && (
            <div className="card">
              <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Proses Pengembalian</h3>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Tanggal Kembali</label>
                  <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <label style={labelStyle}>Kondisi Saat Kembali (opsional per eksemplar)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {(data.items ?? []).map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                    <span style={{ fontWeight: 600, minWidth: 140 }}>{item.inventoryCode}</span>
                    <select value={conditions[item.id] ?? ''} onChange={(e) => setConditions((prev) => ({ ...prev, [item.id]: e.target.value }))} style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6 }}>
                      <option value="">Tetap ({item.condition})</option>
                      <option value="good">Baik</option>
                      <option value="damaged">Rusak</option>
                      <option value="lost">Hilang</option>
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label style={labelStyle}>Catatan</label>
                <textarea value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} rows={2} maxLength={1000} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn secondary" onClick={() => setAction(null)}>Batal</button>
                <button className="btn" onClick={onReturn} disabled={busy}>{busy ? 'Memproses...' : 'Kembalikan Buku'}</button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
