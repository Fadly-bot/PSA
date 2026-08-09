/**
 * Shared utility helpers for TBM Semesta Alam.
 */

/** Convert an arbitrary string into a URL-safe kebab-case slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Generate a sequential-ish, collision-safe member code, e.g. AGT-8F3K2A. */
export function generateMemberCode(): string {
  return `AGT-${Date.now().toString(36).toUpperCase()}`;
}

/** Generate a borrow code, e.g. BRW-2026-8F3K2A. */
export function generateBorrowCode(): string {
  const year = new Date().getFullYear();
  return `BRW-${year}-${Date.now().toString(36).toUpperCase()}`;
}

/** Generate an inventory code, e.g. INV-2026-8F3K2A. */
export function generateInventoryCode(): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${Date.now().toString(36).toUpperCase()}`;
}

/** Format a date value (Date | string) as YYYY-MM-DD for date inputs. */
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Format a date as localized Indonesian long format. */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Format a number as Indonesian Rupiah. */
export function formatRupiah(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

/** ISO-8601 UTC timestamp for audit log descriptions. */
export function nowIso(): string {
  return new Date().toISOString();
}
