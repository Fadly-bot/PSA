'use client';

import { useState } from 'react';

/**
 * Reusable book cover with a consistent fallback when no image exists OR when
 * the stored image URL fails to load (broken image). Keeps a fixed 2:3 aspect
 * ratio, object-fit cover, and rounded corners so covers never look stretched
 * or broken.
 */
export default function BookCover({
  src,
  alt,
  title,
  className = '',
  sizes,
}: {
  src?: string | null;
  alt: string;
  title?: string | null;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        sizes={sizes}
        className={className}
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }

  const initial = (title ?? alt ?? '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <div
      role="img"
      aria-label={alt}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: 'linear-gradient(150deg, var(--primary-light), var(--surface-2))',
        color: 'var(--primary)',
      }}
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ opacity: 0.75 }}
      >
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20V4a2 2 0 00-2-2H6.5A2.5 2.5 0 004 4.5v15z" />
        <path d="M4 19.5A2.5 2.5 0 006.5 22H20v-5" />
      </svg>
      <span
        style={{
          fontSize: 15,
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          lineHeight: 1,
        }}
      >
        {initial}
      </span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        Book Cover
      </span>
    </div>
  );
}
