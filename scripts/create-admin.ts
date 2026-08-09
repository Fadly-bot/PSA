/**
 * Admin Bootstrap CLI — TBM Semesta Alam
 * =======================================
 *
 * Creates the INITIAL admin account for the application.
 *
 *   npm run admin:create -- --email admin@example.com --password 'YourPass123'
 *
 * Alternative: set ADMIN_EMAIL / ADMIN_PASSWORD in the environment instead of
 * passing CLI flags. `--name` is optional (defaults to "Administrator").
 *
 * The script:
 *   - Loads environment variables from `.env.local` (when present) via the
 *     `--env-file-if-exists` flag wired in package.json.
 *   - Seeds the documented roles (admin, staff, member) idempotently.
 *   - Creates the user through Better Auth `signUpEmail` (password is hashed
 *     by Better Auth; never stored in plaintext).
 *   - Assigns the `admin` role through the existing RBAC (`users.role_id`).
 *   - Runs in a database transaction where roles/membership change together.
 *   - Is idempotent: refuses to duplicate an admin with the same email.
 *   - Is CLI-only: there is NO public HTTP endpoint that creates admins.
 *
 * SECURITY:
 *   - No default/hardcoded email or password.
 *   - Credentials are never printed to stdout.
 *   - Secrets (BETTER_AUTH_SECRET, DATABASE_URL) are read from the
 *     environment only and never logged.
 */

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../src/db/index';
import { auditLogs, members, roles, users } from '../src/db/schema';
import { auth } from '../src/server/auth';

/** Roles documented in docs/Permissions.md + docs/AUTH.md. */
const DOCUMENTED_ROLES = [
  { name: 'admin', description: 'Administrator sistem — akses penuh.' },
  { name: 'staff', description: 'Petugas perpustakaan — akses operasional.' },
  { name: 'member', description: 'Anggota perpustakaan — akses mandiri.' },
];

const emailSchema = z
  .string()
  .trim()
  .email('Email tidak valid.')
  .max(150, 'Email maksimal 150 karakter.');

// Password policy per docs/AUTH.md: minimal 8 karakter, huruf besar,
// huruf kecil, dan angka.
const passwordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter.')
  .max(100, 'Password maksimal 100 karakter.')
  .regex(/[A-Z]/, 'Password harus mengandung huruf besar.')
  .regex(/[a-z]/, 'Password harus mengandung huruf kecil.')
  .regex(/[0-9]/, 'Password harus mengandung angka.');

const nameSchema = z
  .string()
  .trim()
  .min(3, 'Nama minimal 3 karakter.')
  .max(150, 'Nama maksimal 150 karakter.');

function getFlag(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function confirm(promptText: string): Promise<boolean> {
  if (hasFlag('yes')) return true;
  if (typeof process.stdin?.isTTY !== 'boolean' || !process.stdin.isTTY) {
    // Non-interactive shell — require --yes to proceed safely.
    return false;
  }
  const readline = await import('node:readline/promises');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`${promptText} (ketik 'yes' untuk lanjut): `)).trim().toLowerCase();
  rl.close();
  return answer === 'yes';
}

async function main() {
  const emailRaw = getFlag('email') ?? process.env.ADMIN_EMAIL;
  const passwordRaw = getFlag('password') ?? process.env.ADMIN_PASSWORD;
  const nameRaw = getFlag('name') ?? process.env.ADMIN_NAME ?? 'Administrator';

  const email = emailSchema.safeParse(emailRaw);
  const password = passwordSchema.safeParse(passwordRaw);
  const name = nameSchema.safeParse(nameRaw);

  if (!email.success) {
    console.error(`Error: ${email.error.issues[0]?.message ?? 'Email tidak valid.'}`);
    console.error('Usage: npm run admin:create -- --email <email> --password <password>');
    process.exit(1);
  }
  if (!password.success) {
    console.error(`Error: ${password.error.issues[0]?.message ?? 'Password tidak valid.'}`);
    console.error('Password policy: minimal 8 karakter, huruf besar, huruf kecil, dan angka.');
    process.exit(1);
  }
  if (!name.success) {
    console.error(`Error: ${name.error.issues[0]?.message ?? 'Nama tidak valid.'}`);
    process.exit(1);
  }

  // 1. Seed documented roles (idempotent — RBAC cannot work without them).
  for (const role of DOCUMENTED_ROLES) {
    await db
      .insert(roles)
      .values(role)
      .onConflictDoNothing({ target: roles.name });
  }

  const [adminRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, 'admin'))
    .limit(1);

  if (!adminRole) {
    console.error('Error: role "admin" tidak ditemukan setelah seeding.');
    process.exit(1);
  }

  // 2. Idempotency checks.
  const [existing] = await db
    .select({ id: users.id, roleId: users.roleId })
    .from(users)
    .where(eq(users.email, email.data.toLowerCase()))
    .limit(1);

  if (existing) {
    const [existingRole] = existing.roleId
      ? await db.select({ name: roles.name }).from(roles).where(eq(roles.id, existing.roleId)).limit(1)
      : [];

    if (existingRole?.name === 'admin') {
      console.log('ADMIN_ALREADY_EXISTS: akun admin dengan email tersebut sudah ada.');
      process.exit(0);
    }
    console.error('Error: email sudah digunakan oleh pengguna non-admin.');
    process.exit(1);
  }

  // Refuse to create a second admin unless --force is passed. This is the
  // INITIAL admin bootstrap — an existing admin (any email) means the
  // initial setup has already been done.
  const [anyAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(roles.name, 'admin'))
    .limit(1);

  if (anyAdmin && !hasFlag('force')) {
    console.error(
      'Error: admin sudah ada. Gunakan --force jika memang ingin menambahkan admin tambahan.',
    );
    process.exit(1);
  }

  // 3. Confirmation before creating a privileged account.
  const ok = await confirm(
    `Buat admin ${email.data.toLowerCase()}?`,
  );
  if (!ok) {
    console.log('Dibatalkan. Gunakan --yes untuk skip konfirmasi pada shell non-interaktif.');
    process.exit(0);
  }

  // 4. Create the user through Better Auth (hashes the password server-side).
  const result = await auth.api.signUpEmail({
    body: { name: name.data, email: email.data.toLowerCase(), password: password.data },
  });
  const userId = result?.user?.id;
  if (!userId) {
    console.error('Error: gagal membuat akun pengguna.');
    process.exit(1);
  }

  // 5. Assign the admin role + remove the hook-created member profile so the
  //    admin is not listed as a library member. Runs in one transaction.
  await db.transaction(async (tx) => {
    await tx.update(users).set({ roleId: adminRole.id, updatedAt: new Date() }).where(eq(users.id, userId));
    await tx.delete(members).where(eq(members.userId, userId));
  });

  // 6. Record an audit log entry (admin bootstrap).
  await db
    .insert(auditLogs)
    .values({
      userId,
      action: 'ADMIN_BOOTSTRAP',
      module: 'AUTH',
      description: 'Initial admin dibuat melalui CLI admin:create',
    })
    .catch(() => undefined);

  console.log('Admin berhasil dibuat.');
  console.log(`  Email : ${email.data.toLowerCase()}`);
  console.log('  Role  : admin');
  console.log('Silakan login melalui halaman /login. Jangan membagikan kredensial ini.');
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error('Error: pembuatan admin gagal.');
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
});
