import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TBM Semesta Alam',
  description: 'Sistem manajemen perpustakaan TBM Semesta Alam',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
