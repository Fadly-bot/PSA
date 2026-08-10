import { NextResponse } from 'next/server';
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/index';
import { members, roles, users } from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';
import { auth } from '@/server/auth';
import type { SelectedFields } from 'drizzle-orm/operations';

export const runtime = 'nodejs';

// Password policy per docs/AUTH.md: min 8 chars, uppercase + lowercase + digit.
const passwordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .max(100, 'Password maksimal 100 karakter')
  .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
  .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
  .regex(/[0-9]/, 'Password harus mengandung angka');

const createUserSchema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(150, 'Nama maksimal 150 karakter'),
  email: z.string().trim().email('Format email tidak valid'),
  password: passwordSchema,
  role: z.enum(['staff', 'member']).default('staff'),
});

const userSelect: SelectedFields<any, any> = {
  id: users.id,
  name: users.name,
  email: users.email,
  emailVerified: users.emailVerified,
  avatarUrl: users.avatarUrl,
  status: users.status,
  lastLogin: users.lastLogin,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
  role: { name: roles.name },
  member: {
    id: members.id,
    memberCode: members.memberCode,
    status: members.status,
  },
};

/**
 * GET /api/users?role=staff&q=...&page=1&limit=10
 * Admin only. Lists user accounts (defaults to staff, i.e. "Kelola Petugas").
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'user:read')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const roleFilter = searchParams.get('role');
    const status = searchParams.get('status');
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') ?? '10')));
    const offset = (page - 1) * limit;

    const conditions: any[] = [isNull(users.deletedAt)];
    if (q) {
      conditions.push(
        or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))!,
      );
    }
    if (roleFilter === 'staff' || roleFilter === 'member' || roleFilter === 'admin') {
      conditions.push(eq(roles.name, roleFilter));
    }
    if (status === 'active' || status === 'inactive') {
      conditions.push(eq(users.status, status));
    }
    const where = and(...conditions);

    const [items, [{ count }]] = await Promise.all([
      db
        .select(userSelect)
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .leftJoin(members, eq(members.userId, users.id))
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(where),
    ]);

    return NextResponse.json({
      items,
      page,
      limit,
      total: Number(count),
      totalPages: Math.max(1, Math.ceil(Number(count) / limit)),
    });
  } catch (error) {
    console.error('GET /api/users error', error);
    return NextResponse.json({ error: 'Gagal memuat data petugas.' }, { status: 500 });
  }
}

/**
 * POST /api/users
 * Admin only. Creates a staff/member account. The Better Auth hook
 * auto-creates the member profile; we then assign the requested role.
 */
export async function POST(request: Request) {
  try {
    const actor = await getCurrentUser();
    if (!actor) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(actor.role, 'user:create')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const [emailExists] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(sql`lower(${users.email}) = lower(${data.email})`, isNull(users.deletedAt)))
      .limit(1);
    if (emailExists) {
      return NextResponse.json({ error: 'Email sudah digunakan.' }, { status: 409 });
    }

    const [targetRole] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, data.role))
      .limit(1);
    if (!targetRole) {
      return NextResponse.json({ error: `Role "${data.role}" tidak ditemukan.` }, { status: 400 });
    }

    const created = await auth.api.signUpEmail({
      body: { name: data.name, email: data.email, password: data.password },
    });
    const userId = created?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Gagal membuat akun pengguna.' }, { status: 500 });
    }

    // The member hook may have created a member row; ensure the requested role.
    await db
      .update(users)
      .set({ roleId: targetRole.id, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Staff are NOT library members — remove the hook-created member profile
    // (same as the admin bootstrap script). If later demoted to member, the
    // PATCH route re-creates it automatically.
    if (data.role === 'staff') {
      await db.delete(members).where(eq(members.userId, userId));
    }

    await createAuditLog({
      userId: actor.id,
      action: 'CREATE',
      module: 'USERS',
      description: `Tambah ${data.role} "${data.name}" (${data.email})`,
    });

    return NextResponse.json({ id: userId, name: data.name, email: data.email, role: data.role }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/users error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Email sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal menyimpan petugas.' }, { status: 500 });
  }
}
