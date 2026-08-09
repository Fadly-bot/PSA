import { NextResponse } from 'next/server';
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/index';
import { members, roles, users } from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';
import { generateMemberCode } from '@/lib/utils';
import { auth } from '@/server/auth';
import type { SelectedFields } from 'drizzle-orm/operations';

export const runtime = 'nodejs';

const createMemberSchema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(150, 'Nama maksimal 150 karakter'),
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  phone: z.string().trim().max(20).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal lahir tidak valid').nullable().optional(),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal bergabung tidak valid').optional(),
  status: z.boolean().optional(),
});

const memberSelect: SelectedFields<any, any> = {
  id: members.id,
  memberCode: members.memberCode,
  phone: members.phone,
  address: members.address,
  birthDate: members.birthDate,
  joinDate: members.joinDate,
  status: members.status,
  createdAt: members.createdAt,
  updatedAt: members.updatedAt,
  user: {
    id: users.id,
    name: users.name,
    email: users.email,
    emailVerified: users.emailVerified,
    avatarUrl: users.avatarUrl,
    role: { name: roles.name },
  },
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const status = searchParams.get('status');
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') ?? '10')));
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const offset = (page - 1) * limit;

    // Members can only see their own profile.
    if (!hasPermission(user.role, 'member:read')) {
      const [own] = await db
        .select(memberSelect)
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(members.userId, user.id))
        .limit(1);
      return NextResponse.json({
        items: own ? [own] : [],
        page: 1,
        limit,
        total: own ? 1 : 0,
        totalPages: 1,
      });
    }

    const conditions: any[] = [isNull(users.deletedAt)];
    if (q) {
      conditions.push(
        or(
          ilike(members.memberCode, `%${q}%`),
          ilike(users.name, `%${q}%`),
          ilike(users.email, `%${q}%`),
          ilike(members.phone, `%${q}%`),
        )!,
      );
    }
    if (status === 'true' || status === 'false') {
      conditions.push(eq(members.status, status === 'true'));
    }
    const where = and(...conditions);

    const orderByMap: Record<string, any> = {
      memberCode: members.memberCode,
      joinDate: members.joinDate,
      createdAt: members.createdAt,
      name: users.name,
    };
    const orderCol = orderByMap[sortBy] ?? members.createdAt;
    const orderBy = sortOrder === 'asc' ? orderCol : desc(orderCol);

    const [items, [{ count }]] = await Promise.all([
      db
        .select(memberSelect)
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
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
    console.error('GET /api/members error', error);
    return NextResponse.json({ error: 'Gagal memuat data anggota.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getCurrentUser();
    if (!actor) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(actor.role, 'member:create')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Data anggota tidak valid.' },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // Unique email check.
    const [emailExists] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    if (emailExists) {
      return NextResponse.json({ error: 'Email sudah digunakan.' }, { status: 409 });
    }

    // Create the user account via Better Auth (hashes the password server-side).
    const created = await auth.api.signUpEmail({
      body: { name: data.name, email: data.email, password: data.password },
    });
    const userId = created?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Gagal membuat akun pengguna.' }, { status: 500 });
    }

    // Create the member profile (hook may also have created one; use upsert).
    const [member] = await db
      .insert(members)
      .values({
        userId,
        memberCode: generateMemberCode(),
        phone: data.phone ?? null,
        address: data.address ?? null,
        birthDate: data.birthDate ?? null,
        joinDate: data.joinDate ?? new Date().toISOString().slice(0, 10),
        status: data.status ?? true,
      })
      .onConflictDoUpdate({
        target: members.userId,
        set: {
          phone: data.phone ?? null,
          address: data.address ?? null,
          birthDate: data.birthDate ?? null,
          joinDate: data.joinDate ?? new Date().toISOString().slice(0, 10),
          status: data.status ?? true,
          updatedAt: new Date(),
        },
      })
      .returning();

    await createAuditLog({
      userId: actor.id,
      action: 'CREATE',
      module: 'MEMBERS',
      description: `Tambah anggota "${data.name}" (${member.memberCode})`,
    });

    return NextResponse.json({ ...member, userId }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/members error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Email atau kode anggota sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal menyimpan anggota.' }, { status: 500 });
  }
}
