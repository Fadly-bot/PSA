import type { Metadata } from 'next';
import { DM_Serif_Display, Nunito } from 'next/font/google';
import './globals.css';

/**
 * Self-hosted fonts (next/font): removes the render-blocking cross-origin
 * Google Fonts @import and preloads only the weights actually used by the
 * design system (Nunito 400/500/600/700/800, DM Serif Display 400).
 * `display: swap` keeps text visible while woff2 files load.
 */
const fontDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
});

const fontBody = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-body',
});

/**
 * Production base URL for canonical links / sitemap / robots.
 * Set NEXT_PUBLIC_SITE_URL (or BETTER_AUTH_URL) in the environment.
 * Never hardcode localhost as the production canonical URL.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.BETTER_AUTH_URL ??
  'http://localhost:3000'
).replace(/\/+$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'TBM Semesta Alam',
    template: '%s | TBM Semesta Alam',
  },
  description:
    'Sistem Informasi Perpustakaan Taman Bacaan Masyarakat (TBM) Semesta Alam — kelola koleksi buku, anggota, peminjaman, pengembalian, denda, laporan, dan administrasi secara digital.',
  keywords: [
    'TBM Semesta Alam',
    'Taman Bacaan Masyarakat',
    'perpustakaan digital',
    'katalog buku',
    'peminjaman buku',
    'koleksi buku',
  ],
  authors: [{ name: 'TBM Semesta Alam' }],
  icons: {
    icon: '/icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_URL,
    siteName: 'TBM Semesta Alam',
    title: 'TBM Semesta Alam',
    description:
      'Sistem Informasi Perpustakaan Taman Bacaan Masyarakat (TBM) Semesta Alam — kelola koleksi buku, anggota, peminjaman, pengembalian, denda, laporan, dan administrasi secara digital.',
    images: [
      {
        url: '/logo-tbm-semesta-alam.png',
        width: 1254,
        height: 1254,
        alt: 'Logo TBM Semesta Alam',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TBM Semesta Alam',
    description:
      'Sistem Informasi Perpustakaan Taman Bacaan Masyarakat (TBM) Semesta Alam.',
    images: ['/logo-tbm-semesta-alam.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  // Google Search Console ownership verification.
  verification: {
    google: '-cy5mBXzMXkVxfFDKCe1mWDOFL-piIO8Vb1ZP2FSkqM',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body>{children}</body>
    </html>
  );
}
