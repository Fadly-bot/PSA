import { NextResponse } from 'next/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/index';
import { members, roles, users } from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';
import { generateMemberCode } from '@/lib/utils';

export const runtime = 'nodejs';

const updateUserSchema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(150).optional(),
  email: z.string().trim().email('Format email tidak valid').optional(),
  status: z.enum(['active', 'inactive']).optional(),
  role: z.enum(['staff', 'member']).optional(),
});

/**
 * PATCH /api/users/[id]
 * Admin only. Updates a staff/member account:
 * - name / email
 * - status (active/inactive — soft "nonaktifkan" petugas)
 * - role (admin can promote member → staff or demote staff → member)
 *
 * Role changes keep the member profile in sync (member profile is created
 * automatically when a staff is demoted to member, and kept when promoted).
 * The actor can never change their own role/status (prevents lockout).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actor = await getCurrentUser();
    if (!actor) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(actor.role, 'user:update')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [target] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        roleId: users.roleId,
        roleName: roles.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1);
    if (!target) {
      return NextResponse.json({ error: 'USER_NOT_FOUND: Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Prevent an admin from demoting/deactivating themselves (lockout guard).
    if (target.id === actor.id) {
      return NextResponse.json({ error: 'Anda tidak dapat mengubah akun sendiri.' }, { status: 400 });
    }
    // Never touch admin accounts through this endpoint — only staff/member.
    if (target.roleName === 'admin') {
      return NextResponse.json({ error: 'Akun admin tidak dapat diubah di sini.' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data tidak valid.' }, { status: 400 });
    }
    const data = parsed.data;

    const values: Record<string, any> = { updatedAt: new Date() };
    if (data.name !== undefined) values.name = data.name;
    if (data.status !== undefined) values.status = data.status;
    if (data.email !== undefined) {
      const [emailExists] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(sql`lower(${users.email}) = lower(${data.email})`, sql`${users.id} != ${id}`))
        .limit(1);
      if (emailExists) return NextResponse.json({ error: 'Email sudah digunakan.' }, { status: 409 });
      values.email = data.email;
    }

    let roleChanged = false;
    let demoteToMember = false;
    if (data.role !== undefined && data.role !== target.roleName) {
      const [targetRole] = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, data.role))
        .limit(1);
      if (!targetRole) {
        return NextResponse.json({ error: `Role "${data.role}" tidak ditemukan.` }, { status: 400 });
      }
      values.roleId = targetRole.id;
      roleChanged = true;
      demoteToMember = data.role === 'member';
    }

    // Demoting staff → member: ensure a member profile exists so the account
    // can borrow books. Promotion keeps the profile (history intact).
    // Role + profile change run in one transaction so they never diverge.
    if (demoteToMember) {
      await db.transaction(async (tx) => {
        await tx.update(users).set(values).where(eq(users.id, id));
        const [memberRow] = await tx
          .select({ id: members.id })
          .from(members)
          .where(eq(members.userId, id))
          .limit(1);
        if (!memberRow) {
          await tx.insert(members).values({
            userId: id,
            memberCode: generateMemberCode(),
            joinDate: new Date().toISOString().slice(0, 10),
            // Sync with account status: an inactive user does not get an
            // active member profile.
            status: (values.status ?? target.status) !== 'inactive',
          });
        }
      });
    } else {
      await db.update(users).set(values).where(eq(users.id, id));
    }

    await createAuditLog({
      userId: actor.id,
      action: 'UPDATE',
      module: 'USERS',
      description: [
        'Edit pengguna',
        target.name,
        roleChanged ? `(role ${target.roleName} → ${data.role})` : null,
      ]
        .filter(Boolean)
        .join(' '),
    });

    return NextResponse.json({ id, role: data.role ?? target.roleName, status: values.status ?? target.status });
  } catch (error: any) {
    console.error('PATCH /api/users/:id error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Email sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui pengguna.' }, { status: 500 });
  }
}
