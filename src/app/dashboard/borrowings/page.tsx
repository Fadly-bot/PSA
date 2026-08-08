'use client';

import { useEffect, useState } from 'react';

type Borrowing = {
  id: string;
  memberName: string;
  inventoryCode: string;
  borrowDate: string;
  dueDate: string;
  status: string;
};

export default function BorrowingsPage() {
  const [items, setItems] = useState<Borrowing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/borrowings')
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Peminjaman</h1>
        <button className="btn">+ Peminjaman Baru</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Anggota</th>
                <th>Kode Inventaris</th>
                <th>Tgl Pinjam</th>
                <th>Tgl Jatuh Tempo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.memberName}</td>
                  <td>{b.inventoryCode}</td>
                  <td>{b.borrowDate}</td>
                  <td>{b.dueDate}</td>
                  <td><span className="badge">{b.status}</span></td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} style={{ color: 'var(--muted)' }}>Belum ada peminjaman.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
