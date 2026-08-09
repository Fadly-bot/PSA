/**
 * Environment checker CLI — TBM Semesta Alam
 * ==========================================
 * Memvalidasi konfigurasi environment TANPA membocorkan secret.
 *
 *   npm run db:check-env
 *   npm run db:check-env -- --connect     # + uji koneksi DB nyata (SELECT 1)
 *
 * Membaca `.env.local` bila ada (via --env-file-if-exists di package.json),
 * sehingga bisa dipakai untuk memvalidasi nilai yang akan dipasang di Vercel.
 * Hanya mencetak: ada/tidaknya variable, panjang secret, dan metadata aman
 * dari DATABASE_URL (host, port, database, username, sslmode) — TIDAK pernah
 * mencetak password / secret.
 */

import postgres from 'postgres';
import { describeDatabaseUrl, resolveConnectionString } from '../src/db/connection-string';

/** Variable wajib di Vercel (Production). secret=true → nilainya disembunyikan. */
const REQUIRED = [
  { name: 'DATABASE_URL', secret: true, note: 'Connection string PostgreSQL (Supabase) — runtime + migrasi.' },
  { name: 'BETTER_AUTH_SECRET', secret: true, note: 'Secret Better Auth — wajib ≥ 32 karakter di production.' },
  { name: 'BETTER_AUTH_URL', secret: false, note: 'Base URL server Better Auth — tanpa trailing slash.' },
  { name: 'NEXT_PUBLIC_BETTER_AUTH_URL', secret: false, note: 'Base URL client Better Auth — tanpa trailing slash.' },
  { name: 'NEXT_PUBLIC_SITE_URL', secret: false, note: 'URL publik situs — tanpa trailing slash.' },
  { name: 'NEXT_PUBLIC_SUPABASE_URL', secret: false, note: 'URL project Supabase, contoh: https://xxxx.supabase.co.' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', secret: true, note: 'Service role key Supabase — server-side saja.' },
] as const;

/** Variable opsional / belum dipakai kode. */
const OPTIONAL = [
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', secret: true, note: 'Belum dipakai kode saat ini — opsional.' },
  { name: 'ADMIN_EMAIL', secret: false, note: 'Hanya untuk CLI admin:create.' },
  { name: 'ADMIN_PASSWORD', secret: true, note: 'Hanya untuk CLI admin:create.' },
  { name: 'ADMIN_NAME', secret: false, note: 'Hanya untuk CLI admin:create.' },
] as const;

function printVar(name: string, secret: boolean, note: string, present: boolean): void {
  const value = present
    ? secret
      ? `(terisi, ${String(process.env[name]).length} karakter)`
      : `= ${process.env[name]}`
    : '(kosong)';
  console.log(`  [${present ? 'OK' : 'MISSING'}] ${name.padEnd(34)} ${value}`);
  if (!present) console.log(`         → ${note}`);
}

async function main(): Promise<void> {
  console.log('TBM Semesta Alam — Environment Check');
  console.log('(nilai secret tidak ditampilkan)');
  console.log('');

  let failed = false;

  console.log('Variable wajib:');
  for (const { name, secret, note } of REQUIRED) {
    const present = Boolean(process.env[name]);
    printVar(name, secret, note, present);
    if (!present) failed = true;
  }

  const authSecret = process.env.BETTER_AUTH_SECRET;
  if (authSecret && authSecret.length < 32) {
    console.log('  [WARN] BETTER_AUTH_SECRET hanya ' + authSecret.length + ' karakter — disarankan ≥ 32 karakter.');
  }

  console.log('\nVariable opsional:');
  for (const { name, secret, note } of OPTIONAL) {
    printVar(name, secret, note, Boolean(process.env[name]));
  }

  console.log('\nValidasi DATABASE_URL:');
  const raw = process.env.DATABASE_URL ?? '';
  const info = describeDatabaseUrl(raw);
  if (!info) {
    failed = true;
    try {
      resolveConnectionString(raw);
    } catch (error) {
      console.log(`  [FAIL] ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    console.log('  [OK] Format URL valid untuk postgres.js (Drizzle).');
    console.log(`       host     : ${info.host}`);
    console.log(`       port     : ${info.port}${info.port === '6543' ? ' (Supabase transaction pooler)' : ''}`);
    console.log(`       database : ${info.database}`);
    console.log(`       user     : ${info.user}`);
    console.log(`       password : ${info.hasPassword ? '(terisi)' : '(KOSONG)'}`);
    if (!info.hasPassword) {
      console.log('       ⚠ password kosong — pastikan ini memang diinginkan (untuk Supabase harus terisi).');
    }
    console.log(`       sslmode  : ${info.sslMode}`);
  }

  if (process.argv.includes('--connect')) {
    console.log('\nUji koneksi database (SELECT 1):');
    try {
      const url = resolveConnectionString(raw);
      const sql = postgres(url, { max: 1, connect_timeout: 15 });
      await sql`select 1`;
      await sql.end();
      console.log('  [OK] Koneksi berhasil.');
    } catch (error) {
      failed = true;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`  [FAIL] ${message.replace(/\n/g, ' ')}`);
      console.log('         → cek: password benar? project tidak paused? IP diizinkan di Supabase?');
    }
  }

  console.log('');
  if (failed) {
    console.log('Hasil: ADA MASALAH. Perbaiki terlebih dahulu, lalu redeploy di Vercel.');
    process.exit(1);
  }
  console.log('Hasil: SEMUA OK.');
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error('Error: pemeriksaan environment gagal.');
  if (error instanceof Error) console.error(error.message);
  process.exit(1);
});
