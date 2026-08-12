'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
        // Route by role: members go to their own area, staff/admin to the dashboard.
        try {
          const roleRes = await fetch('/api/auth/role');
          if (roleRes.ok) {
            const roleData = await roleRes.json();
            router.push(roleData.role === 'member' ? '/member' : '/dashboard');
          } else {
            router.push('/dashboard');
          }
        } catch {
          router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 420,
          width: '100%',
          padding: 32,
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link href="/" aria-label="TBM Semesta Alam — Beranda" style={{ display: 'inline-flex', lineHeight: 0, marginBottom: 14 }}>
            <Image
              src="/logo-tbm-semesta-alam-nav.png"
              alt="TBM Semesta Alam"
              width={1233}
              height={578}
              style={{ height: 40, width: 'auto' }}
            />
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '0 0 4px' }}>
            Selamat Datang Kembali
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14 }}>Masuk untuk melanjutkan ke akun Anda.</p>
        </div>

        {error && (
          <div role="alert" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
          <div>
            <label htmlFor="login-email" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Email
            </label>
            <input
              id="login-email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@contoh.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="login-password" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Kata sandi
            </label>
            <input
              id="login-password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            className="btn"
            type="submit"
            disabled={loading}
            style={{ justifyContent: 'center', padding: '12px 16px', marginTop: 4 }}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
          Belum punya akun?{' '}
          <Link href="/register" style={{ fontWeight: 700 }}>
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
