import { db } from '@/db/index';
import { settings } from '@/db/schema';

/**
 * Settings service.
 *
 * Library-wide configuration stored in the `settings` table (key/value).
 * Defaults mirror PRD.md "Pengaturan" (lama maksimal peminjaman, maksimal
 * jumlah buku, besaran denda per hari, profil perpustakaan).
 *
 * Values are stored as JSON strings so numbers/booleans survive round-trips.
 */

export const DEFAULT_SETTINGS: Record<string, { value: string; category: string; description: string; isPublic: boolean }> = {
  libraryName: { value: JSON.stringify('TBM Semesta Alam'), category: 'library', description: 'Nama perpustakaan', isPublic: true },
  libraryAddress: { value: JSON.stringify(''), category: 'library', description: 'Alamat perpustakaan', isPublic: true },
  libraryEmail: { value: JSON.stringify(''), category: 'library', description: 'Email perpustakaan', isPublic: true },
  libraryPhone: { value: JSON.stringify(''), category: 'library', description: 'Nomor telepon perpustakaan', isPublic: true },
  libraryOpenHours: { value: JSON.stringify('Senin–Sabtu, 08.00–16.00'), category: 'library', description: 'Jam operasional', isPublic: true },
  maxBorrowDays: { value: JSON.stringify(7), category: 'borrowing', description: 'Lama maksimal peminjaman (hari)', isPublic: false },
  maxBorrowBooks: { value: JSON.stringify(3), category: 'borrowing', description: 'Maksimal jumlah buku per peminjaman', isPublic: false },
  finePerDay: { value: JSON.stringify(1000), category: 'fine', description: 'Besaran denda per hari (Rupiah)', isPublic: false },
};

export type SettingMap = Record<string, string | number | boolean>;

/** Parse a stored JSON value into its native type. */
export function parseSettingValue(raw: string | null | undefined): string | number | boolean {
  if (raw == null || raw === '') return '';
  try {
    return JSON.parse(raw) as string | number | boolean;
  } catch {
    return raw;
  }
}

/** Load all effective settings (defaults merged with stored rows). */
export async function getSettings(): Promise<SettingMap> {
  const result: SettingMap = {};
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
    result[key] = parseSettingValue(def.value);
  }
  try {
    const rows = await db.select().from(settings);
    for (const row of rows) {
      result[row.key] = parseSettingValue(row.value);
    }
  } catch {
    // DB unavailable (e.g. build time) — fall back to defaults.
  }
  return result;
}

/** Read a single setting with a typed default. */
export async function getSetting<T extends string | number | boolean>(key: string, fallback: T): Promise<T> {
  const all = await getSettings();
  const value = all[key];
  return (value === undefined ? fallback : (value as T));
}

/** Persist/update a batch of settings (admin only — callers must authorize). */
export async function upsertSettings(entries: Array<{ key: string; value: string | number | boolean; category?: string; description?: string; isPublic?: boolean }>, updatedBy?: string | null) {
  for (const entry of entries) {
    const def = DEFAULT_SETTINGS[entry.key];
    await db
      .insert(settings)
      .values({
        key: entry.key,
        category: entry.category ?? def?.category ?? 'general',
        description: entry.description ?? def?.description ?? null,
        value: JSON.stringify(entry.value),
        isPublic: entry.isPublic ?? def?.isPublic ?? false,
        updatedBy: updatedBy ?? null,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: JSON.stringify(entry.value),
          category: entry.category ?? def?.category ?? 'general',
          description: entry.description ?? def?.description ?? null,
          isPublic: entry.isPublic ?? def?.isPublic ?? false,
          updatedBy: updatedBy ?? null,
          updatedAt: new Date(),
        },
      });
  }
}
