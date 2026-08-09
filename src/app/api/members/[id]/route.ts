import { NextResponse } from 'next/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/index';
import { borrowings, members, roles, users } from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';
import type { SelectedFields } from 'drizzle-orm/operations';

export const runtime = 'nodejs';

const updateMemberSchema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(150).optional(),
  email: z.string().trim().email('Format email tidak valid').optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal lahir tidak valid').nullable().optional(),
  joinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal bergabung tidak valid').optional(),
  status: z.boolean().optional(),
});

const detailSelect: SelectedFields<any, any> = {
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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });

    const [row] = await db
      .select(detailSelect)
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(members.id, id), isNull(users.deletedAt)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: 'MEMBER_NOT_FOUND: Anggota tidak ditemukan.' }, { status: 404 });
    }

    // Members can only view their own profile unless staff/admin.
    const isStaff = hasPermission(user.role, 'member:read');
    if (!isStaff && row.user.id !== user.id) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const history = await db
      .select({
        id: borrowings.id,
        borrowCode: borrowings.borrowCode,
        borrowDate: borrowings.borrowDate,
        dueDate: borrowings.dueDate,
        returnDate: borrowings.returnDate,
        status: borrowings.status,
      })
      .from(borrowings)
      .where(eq(borrowings.memberId, id))
      .orderBy(sql`${borrowings.createdAt} DESC`)
      .limit(20);

    return NextResponse.json({ ...row, borrowings: history });
  } catch (error) {
    console.error('GET /api/members/:id error', error);
    return NextResponse.json({ error: 'Gagal memuat detail anggota.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });

    const [existing] = await db
      .select({
        id: members.id,
        userId: members.userId,
        memberCode: members.memberCode,
      })
      .from(members)
      .where(and(eq(members.id, id), isNull(users.deletedAt)))
      .innerJoin(users, eq(members.userId, users.id))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'MEMBER_NOT_FOUND: Anggota tidak ditemukan.' }, { status: 404 });
    }

    // Owner can update own profile; staff/admin can update anyone.
    const isStaff = hasPermission(user.role, 'member:update');
    const isOwner = existing.userId === user.id;
    if (!isStaff && !isOwner) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' }, { status: 400 });
    }
    const data = parsed.data;

    const memberValues: Record<string, any> = { updatedAt: new Date() };
    if (data.phone !== undefined) memberValues.phone = data.phone;
    if (data.address !== undefined) memberValues.address = data.address;
    if (data.birthDate !== undefined) memberValues.birthDate = data.birthDate;
    if (data.joinDate !== undefined) memberValues.joinDate = data.joinDate;
    // Only staff/admin may change membership status.
    if (data.status !== undefined && isStaff) memberValues.status = data.status;

    const userValues: Record<string, any> = { updatedAt: new Date() };
    if (data.name !== undefined) userValues.name = data.name;
    if (data.email !== undefined) {
      const [emailExists] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, data.email), sql`${users.id} != ${existing.userId}`))
        .limit(1);
      if (emailExists) return NextResponse.json({ error: 'Email sudah digunakan.' }, { status: 409 });
      userValues.email = data.email;
    }

    const [member] = await db
      .update(members)
      .set(memberValues)
      .where(eq(members.id, id))
      .returning();

    if (Object.keys(userValues).length > 1) {
      await db.update(users).set(userValues).where(eq(users.id, existing.userId));
    }

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      module: 'MEMBERS',
      description: `Edit anggota ${existing.memberCode}`,
    });

    return NextResponse.json(member);
  } catch (error: any) {
    console.error('PATCH /api/members/:id error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Email sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui anggota.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'member:delete')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db
      .select({ id: members.id, memberCode: members.memberCode, userId: members.userId })
      .from(members)
      .where(eq(members.id, id))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'MEMBER_NOT_FOUND: Anggota tidak ditemukan.' }, { status: 404 });
    }

    // Cannot delete a member with active borrowings.
    const [active] = await db
      .select({ id: borrowings.id })
      .from(borrowings)
      .where(and(eq(borrowings.memberId, id), sql`${borrowings.status} IN ('borrowed', 'overdue')`))
      .limit(1);
    if (active) {
      return NextResponse.json({ error: 'MEMBER_HAS_ACTIVE_BORROWING: Anggota masih memiliki peminjaman aktif.' }, { status: 409 });
    }

    // Soft delete the linked user; deactivate the member profile.
    await db.update(users).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, existing.userId));
    await db.update(members).set({ status: false, updatedAt: new Date() }).where(eq(members.id, id));

    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      module: 'MEMBERS',
      description: `Hapus anggota ${existing.memberCode}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/members/:id error', error);
    return NextResponse.json({ error: 'Gagal menghapus anggota.' }, { status: 500 });
  }
}
