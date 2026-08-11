import { NextResponse } from 'next/server';
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/index';
import {
  bookInventories,
  books,
  borrowings,
  borrowingDetails,
  members,
  users,
} from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';
import { generateBorrowCode } from '@/lib/utils';
import { getSetting } from '@/server/settings';
import type { SelectedFields } from 'drizzle-orm/operations';

export const runtime = 'nodejs';

const createBorrowingSchema = z.object({
  memberId: z.string().uuid('Anggota tidak valid').optional(),
  borrowDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal pinjam tidak valid').optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal jatuh tempo tidak valid').optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  // Staff pick concrete inventories; a self-service member picks a book and
  // the server resolves an available copy automatically.
  inventoryIds: z.array(z.string().uuid('Inventaris tidak valid')).min(1, 'Pilih minimal satu inventaris').optional(),
  bookId: z.string().uuid('Buku tidak valid').optional(),
});

const borrowingSelect: SelectedFields<any, any> = {
  id: borrowings.id,
  borrowCode: borrowings.borrowCode,
  borrowDate: borrowings.borrowDate,
  dueDate: borrowings.dueDate,
  returnDate: borrowings.returnDate,
  status: borrowings.status,
  notes: borrowings.notes,
  createdAt: borrowings.createdAt,
  member: {
    id: members.id,
    memberCode: members.memberCode,
    user: { name: users.name, email: users.email },
  },
  items: sql<string[]>`(
    SELECT COALESCE(json_agg(json_build_object(
      'id', bd.id,
      'inventoryCode', bi.inventory_code,
      'bookTitle', b.title,
      'bookSlug', b.slug,
      'bookId', b.id,
      'coverImage', b.cover_image,
      'condition', bi.condition,
      'status', bi.status
    ) ORDER BY bi.inventory_code), '[]'::json)
    FROM ${borrowingDetails} bd
    JOIN ${bookInventories} bi ON bi.id = bd.book_inventory_id
    JOIN ${books} b ON b.id = bi.book_id
    WHERE bd.borrowing_id = ${borrowings.id}
  )`,
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
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    // Members only see their own borrowings.
    let memberId: string | null = null;
    if (!hasPermission(user.role, 'borrowing:borrow')) {
      const [ownMember] = await db
        .select({ id: members.id })
        .from(members)
        .where(eq(members.userId, user.id))
        .limit(1);
      if (!ownMember) {
        return NextResponse.json({ items: [], page: 1, limit, total: 0, totalPages: 1 });
      }
      memberId = ownMember.id;
      conditions.push(eq(borrowings.memberId, memberId));
    }

    if (q) {
      conditions.push(
        or(
          ilike(borrowings.borrowCode, `%${q}%`),
          ilike(users.name, `%${q}%`),
          ilike(members.memberCode, `%${q}%`),
        )!,
      );
    }
    if (status === 'borrowed' || status === 'returned' || status === 'overdue' || status === 'cancelled') {
      conditions.push(eq(borrowings.status, status));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, [{ count }]] = await Promise.all([
      db
        .select(borrowingSelect)
        .from(borrowings)
        .leftJoin(members, eq(borrowings.memberId, members.id))
        .leftJoin(users, eq(members.userId, users.id))
        .where(where)
        .orderBy(desc(borrowings.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(borrowings)
        .leftJoin(members, eq(borrowings.memberId, members.id))
        .leftJoin(users, eq(members.userId, users.id))
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
    console.error('GET /api/borrowings error', error);
    return NextResponse.json({ error: 'Gagal memuat data peminjaman.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    const canBorrowAny = hasPermission(user.role, 'borrowing:borrow');
    const canBorrowSelf = hasPermission(user.role, 'borrowing:borrow-self');
    if (!canBorrowAny && !canBorrowSelf) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createBorrowingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Data peminjaman tidak valid.' },
        { status: 400 },
      );
    }
    const data = parsed.data;

    let memberId = data.memberId;
    let inventoryIds: string[] = data.inventoryIds ? [...new Set(data.inventoryIds)] : [];
    let borrowDate = data.borrowDate;
    let dueDate = data.dueDate;
    const notes = data.notes;

    // ── Self-service borrow: a member borrows a book for themselves. ──────
    // The server resolves an available copy automatically and applies the
    // library loan rules (maxBorrowDays), reusing the exact same system.
    if (canBorrowSelf && !canBorrowAny) {
      const [ownMember] = await db
        .select({ id: members.id, status: members.status })
        .from(members)
        .where(eq(members.userId, user.id))
        .limit(1);
      if (!ownMember || !ownMember.status) {
        return NextResponse.json({ error: 'MEMBER_BLOCKED: Profil anggota tidak aktif.' }, { status: 400 });
      }
      memberId = ownMember.id;
      if (!data.bookId) {
        return NextResponse.json({ error: 'Data peminjaman tidak valid.' }, { status: 400 });
      }

      const maxBorrowBooks = Number(await getSetting('maxBorrowBooks', 3));
      const maxBorrowDays = Number(await getSetting('maxBorrowDays', 7));
      const today = new Date().toISOString().slice(0, 10);
      const due = new Date(`${today}T00:00:00`);
      due.setDate(due.getDate() + maxBorrowDays);

      const availableRows = await db
        .select({ id: bookInventories.id })
        .from(bookInventories)
        .where(
          and(
            eq(bookInventories.bookId, data.bookId),
            eq(bookInventories.status, 'available'),
            isNull(bookInventories.deletedAt),
          ),
        )
        .limit(maxBorrowBooks);
      if (availableRows.length === 0) {
        return NextResponse.json({ error: 'INVENTORY_NOT_AVAILABLE: Stok buku sedang tidak tersedia.' }, { status: 409 });
      }

      inventoryIds = availableRows.map((r) => r.id);
      borrowDate = today;
      dueDate = due.toISOString().slice(0, 10);
    } else {
      // Staff/admin flow requires an explicit member and concrete inventories.
      if (!memberId || inventoryIds.length === 0) {
        return NextResponse.json({ error: 'Data peminjaman tidak valid.' }, { status: 400 });
      }
    }

    if (dueDate! <= borrowDate!) {
      return NextResponse.json({ error: 'INVALID_DUE_DATE: Tanggal jatuh tempo harus lebih besar dari tanggal pinjam.' }, { status: 400 });
    }

    // Validate member is active.
    const [member] = await db
      .select({ id: members.id, status: members.status, deletedAt: users.deletedAt })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(members.id, memberId!))
      .limit(1);
    if (!member || !member.status || member.deletedAt) {
      return NextResponse.json({ error: 'MEMBER_BLOCKED: Anggota tidak aktif atau tidak dapat meminjam.' }, { status: 400 });
    }

    // Validate the inventories are available and not currently borrowed.
    const inventoryRows = await db
      .select({
        id: bookInventories.id,
        status: bookInventories.status,
        deletedAt: bookInventories.deletedAt,
        bookId: bookInventories.bookId,
        inventoryCode: bookInventories.inventoryCode,
      })
      .from(bookInventories)
      .where(sql`${bookInventories.id} IN (${sql.join(inventoryIds.map((id) => sql`${id}`), sql`, `)})`);

    if (inventoryRows.length !== inventoryIds.length) {
      return NextResponse.json({ error: 'INVENTORY_NOT_FOUND: Salah satu inventaris tidak ditemukan.' }, { status: 400 });
    }
    const notAvailable = inventoryRows.find((inv) => inv.status !== 'available' || inv.deletedAt);
    if (notAvailable) {
      return NextResponse.json({ error: `INVENTORY_NOT_AVAILABLE: Inventaris "${notAvailable.inventoryCode}" sedang tidak tersedia.` }, { status: 409 });
    }

    // Borrow limit from settings (default 3).
    const maxBorrowBooks = Number(await getSetting('maxBorrowBooks', 3));
    if (inventoryIds.length > maxBorrowBooks) {
      return NextResponse.json({ error: `MAX_BORROW_LIMIT: Maksimal ${maxBorrowBooks} buku per peminjaman.` }, { status: 400 });
    }

    // Duplicate active borrowing prevention per inventory.
    const [conflict] = await db
      .select({ id: borrowingDetails.id })
      .from(borrowingDetails)
      .innerJoin(borrowings, eq(borrowingDetails.borrowingId, borrowings.id))
      .where(
        and(
          sql`${borrowingDetails.bookInventoryId} IN (${sql.join(inventoryIds.map((id) => sql`${id}`), sql`, `)})`,
          sql`${borrowings.status} IN ('borrowed', 'overdue')`,
        ),
      )
      .limit(1);
    if (conflict) {
      return NextResponse.json({ error: 'INVENTORY_ALREADY_BORROWED: Salah satu inventaris sedang dipinjam.' }, { status: 409 });
    }

    const borrowCode = generateBorrowCode();

    // Transaction: create borrowing + details + update inventory status.
    const result = await db.transaction(async (tx) => {
      const [borrowing] = await tx
        .insert(borrowings)
        .values({
          memberId: memberId!,
          borrowCode,
          borrowDate: borrowDate!,
          dueDate: dueDate!,
          status: 'borrowed',
          notes: notes ?? null,
        })
        .returning();

      for (const inventoryId of inventoryIds) {
        await tx.insert(borrowingDetails).values({
          borrowingId: borrowing.id,
          bookInventoryId: inventoryId,
        });
        await tx
          .update(bookInventories)
          .set({ status: 'borrowed', updatedAt: new Date() })
          .where(eq(bookInventories.id, inventoryId));
      }

      return borrowing;
    });

    await createAuditLog({
      userId: user.id,
      action: 'BORROW',
      module: 'BORROWINGS',
      description: `Peminjaman ${borrowCode} — ${inventoryIds.length} eksemplar`,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/borrowings error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Kode peminjaman sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal membuat peminjaman.' }, { status: 500 });
  }
}
