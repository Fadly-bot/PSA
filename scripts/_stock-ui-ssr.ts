/**
 * SSR verification for the Stok field — logs in as staff and fetches the
 * rendered /dashboard/books/new HTML, asserting the Stok field markup is
 * present. Falls back to direct page checks when Chrome is unavailable.
 *
 * Run: node --import tsx scripts/_stock-ui-ssr.ts
 */
import { readFileSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const state = JSON.parse(readFileSync('/tmp/tbm-stock-ui.json', 'utf8')) as { email: string; password: string; prefix: string };

let pass = 0;
let fail = 0;
const failures: string[] = [];
function check(ok: boolean, label: string, detail = '') {
  if (ok) pass++;
  else { fail++; failures.push(label); }
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${label}${detail ? ` | ${detail}` : ''}`);
}

async function main() {
  // 1. Login via API → session cookie.
  const login = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ email: state.email, password: state.password }),
    signal: AbortSignal.timeout(30000),
  });
  const cookie = (login.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(';')[0])
    .find((c) => c.startsWith('better-auth.session_token='))
    ?.split('=').slice(1).join('=') ?? '';
  check(login.status === 200 && !!cookie, 'login staff (API) -> session cookie', `HTTP ${login.status}`);

  // 2. Fetch the Tambah Buku form page (SSR HTML).
  const pageRes = await fetch(`${BASE}/dashboard/books/new`, {
    headers: { Cookie: `better-auth.session_token=${cookie}` },
    signal: AbortSignal.timeout(30000),
  });
  const html = await pageRes.text();
  check(pageRes.status === 200, 'GET /dashboard/books/new -> 200 (staff)', `HTTP ${pageRes.status}`);
  check(html.includes('Tambah Buku'), 'halaman menampilkan judul "Tambah Buku"');
  check(html.includes('Stok'), 'markup label "Stok" ada di HTML');
  check(html.includes('Masukkan jumlah stok'), 'placeholder "Masukkan jumlah stok" ada di HTML');
  check(html.includes('type="number"') && /min="0"/.test(html), 'input Stok type=number min=0');
  check(html.includes('Jumlah eksemplar fisik buku'), 'teks bantuan field Stok tampil');

  // 3. Catalog page loads for staff (book rows load client-side via API).
  const catRes = await fetch(`${BASE}/dashboard/books`, {
    headers: { Cookie: `better-auth.session_token=${cookie}` },
    signal: AbortSignal.timeout(30000),
  });
  check(catRes.status === 200, 'GET /dashboard/books -> 200 (staff)', `HTTP ${catRes.status}`);

  console.log(`\n=== HASIL SSR CHECK: ${pass} PASS, ${fail} FAIL ===`);
  if (failures.length) console.log('Gagal:', failures.join(' | '));
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('SSR check crashed:', e?.message ?? e); process.exit(1); });
