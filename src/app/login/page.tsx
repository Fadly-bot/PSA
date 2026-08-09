'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authClient.signIn.email({ email, password });
      if (res.error) {
        setError(getAuthErrorMessage(res.error));
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Masuk</h1>
        <p style={{ color: 'var(--muted)', margin: '0 0 20px' }}>Gunakan akun Anda untuk melanjutkan.</p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: 10, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Kata sandi</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn" type="submit" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 14, color: 'var(--muted)' }}>
          Belum punya akun? <a href="/register">Daftar</a>
        </p>
      </div>
    </div>
  );
}
