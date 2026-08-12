/**
 * UI SETUP for the Stok browser test — registers a staff user and writes
 * credentials to /tmp/tbm-stock-ui.json for browser_use to consume.
 * Run: node --env-file-if-exists=.env.local --import tsx scripts/_stock-ui-setup.ts
 */
import { writeFileSync } from 'node:fs';
import { db } from '../src/db/index';
import { roles, users } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const BASE = 'http://localhost:3000';
const ts = Date.now();
const EMAIL = `stkui.${ts}@gmail.com`;
const PASSWORD = 'Test123456!';
const PREFIX = `STKUI${ts}`;

async function main() {
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ name: 'STK UI Staff', email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(30000),
  });
  const j = await res.json().catch(() => ({}));
  if (!j?.user?.id) {
    console.error('register gagal:', res.status, JSON.stringify(j).slice(0, 200));
    process.exit(1);
  }
  const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, 'staff')).limit(1);
  if (role) await db.update(users).set({ roleId: role.id }).where(eq(users.id, j.user.id));
  writeFileSync('/tmp/tbm-stock-ui.json', JSON.stringify({ email: EMAIL, password: PASSWORD, prefix: PREFIX }, null, 2));
  console.log('UI staff akun dibuat:', EMAIL);
  console.log('state:', '/tmp/tbm-stock-ui.json');
  process.exit(0);
}

main().catch((e) => { console.error('setup crashed:', e?.message ?? e); process.exit(1); });
