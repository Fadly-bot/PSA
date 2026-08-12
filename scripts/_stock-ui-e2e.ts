/**
 * STOCK UI E2E — drives the real browser (Playwright + system Chrome)
 * against http://localhost:3000 to verify the "Stok" field on Tambah Buku.
 *
 * Prerequisite: scripts/_stock-ui-setup.ts has created a staff account and
 * written /tmp/tbm-stock-ui.json.
 *
 * Run: node --import tsx scripts/_stock-ui-e2e.ts
 */
import { chromium, type Page } from 'playwright-core';
import { readFileSync } from 'node:fs';

const BASE = 'http://localhost:3000';
const CHROME = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe';
const state = JSON.parse(readFileSync('/tmp/tbm-stock-ui.json', 'utf8')) as { email: string; password: string; prefix: string };
const TITLE = `${state.prefix} Buku UI`;
const ISBN = `${state.prefix}`.slice(0, 20);

let pass = 0;
let fail = 0;
const failures: string[] = [];
const consoleErrors: string[] = [];

function check(ok: boolean, label: string, detail = '') {
  if (ok) pass++;
  else { fail++; failures.push(label); }
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${label}${detail ? ` | ${detail}` : ''}`);
}

async function newPage(ctx: import('playwright-core').BrowserContext): Promise<Page> {
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 300)}`));
  return page;
}

async function main() {
  console.log(`=== STOCK UI E2E — staff ${state.email} ===`);
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server', '--proxy-server=direct://', '--ignore-certificate-errors'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await newPage(ctx);

  // ── 1. LOGIN ─────────────────────────────────────────────────────────
  console.log('\n-- 1. LOGIN STAFF --');
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#login-email', { timeout: 15000 });
  await page.fill('#login-email', state.email);
  await page.fill('#login-password', state.password);
  await page.click('button[type="submit"]');
  let loggedIn = false;
  try {
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    loggedIn = true;
  } catch {
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 300);
    console.log('  DIAG login body:', JSON.stringify(body));
  }
  check(loggedIn, 'login staff berhasil -> /dashboard', page.url());

  // ── 2. FORM TAMBAH BUKU: field Stok ──────────────────────────────────
  console.log('\n-- 2. FORM TAMBAH BUKU — field Stok --');
  await page.goto(`${BASE}/dashboard/books/new`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('form input:visible', { timeout: 20000 });
  const stokInput = page.locator('input[placeholder="Masukkan jumlah stok"]');
  check((await stokInput.count()) === 1, 'field Stok muncul pada form Tambah Buku');
  const stokType = await stokInput.getAttribute('type').catch(() => '');
  const stokMin = await stokInput.getAttribute('min').catch(() => '');
  const stokStep = await stokInput.getAttribute('step').catch(() => '');
  check(stokType === 'number', `input Stok bertipe number`, `type=${stokType}`);
  check(stokMin === '0' && stokStep === '1', 'input Stok min=0 step=1', `min=${stokMin} step=${stokStep}`);
  const hasStokLabel = (await page.locator('label:has-text("Stok")').count()) > 0;
  check(hasStokLabel, 'label "Stok" tampil');

  // ── 3. ISI FORM + SUBMIT ─────────────────────────────────────────────
  console.log('\n-- 3. ISI FORM (Stok = 3) + SUBMIT --');
  await page.locator('form input:visible').nth(0).fill(TITLE); // Judul
  await page.locator('input[placeholder="9786020324788"]').fill(ISBN); // ISBN
  await page.locator('input[placeholder="Indonesia"]').fill('Indonesia'); // Bahasa
  await stokInput.fill('3');
  const stokVal = await stokInput.inputValue();
  check(stokVal === '3', 'Stok terisi 3', `value=${stokVal}`);
  await page.screenshot({ path: '/tmp/tbm-stok-form-filled.png' });
  await page.click('button[type="submit"]:has-text("Simpan")');

  let redirected = false;
  try {
    await page.waitForURL('**/dashboard/books', { timeout: 20000 });
    redirected = true;
  } catch {
    const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 500);
    console.log('  DIAG submit body:', JSON.stringify(body));
  }
  check(redirected, 'submit berhasil -> /dashboard/books', page.url());
  if (!redirected) {
    await page.screenshot({ path: '/tmp/tbm-stok-submit-failed.png' });
  } else {
    // ── 4. VERIFIKASI KATALOG: Stok 3 / 3 ──────────────────────────────
    await page.waitForTimeout(2500);
    const row = page.locator(`tr:has-text("${TITLE}")`).first();
    const rowVisible = await row.isVisible().catch(() => false);
    check(rowVisible, `buku "${TITLE}" muncul di Katalog Buku`);
    if (rowVisible) {
      const rowText = await row.innerText();
      const hasStock = rowText.includes('3 / 3');
      check(hasStock, 'kolom Stok menampilkan "3 / 3" (tersedia/total)', rowText.replace(/\s+/g, ' ').slice(0, 160));
      await page.screenshot({ path: '/tmp/tbm-stok-catalog-row.png' });
    }
  }

  await ctx.close();
  await browser.close();
  console.log('\n=== HASIL UI E2E: ' + pass + ' PASS, ' + fail + ' FAIL ===');
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
