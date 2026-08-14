'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authClient.signUp.email({ name, email, password });
      if (res.error) {
        setError(getAuthErrorMessage(res.error));
      } else {
        // Self-registration always creates a Member account (role = member),
        // so the new user lands in their member area.
        router.push('/member');
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
          maxWidth: 440,
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
              sizes="(max-width: 640px) 96px, 128px"
              style={{ height: 40, width: 'auto' }}
            />
          </Link>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, margin: '0 0 4px' }}>
            Daftar Akun
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14 }}>
            Daftar sebagai anggota perpustakaan, gratis.
          </p>
        </div>

        {error && (
          <div role="alert" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
          <div>
            <label htmlFor="reg-name" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Nama lengkap
            </label>
            <input
              id="reg-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama Anda"
              required
              minLength={3}
              maxLength={150}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="reg-email" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Email
            </label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Kata sandi
            </label>
            <input
              id="reg-password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              required
              minLength={8}
              maxLength={100}
              autoComplete="new-password"
            />
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--muted)' }}>
              Minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.
            </p>
          </div>
          <button
            className="btn"
            type="submit"
            disabled={loading}
            style={{ justifyContent: 'center', padding: '12px 16px', marginTop: 4 }}
          >
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>
          Sudah punya akun?{' '}
          <Link href="/login" style={{ fontWeight: 700 }}>
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
