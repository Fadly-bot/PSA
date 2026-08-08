import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { borrowings, borrowingDetails, members, users, bookInventories } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  const rows = await db.select({
    id: borrowings.id,
    borrowCode: borrowings.borrowCode,
    memberName: users.name,
    inventoryCode: bookInventories.inventoryCode,
    borrowDate: borrowings.borrowDate,
    dueDate: borrowings.dueDate,
    status: borrowings.status,
  })
    .from(borrowings)
    .leftJoin(members, eq(borrowings.memberId, members.id))
    .leftJoin(users, eq(members.userId, users.id))
    .leftJoin(borrowingDetails, eq(borrowingDetails.borrowingId, borrowings.id))
    .leftJoin(bookInventories, eq(borrowingDetails.bookInventoryId, bookInventories.id))
    .orderBy(desc(borrowings.createdAt));

  return NextResponse.json({ items: rows });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.memberId || !body?.borrowDate || !body?.dueDate) {
    return NextResponse.json({ error: 'memberId, borrowDate, dueDate wajib diisi' }, { status: 400 });
  }

  const [row] = await db.insert(borrowings).values({
    memberId: body.memberId,
    borrowCode: body.borrowCode ?? `BRW-${Date.now().toString(36).toUpperCase()}`,
    borrowDate: body.borrowDate,
    dueDate: body.dueDate,
    status: body.status ?? 'borrowed',
    notes: body.notes ?? null,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
