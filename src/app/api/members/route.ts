import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { members, users, roles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  const rows = await db.select({
    id: members.id,
    memberCode: members.memberCode,
    name: users.name,
    email: users.email,
    phone: members.phone,
    joinDate: members.joinDate,
    status: members.status,
  })
    .from(members)
    .leftJoin(users, eq(members.userId, users.id))
    .orderBy(desc(members.createdAt));

  return NextResponse.json({ items: rows });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.joinDate) {
    return NextResponse.json({ error: 'name, email, joinDate wajib diisi' }, { status: 400 });
  }

  const [user] = await db.insert(users).values({
    name: body.name,
    email: body.email,
    passwordHash: body.password ?? 'changeme',
    roleId: body.roleId ?? null,
  }).returning();

  const [member] = await db.insert(members).values({
    userId: user.id,
    memberCode: body.memberCode ?? `MEM-${Date.now().toString(36).toUpperCase()}`,
    phone: body.phone ?? null,
    address: body.address ?? null,
    birthDate: body.birthDate ?? null,
    joinDate: body.joinDate,
    status: body.status ?? true,
  }).returning();

  return NextResponse.json(member, { status: 201 });
}
