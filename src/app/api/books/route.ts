import { NextResponse } from 'next/server';
import { and, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/index';
import { authors, bookInventories, books, categories, publishers } from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';
import { slugify } from '@/lib/utils';
import type { SelectedFields } from 'drizzle-orm/operations';

export const runtime = 'nodejs';

const BOOK_FIELDS = [
  'title', 'isbn', 'slug', 'description', 'synopsis', 'coverImage',
  'authorId', 'publisherId', 'categoryId', 'publicationYear', 'language', 'pages', 'status',
] as const;

const createBookSchema = z.object({
  title: z.string().trim().min(3, 'Judul minimal 3 karakter').max(255, 'Judul maksimal 255 karakter'),
  isbn: z.string().trim().min(1, 'ISBN wajib diisi').max(20, 'ISBN maksimal 20 karakter'),
  slug: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  synopsis: z.string().trim().max(5000).nullable().optional(),
  coverImage: z.string().trim().max(500).nullable().optional(),
  authorId: z.string().uuid('Penulis tidak valid').nullable().optional(),
  publisherId: z.string().uuid('Penerbit tidak valid').nullable().optional(),
  categoryId: z.string().uuid('Kategori tidak valid').nullable().optional(),
  publicationYear: z.number().int().min(1000).max(new Date().getFullYear() + 1).nullable().optional(),
  language: z.string().trim().min(2, 'Bahasa minimal 2 karakter').max(50).nullable().optional(),
  pages: z.number().int().min(1).nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

function isValidUuid(value: string | null | undefined): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Build a book select shape joined with master data + inventory counts. */
const bookSelect: SelectedFields<any, any> = {
  id: books.id,
  title: books.title,
  isbn: books.isbn,
  slug: books.slug,
  description: books.description,
  synopsis: books.synopsis,
  coverImage: books.coverImage,
  publicationYear: books.publicationYear,
  language: books.language,
  pages: books.pages,
  status: books.status,
  createdAt: books.createdAt,
  updatedAt: books.updatedAt,
  author: {
    id: authors.id,
    name: authors.name,
  },
  publisher: {
    id: publishers.id,
    name: publishers.name,
  },
  category: {
    id: categories.id,
    name: categories.name,
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const category = searchParams.get('category');
    const author = searchParams.get('author');
    const publisher = searchParams.get('publisher');
    const status = searchParams.get('status');
    const inventoryCode = searchParams.get('inventoryCode')?.trim() ?? '';
    const includeInventories = searchParams.get('includeInventories') === '1';
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') ?? '10')));
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';
    const offset = (page - 1) * limit;

    // Searching by inventory code is restricted to staff/admin (see docs).
    const user = await getCurrentUser();
    const canSearchInventory = hasPermission(user?.role ?? null, 'book:read') && user?.role !== 'member';

    const conditions = [isNull(books.deletedAt), eq(books.status, 'active')];

    const isStaffView =
      hasPermission(user?.role ?? null, 'book:create') ||
      (includeInventories && hasPermission(user?.role ?? null, 'inventory:read'));

    if (!isStaffView && !(searchParams.get('status') === 'active')) {
      // Public catalog only ever shows active books.
      conditions.length = 0;
      conditions.push(isNull(books.deletedAt), eq(books.status, 'active'));
    } else if (status === 'inactive' || status === 'active') {
      // Replace the default active-only filter when staff explicitly filters.
      conditions[1] = eq(books.status, status as 'active' | 'inactive');
    }

    if (q) {
      conditions.push(
        or(
          ilike(books.title, `%${q}%`),
          ilike(books.isbn, `%${q}%`),
          ilike(authors.name, `%${q}%`),
        )!,
      );
    }
    if (inventoryCode && canSearchInventory) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${bookInventories} bi WHERE bi.book_id = ${books.id} AND bi.inventory_code ILIKE ${`%${inventoryCode}%`} AND bi.deleted_at IS NULL)`,
      );
    }
    if (isValidUuid(category)) conditions.push(eq(books.categoryId, category));
    if (isValidUuid(author)) conditions.push(eq(books.authorId, author));
    if (isValidUuid(publisher)) conditions.push(eq(books.publisherId, publisher));

    const where = and(...conditions);

    const orderByMap: Record<string, any> = {
      title: books.title,
      isbn: books.isbn,
      publicationYear: books.publicationYear,
      createdAt: books.createdAt,
      updatedAt: books.updatedAt,
    };
    const orderCol = orderByMap[sortBy] ?? books.createdAt;
    const orderBy = sortOrder === 'asc' ? orderCol : desc(orderCol);

    const [items, [{ count }]] = await Promise.all([
      db
        .select(bookSelect)
        .from(books)
        .leftJoin(authors, eq(books.authorId, authors.id))
        .leftJoin(publishers, eq(books.publisherId, publishers.id))
        .leftJoin(categories, eq(books.categoryId, categories.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(books)
        .leftJoin(authors, eq(books.authorId, authors.id))
        .leftJoin(publishers, eq(books.publisherId, publishers.id))
        .leftJoin(categories, eq(books.categoryId, categories.id))
        .where(where),
    ]);

    // Inventory summary counts per book (total + available).
    const rows: any[] = items.map((b: any) => ({
      ...b,
      totalInventory: 0,
      availableInventory: 0,
    }));

    if (items.length > 0 && (includeInventories || isStaffView)) {
      const ids = items.map((b: any) => b.id);
      const invRows = await db
        .select({
          bookId: bookInventories.bookId,
          status: bookInventories.status,
        })
        .from(bookInventories)
        .where(and(inArray(bookInventories.bookId, ids), isNull(bookInventories.deletedAt)));
      const perBook: Record<string, { total: number; available: number }> = {};
      for (const inv of invRows) {
        perBook[inv.bookId] ??= { total: 0, available: 0 };
        perBook[inv.bookId].total += 1;
        if (inv.status === 'available') perBook[inv.bookId].available += 1;
      }
      for (const row of rows) {
        row.totalInventory = perBook[row.id]?.total ?? 0;
        row.availableInventory = perBook[row.id]?.available ?? 0;
      }

      if (includeInventories) {
        const fullInv = await db
          .select()
          .from(bookInventories)
          .where(and(inArray(bookInventories.bookId, ids), isNull(bookInventories.deletedAt)))
          .orderBy(bookInventories.inventoryCode);
        const byBook: Record<string, any[]> = {};
        for (const inv of fullInv) {
          byBook[inv.bookId] ??= [];
          byBook[inv.bookId].push(inv);
        }
        for (const row of rows) {
          row.inventories = byBook[row.id] ?? [];
        }
      }
    }

    return NextResponse.json({
      items: rows,
      page,
      limit,
      total: Number(count),
      totalPages: Math.max(1, Math.ceil(Number(count) / limit)),
    });
  } catch (error) {
    console.error('GET /api/books error', error);
    return NextResponse.json({ error: 'Gagal memuat data buku.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'book:create')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createBookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Data buku tidak valid.' },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // Auto-generate slug from title when not provided.
    const slug = data.slug?.trim() ? slugify(data.slug) : slugify(data.title);
    if (!slug) return NextResponse.json({ error: 'Slug tidak valid.' }, { status: 400 });

    // Unique ISBN check.
    const [isbnExists] = await db
      .select({ id: books.id })
      .from(books)
      .where(and(eq(books.isbn, data.isbn), isNull(books.deletedAt)))
      .limit(1);
    if (isbnExists) {
      return NextResponse.json({ error: 'ISBN_ALREADY_EXISTS: ISBN sudah digunakan.' }, { status: 409 });
    }

    // Unique slug check.
    const [slugExists] = await db
      .select({ id: books.id })
      .from(books)
      .where(and(eq(books.slug, slug), isNull(books.deletedAt)))
      .limit(1);
    if (slugExists) {
      return NextResponse.json({ error: 'Slug sudah digunakan.' }, { status: 409 });
    }

    // Validate master data references when provided.
    if (data.authorId) {
      const [a] = await db.select({ id: authors.id }).from(authors).where(eq(authors.id, data.authorId)).limit(1);
      if (!a) return NextResponse.json({ error: 'INVALID_AUTHOR: Penulis tidak ditemukan.' }, { status: 400 });
    }
    if (data.publisherId) {
      const [p] = await db.select({ id: publishers.id }).from(publishers).where(eq(publishers.id, data.publisherId)).limit(1);
      if (!p) return NextResponse.json({ error: 'INVALID_PUBLISHER: Penerbit tidak ditemukan.' }, { status: 400 });
    }
    if (data.categoryId) {
      const [c] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, data.categoryId)).limit(1);
      if (!c) return NextResponse.json({ error: 'INVALID_CATEGORY: Kategori tidak ditemukan.' }, { status: 400 });
    }

    const values: Partial<typeof books.$inferInsert> = {
      title: data.title,
      isbn: data.isbn,
      slug,
      description: data.description ?? null,
      synopsis: data.synopsis ?? null,
      coverImage: data.coverImage ?? null,
      authorId: data.authorId ?? null,
      publisherId: data.publisherId ?? null,
      categoryId: data.categoryId ?? null,
      publicationYear: data.publicationYear ?? null,
      language: data.language ?? null,
      pages: data.pages ?? null,
      status: data.status ?? 'active',
    };
    // Only set keys present in the payload so nulls aren't forced.
    for (const key of BOOK_FIELDS) {
      if (!(key in (body ?? {}))) delete (values as Record<string, unknown>)[key];
    }

    const [row] = await db.insert(books).values(values as typeof books.$inferInsert).returning();

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      module: 'BOOKS',
      description: `Tambah buku "${row.title}" (ISBN ${row.isbn})`,
    });

    return NextResponse.json(row, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/books error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'ISBN atau slug sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal menyimpan buku.' }, { status: 500 });
  }
}
