import Link from 'next/link';

export default function Home() {
  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>TBM Semesta Alam</h1>
        <p style={{ color: 'var(--muted)', margin: '0 0 24px' }}>
          Sistem manajemen perpustakaan modern — katalog, peminjaman, dan laporan dalam satu tempat.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link className="btn" href="/login">Masuk</Link>
          <Link className="btn secondary" href="/register">Daftar</Link>
        </div>
      </div>
    </div>
  );
}
