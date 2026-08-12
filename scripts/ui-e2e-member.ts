/**
 * PHASE A — MEMBER UI E2E (Playwright + system Chrome).
 * ======================================================
 * Drives the real browser UI against http://localhost:3000 (production
 * build, production database).
 *
 *   npm run ui:e2e:member -- register   # part 1: register → dashboard → catalog → detail → borrow → my-books → logout
 *   npm run ui:e2e:member -- verify    # part 2 (after scripts/member-e2e.ts ran): login → returned → history → fines → logout
 *
 * Part 1 writes /tmp/tbm-member-state.json (email, password, borrowCode)
 * consumed by part 2 and by the API/DB verification script.
 */
import { chromium, type Page } from 'playwright-core';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const CHROME =
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
const MODE = process.argv[2] ?? 'register';
const EMAIL = `member.e2e.${Date.now()}@gmail.com`;
const PASSWORD = 'MemberTest123!';
const STATE_FILE = '/tmp/tbm-member-state.json';
const SHOTS = '/tmp/tbm-shots';
if (!existsSync(SHOTS)) mkdirSync(SHOTS, { recursive: true });

let pass = 0;
let fail = 0;
const failures: string[] = [];
const consoleErrors: string[] = [];

function check(ok: boolean, label: string, detail = '') {
  if (ok) pass++;
  else { fail++; failures.push(label); }
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${label}${detail ? ` | ${detail}` : ''}`);
}

let ctx: import('playwright-core').BrowserContext;
async function newPage(): Promise<Page> {
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 300)}`));
  return page;
}

async function registerFlow() {
  const page = await newPage();
  console.log('\n-- 1. REGISTER --');
  await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#reg-name', { timeout: 15000 });
  check(true, 'halaman /register dimuat', 'form dengan #reg-name terlihat');

  await page.fill('#reg-name', 'E2E Member Test');
  await page.fill('#reg-email', EMAIL);
  await page.fill('#reg-password', PASSWORD);
  const nameVal = await page.inputValue('#reg-name');
  const emailVal = await page.inputValue('#reg-email');
  check(nameVal === 'E2E Member Test' && emailVal === EMAIL, 'form terisi benar', emailVal);

  await page.screenshot({ path: `${SHOTS}/1-register-filled.png` });
  await page.click('button[type="submit"]');
  let redirected = false;
  try {
    await page.waitForURL('**/member', { timeout: 15000 });
    redirected = true;
  } catch {
    // diagnostics: what did the page show?
    const url = page.url();
    const alert = await page.locator('[role="alert"]').allInnerTexts().catch(() => []);
    const btnText = await page.locator('button[type="submit"]').innerText().catch(() => '');
    const bodySnip = (await page.locator('body').innerText().catch(() => '')).slice(0, 400);
    console.log('  DIAG url=', url, '| alert=', JSON.stringify(alert), '| submitBtn=', btnText);
    console.log('  DIAG body=', JSON.stringify(bodySnip));
    await page.screenshot({ path: `${SHOTS}/1b-register-failed.png` });
  }
  check(redirected, 'register berhasil + auto-login redirect → /member', page.url());
  if (!redirected) return;
  await page
    .locator('text=Ringkasan Aktivitas')
    .first()
    .waitFor({ state: 'visible', timeout: 45000 })
    .catch(() => {});
  check(await page.locator('text=Ringkasan Aktivitas').first().isVisible().catch(() => false), 'member dashboard menampilkan "Ringkasan Aktivitas"');

  // Dashboard elements (REF1 labels).
  const statLabels = ['Buku Dipinjam', 'Tenggat Waktu', 'Riwayat Peminjaman', 'Denda Aktif'];
  for (const label of statLabels) {
    check(await page.locator(`text=${label}`).first().isVisible().catch(() => false), `stat card "${label}" tampil`);
  }
  check(await page.locator('text=Kartu Anggota').first().isVisible().catch(() => false), 'kartu anggota tampil');
  check(await page.locator('text=Cari Buku').first().isVisible().catch(() => false), 'tombol "Cari Buku" tampil');
  check(await page.locator('text=Riwayat Peminjaman Terbaru').first().isVisible().catch(() => false), 'section "Riwayat Peminjaman Terbaru" tampil');

  // No staff/admin menus on member area.
  const bodyText = await page.locator('body').innerText();
  const forbidden = ['Kelola Petugas', 'Pengaturan', 'Audit', 'Laporan', 'Inventaris'];
  const foundForbidden = forbidden.filter((f) => bodyText.includes(f));
  check(foundForbidden.length === 0, 'tidak ada menu staff/admin di area member', foundForbidden.join(',') || 'bersih');

  await page.screenshot({ path: `${SHOTS}/2-member-dashboard.png` });
  await page.close();
  return EMAIL;
}

async function catalogFlow() {
  const page = await newPage();
  console.log('\n-- 2. KATALOG + SEARCH --');
  await page.goto(`${BASE}/member/books`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  try {
    await page.waitForSelector('input[aria-label="Cari buku"]', { timeout: 15000 });
    check(true, 'halaman katalog member dimuat (search box ada)');
  } catch {
    const url = page.url();
    const bodySnip = (await page.locator('body').innerText().catch(() => '')).slice(0, 400);
    console.log('  DIAG catalog url=', url, '| body=', JSON.stringify(bodySnip));
    check(false, 'halaman katalog member dimuat (search box ada)', url);
    await page.screenshot({ path: `${SHOTS}/2b-catalog-failed.png` });
    await page.close();
    return;
  }

  // Books load async after the search box renders — wait for the first card link.
  const bookLinks = page.locator('a[href^="/books/"]');
  let count = 0;
  try {
    await bookLinks.first().waitFor({ state: 'visible', timeout: 20000 });
    count = await bookLinks.count();
    check(count >= 1, 'daftar buku muncul (card link ke detail)', `links=${count}`);
  } catch {
    count = await bookLinks.count().catch(() => 0);
    check(false, 'daftar buku muncul (card link ke detail)', `links=${count}`);
  }

  // Covers: wait for lazy images to settle, then find <img> elements that are not broken.
  // (loading="lazy" means below-fold covers may still be pending right after render.)
  await page.waitForTimeout(2500);
  await page.evaluate(async () => {
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete ? Promise.resolve() : new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        }),
      ),
    );
  }).catch(() => {});
  const imgs = page.locator('img');
  const imgCount = await imgs.count();
  let brokenImgs = 0;
  for (let i = 0; i < Math.min(imgCount, 20); i++) {
    const img = imgs.nth(i);
    const ok = await img.evaluate((el) => {
      const i = el as HTMLImageElement;
      return i.complete && i.naturalWidth > 0;
    }).catch(() => false);
    if (!ok) brokenImgs++;
  }
  check(brokenImgs === 0, 'cover buku tidak rusak (naturalWidth > 0)', `checked=${Math.min(imgCount, 20)} broken=${brokenImgs}`);

  const titles = await page.locator('h2, h3').allInnerTexts();
  const sampleTitles = titles.filter((t) => t.trim()).slice(0, 5).join(' | ');
  check(sampleTitles.length > 0, 'judul buku tampil', sampleTitles);

  // Search.
  await page.fill('input[aria-label="Cari buku"]', 'Buku');
  await page.click('button:has-text("Cari")');
  await page.waitForTimeout(2500);
  const afterSearch = await page.locator('a[href^="/books/"]').count();
  check(afterSearch >= 1, 'search "Buku" mengembalikan hasil', `links=${afterSearch}`);
  await page.screenshot({ path: `${SHOTS}/3-catalog-search.png` });
  await page.close();
}

async function borrowFlow(_email: string) {
  const page = await newPage();
  console.log('\n-- 3. DETAIL BUKU + PINJAM --');
  // Try the two books known to have available copies.
  const candidates = [
    { title: 'E2E1786369018778 Buku Utama', slug: 'e2e1786369018778-buku-utama' },
    { title: 'FN1786370084851 Buku', slug: 'fn1786370084851-buku' },
  ];
  let borrowed = '';
  for (const c of candidates) {
    await page.goto(`${BASE}/books/${c.slug}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const btn = page.locator('button:has-text("Pinjam Buku")').first();
    try {
      await btn.waitFor({ state: 'visible', timeout: 12000 });
    } catch {
      check(false, `halaman detail "${c.title}" menampilkan tombol Pinjam`);
      continue;
    }
    const disabled = await btn.isDisabled().catch(() => false);
    check(!disabled, `tombol Pinjam tersedia (enabled) untuk "${c.title}"`);
    if (disabled) continue;
    await page.screenshot({ path: `${SHOTS}/4-book-detail-${c.slug}.png` });
    await btn.click();
    const toastOk = await page
      .locator('text=Buku berhasil dipinjam')
      .first()
      .waitFor({ state: 'visible', timeout: 12000 })
      .then(() => true)
      .catch(() => false);
    check(toastOk, `toast sukses "Buku berhasil dipinjam!" untuk "${c.title}"`);
    if (toastOk) { borrowed = c.title; break; }
  }
  check(borrowed !== '', 'ada buku yang berhasil dipinjam', borrowed || 'tidak ada');
  await page.close();
  return borrowed;
}

async function myBooksFlow(expectedTitle: string) {
  const page = await newPage();
  console.log('\n-- 4. BUKU SAYA + HALAMAN LAIN --');
  await page.goto(`${BASE}/member/my-books`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('text=Buku Saya').first().waitFor({ state: 'visible', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const body = await page.locator('body').innerText();
  check(body.includes('Sedang Dipinjam') && body.includes(expectedTitle), 'buku yang dipinjam muncul di "Sedang Dipinjam"', expectedTitle);

  const codeMatch = body.match(/BRW-\d+-[A-Z0-9]+/);
  check(!!codeMatch, 'kode peminjaman (BRW-xxxx) tampil', codeMatch?.[0] ?? '');
  const dateMatch = body.match(/Pinjam\s*(\d{4}-\d{2}-\d{2})/);
  check(!!dateMatch, 'tanggal pinjam tampil', dateMatch?.[1] ?? '');
  const dueMatch = body.match(/Jatuh tempo\s*(\d{4}-\d{2}-\d{2})/);
  check(!!dueMatch, 'tanggal jatuh tempo tampil', dueMatch?.[1] ?? '');

  await page.screenshot({ path: `${SHOTS}/5-my-books.png` });

  // History + fines pages load.
  await page.goto(`${BASE}/member/history`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const histOk = await page.locator('text=Riwayat Peminjaman').first().waitFor({ timeout: 45000 }).then(() => true).catch(() => false);
  check(histOk, 'halaman Riwayat (/member/history) dimuat');

  await page.goto(`${BASE}/member/fines`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Empty state renders as p.title "Tidak ada denda"; with fines it renders h2 "Denda".
  const finesOk = await page
    .locator('h2:has-text("Denda"), .empty-state p.title:has-text("denda")')
    .first()
    .waitFor({ timeout: 45000 })
    .then(() => true)
    .catch(() => false);
  check(finesOk, 'halaman Denda (/member/fines) dimuat (empty state OK)');

  await page.close();
  return codeMatch?.[0] ?? '';
}

async function permissionFlow() {
  const page = await newPage();
  console.log('\n-- 5. PERMISSION (member vs staff area) --');
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  try {
    await page.waitForURL('**/member', { timeout: 12000 });
    check(true, 'GET /dashboard diarahkan → /member', page.url());
  } catch {
    check(false, 'GET /dashboard diarahkan → /member', page.url());
  }
  await page.goto(`${BASE}/dashboard/books`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  try {
    await page.waitForURL('**/member', { timeout: 12000 });
    check(true, 'GET /dashboard/books diarahkan → /member', page.url());
  } catch {
    check(false, 'GET /dashboard/books diarahkan → /member', page.url());
  }
  await page.close();
}

async function logoutFlow() {
  const page = await newPage();
  console.log('\n-- 6. LOGOUT + AKSES SETELAH LOGOUT --');
  await page.goto(`${BASE}/member`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const keluar = page.locator('button:has-text("Keluar"), a:has-text("Keluar")').first();
  await keluar.waitFor({ state: 'visible', timeout: 12000 }).catch(() => {});
  await keluar.click().catch(() => {});
  try {
    await page.waitForURL((u) => u.pathname === '/', { timeout: 12000 });
    check(true, 'logout → kembali ke homepage /', page.url());
  } catch {
    check(false, 'logout → kembali ke homepage /', page.url());
  }

  await page.goto(`${BASE}/member`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  try {
    await page.waitForURL((u) => u.pathname === '/login', { timeout: 12000 });
    check(true, 'setelah logout, /member → /login', page.url());
  } catch {
    check(false, 'setelah logout, /member → /login', page.url());
  }

  await page.goto(`${BASE}/member/my-books`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  try {
    await page.waitForURL((u) => u.pathname === '/login', { timeout: 12000 });
    check(true, 'setelah logout, /member/my-books → /login', page.url());
  } catch {
    check(false, 'setelah logout, /member/my-books → /login', page.url());
  }
  await page.close();
}

async function verifyFlow() {
  if (!existsSync(STATE_FILE)) {
    console.error('state file tidak ada — jalankan mode register dulu');
    process.exit(1);
  }
  const state = JSON.parse(readFileSync(STATE_FILE, 'utf8')) as { email: string; password: string; borrowCode: string; title: string };
  const page = await newPage();
  console.log('\n-- 7. VERIFIKASI SETELAH PENGEMBALIAN (login ulang) --');
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#login-email', { timeout: 15000 });
  await page.fill('#login-email', state.email);
  await page.fill('#login-password', state.password);
  await page.click('button[type="submit"]');
  try {
    await page.waitForURL('**/member', { timeout: 15000 });
    check(true, 'login ulang member → /member', page.url());
  } catch {
    check(false, 'login ulang member → /member', page.url());
    return;
  }

  await page.goto(`${BASE}/member/my-books`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('text=Buku Saya').first().waitFor({ state: 'visible', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const body = await page.locator('body').innerText();
  check(body.includes('Sudah Dikembalikan') && body.includes(state.title), 'buku yang dikembalikan muncul di "Sudah Dikembalikan"', state.title);
  await page.screenshot({ path: `${SHOTS}/6-my-books-returned.png` });

  await page.goto(`${BASE}/member/history`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('text=Riwayat Peminjaman').first().waitFor({ state: 'visible', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const histText = await page.locator('body').innerText();
  check(histText.includes(state.borrowCode), 'riwayat menampilkan kode peminjaman yang sudah dikembalikan', state.borrowCode);
  check(histText.includes('Dikembalikan'), 'status "Dikembalikan" tampil di riwayat');
  await page.screenshot({ path: `${SHOTS}/7-history.png` });

  await page.goto(`${BASE}/member/fines`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  const finesText = await page.locator('body').innerText();
  const hasFine = finesText.includes('Belum dibayar') && /Rp [\d.,]+/.test(finesText);
  check(hasFine, 'member melihat denda di halaman Denda', finesText.includes('Belum dibayar') ? 'ada denda belum dibayar' : 'empty state');
  await page.screenshot({ path: `${SHOTS}/8-fines.png` });

  await page.close();
}

async function main() {
  console.log(`=== UI E2E MEMBER (mode=${MODE}) — base ${BASE} ===`);
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--no-proxy-server',
      '--proxy-server=direct://',
      '--ignore-certificate-errors',
    ],
  });
  // ONE shared context so the session cookie persists across all flows.
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  if (MODE === 'register') {
    const email = await registerFlow();
    await catalogFlow();
    const borrowedTitle = await borrowFlow(email);
    const borrowCode = await myBooksFlow(borrowedTitle);
    await permissionFlow();
    await logoutFlow();
    writeFileSync(STATE_FILE, JSON.stringify({ email: EMAIL, password: PASSWORD, borrowCode, title: borrowedTitle }, null, 2));
    console.log('\nstate tersimpan:', STATE_FILE);
  } else if (MODE === 'verify') {
    await verifyFlow();
  } else {
    console.error('mode tidak dikenal:', MODE);
    process.exit(1);
  }

  await ctx.close();
  await browser.close();
  console.log('\n=== HASIL UI E2E MEMBER: ' + pass + ' PASS, ' + fail + ' FAIL ===');
  if (failures.length) console.log('Gagal:', failures.join(' | '));
  if (consoleErrors.length) {
    console.log('\nConsole errors (' + consoleErrors.length + '):');
    for (const e of [...new Set(consoleErrors)].slice(0, 10)) console.log('  -', e);
  } else {
    console.log('\nConsole errors: none');
  }
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error('UI E2E crashed:', e?.message ?? e); process.exit(1); });
