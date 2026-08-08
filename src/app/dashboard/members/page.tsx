'use client';

import { useEffect, useState } from 'react';

type Member = {
  id: string;
  memberCode: string;
  name: string;
  email: string;
  phone?: string | null;
  joinDate: string;
  status: boolean;
};

export default function MembersPage() {
  const [items, setItems] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/members')
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Anggota</h1>
        <button className="btn">+ Tambah Anggota</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 24, color: 'var(--muted)' }}>Memuat...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Telepon</th>
                <th>Tanggal Bergabung</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600 }}>{m.memberCode}</td>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>{m.phone ?? '—'}</td>
                  <td>{m.joinDate}</td>
                  <td><span className="badge">{m.status ? 'Aktif' : 'Nonaktif'}</span></td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} style={{ color: 'var(--muted)' }}>Belum ada anggota.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
