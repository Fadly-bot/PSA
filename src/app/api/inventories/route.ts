import { NextResponse } from 'next/server';
import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/index';
import { bookInventories, books, bookSources, shelves } from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';

export const runtime = 'nodejs';

const createInventorySchema = z.object({
  inventoryCode: z.string().trim().min(3, 'Kode inventaris minimal 3 karakter').max(50, 'Kode inventaris maksimal 50 karakter'),
  bookId: z.string().uuid('Buku tidak valid'),
  sourceId: z.string().uuid('Sumber buku tidak valid'),
  shelfId: z.string().uuid('Rak tidak valid').nullable().optional(),
  condition: z.enum(['good', 'damaged', 'lost']).optional(),
  status: z.enum(['available', 'borrowed', 'maintenance', 'lost']).optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

const inventorySelect = {
  id: bookInventories.id,
  inventoryCode: bookInventories.inventoryCode,
  condition: bookInventories.condition,
  status: bookInventories.status,
  notes: bookInventories.notes,
  createdAt: bookInventories.createdAt,
  updatedAt: bookInventories.updatedAt,
  book: {
    id: books.id,
    title: books.title,
    isbn: books.isbn,
    slug: books.slug,
  },
  source: { id: bookSources.id, name: bookSources.name },
  shelf: { id: shelves.id, code: shelves.code, name: shelves.name },
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'inventory:read')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const status = searchParams.get('status');
    const condition = searchParams.get('condition');
    const bookId = searchParams.get('bookId');
    const sourceId = searchParams.get('sourceId');
    const shelfId = searchParams.get('shelfId');
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') ?? '10')));
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const offset = (page - 1) * limit;

    const conditions: any[] = [isNull(bookInventories.deletedAt)];

    if (q) {
      conditions.push(
        or(
          ilike(bookInventories.inventoryCode, `%${q}%`),
          ilike(books.title, `%${q}%`),
          ilike(books.isbn, `%${q}%`),
          ilike(shelves.code, `%${q}%`),
          ilike(bookSources.name, `%${q}%`),
        )!,
      );
    }
    if (status === 'available' || status === 'borrowed' || status === 'maintenance' || status === 'lost') {
      conditions.push(eq(bookInventories.status, status));
    }
    if (condition === 'good' || condition === 'damaged' || condition === 'lost') {
      conditions.push(eq(bookInventories.condition, condition));
    }
    if (bookId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookId)) {
      conditions.push(eq(bookInventories.bookId, bookId));
    }
    if (sourceId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sourceId)) {
      conditions.push(eq(bookInventories.sourceId, sourceId));
    }
    if (shelfId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shelfId)) {
      conditions.push(eq(bookInventories.shelfId, shelfId));
    }

    const where = and(...conditions);

    const orderByMap: Record<string, any> = {
      inventoryCode: bookInventories.inventoryCode,
      createdAt: bookInventories.createdAt,
      updatedAt: bookInventories.updatedAt,
      status: bookInventories.status,
      condition: bookInventories.condition,
    };
    const orderCol = orderByMap[sortBy] ?? bookInventories.createdAt;
    const orderBy = sortOrder === 'asc' ? orderCol : desc(orderCol);

    const [items, [{ count }]] = await Promise.all([
      db
        .select(inventorySelect)
        .from(bookInventories)
        .leftJoin(books, eq(bookInventories.bookId, books.id))
        .leftJoin(bookSources, eq(bookInventories.sourceId, bookSources.id))
        .leftJoin(shelves, eq(bookInventories.shelfId, shelves.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(bookInventories)
        .leftJoin(books, eq(bookInventories.bookId, books.id))
        .leftJoin(bookSources, eq(bookInventories.sourceId, bookSources.id))
        .leftJoin(shelves, eq(bookInventories.shelfId, shelves.id))
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
    console.error('GET /api/inventories error', error);
    return NextResponse.json({ error: 'Gagal memuat data inventaris.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'inventory:create')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createInventorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Data inventaris tidak valid.' },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // Referential validation.
    const [book] = await db
      .select({ id: books.id, status: books.status, deletedAt: books.deletedAt })
      .from(books)
      .where(eq(books.id, data.bookId))
      .limit(1);
    if (!book || book.deletedAt || book.status !== 'active') {
      return NextResponse.json({ error: 'INVALID_BOOK: Buku tidak ditemukan atau tidak aktif.' }, { status: 400 });
    }
    const [source] = await db.select({ id: bookSources.id }).from(bookSources).where(eq(bookSources.id, data.sourceId)).limit(1);
    if (!source) return NextResponse.json({ error: 'INVALID_BOOK_SOURCE: Sumber buku tidak ditemukan.' }, { status: 400 });
    if (data.shelfId) {
      const [shelf] = await db.select({ id: shelves.id }).from(shelves).where(eq(shelves.id, data.shelfId)).limit(1);
      if (!shelf) return NextResponse.json({ error: 'INVALID_SHELF: Rak tidak ditemukan.' }, { status: 400 });
    }

    // Unique inventory code.
    const [dup] = await db
      .select({ id: bookInventories.id })
      .from(bookInventories)
      .where(and(eq(bookInventories.inventoryCode, data.inventoryCode), isNull(bookInventories.deletedAt)))
      .limit(1);
    if (dup) return NextResponse.json({ error: 'INVENTORY_CODE_EXISTS: Kode inventaris sudah digunakan.' }, { status: 409 });

    const [row] = await db
      .insert(bookInventories)
      .values({
        inventoryCode: data.inventoryCode,
        bookId: data.bookId,
        sourceId: data.sourceId,
        shelfId: data.shelfId ?? null,
        condition: data.condition ?? 'good',
        status: data.status ?? 'available',
        notes: data.notes ?? null,
      })
      .returning();

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      module: 'BOOK_INVENTORIES',
      description: `Tambah inventaris "${data.inventoryCode}"`,
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/inventories error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'INVENTORY_CODE_EXISTS: Kode inventaris sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal menyimpan inventaris.' }, { status: 500 });
  }
}
