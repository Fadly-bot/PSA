import { NextResponse } from 'next/server';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/index';
import { authors, bookInventories, bookSources, books, categories, publishers, shelves } from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';
import { slugify } from '@/lib/utils';

export const runtime = 'nodejs';

const updateBookSchema = z.object({
  title: z.string().trim().min(3, 'Judul minimal 3 karakter').max(255).optional(),
  isbn: z.string().trim().min(1, 'ISBN wajib diisi').max(20).optional(),
  slug: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  synopsis: z.string().trim().max(5000).nullable().optional(),
  coverImage: z.string().trim().max(500).nullable().optional(),
  authorId: z.string().uuid('Penulis tidak valid').nullable().optional(),
  publisherId: z.string().uuid('Penerbit tidak valid').nullable().optional(),
  categoryId: z.string().uuid('Kategori tidak valid').nullable().optional(),
  publicationYear: z.number().int().min(1000).max(new Date().getFullYear() + 1).nullable().optional(),
  language: z.string().trim().min(2).max(50).nullable().optional(),
  pages: z.number().int().min(1).nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

const bookDetailSelect = {
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
  author: { id: authors.id, name: authors.name },
  publisher: { id: publishers.id, name: publishers.name },
  category: { id: categories.id, name: categories.name },
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [row] = await db
      .select(bookDetailSelect)
      .from(books)
      .leftJoin(authors, eq(books.authorId, authors.id))
      .leftJoin(publishers, eq(books.publisherId, publishers.id))
      .leftJoin(categories, eq(books.categoryId, categories.id))
      .where(and(eq(books.id, id), isNull(books.deletedAt)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: 'BOOK_NOT_FOUND: Buku tidak ditemukan.' }, { status: 404 });
    }

    // Inventory detail (codes, condition, status) is staff/admin only (see docs).
    const user = await getCurrentUser();
    const isStaff = hasPermission(user?.role ?? null, 'inventory:read');
    let inventories: any[] = [];
    if (isStaff) {
      inventories = await db
        .select({
          id: bookInventories.id,
          inventoryCode: bookInventories.inventoryCode,
          condition: bookInventories.condition,
          status: bookInventories.status,
          notes: bookInventories.notes,
          createdAt: bookInventories.createdAt,
          source: { id: bookSources.id, name: bookSources.name },
          shelf: { id: shelves.id, code: shelves.code, name: shelves.name },
        })
        .from(bookInventories)
        .leftJoin(bookSources, eq(bookInventories.sourceId, bookSources.id))
        .leftJoin(shelves, eq(bookInventories.shelfId, shelves.id))
        .where(and(eq(bookInventories.bookId, id), isNull(bookInventories.deletedAt)))
        .orderBy(bookInventories.inventoryCode);
    }

    return NextResponse.json({ ...row, inventories });
  } catch (error) {
    console.error('GET /api/books/:id error', error);
    return NextResponse.json({ error: 'Gagal memuat detail buku.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'book:update')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db
      .select()
      .from(books)
      .where(and(eq(books.id, id), isNull(books.deletedAt)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'BOOK_NOT_FOUND: Buku tidak ditemukan.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateBookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Data buku tidak valid.' },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const values: Record<string, any> = { updatedAt: new Date() };
    if (data.title !== undefined) values.title = data.title;
    if (data.isbn !== undefined) values.isbn = data.isbn;
    if (data.slug !== undefined) values.slug = slugify(data.slug);
    else if (data.title !== undefined) values.slug = slugify(data.title);
    if (data.description !== undefined) values.description = data.description;
    if (data.synopsis !== undefined) values.synopsis = data.synopsis;
    if (data.coverImage !== undefined) values.coverImage = data.coverImage;
    if (data.authorId !== undefined) values.authorId = data.authorId;
    if (data.publisherId !== undefined) values.publisherId = data.publisherId;
    if (data.categoryId !== undefined) values.categoryId = data.categoryId;
    if (data.publicationYear !== undefined) values.publicationYear = data.publicationYear;
    if (data.language !== undefined) values.language = data.language;
    if (data.pages !== undefined) values.pages = data.pages;
    if (data.status !== undefined) values.status = data.status;

    // Uniqueness checks for fields that were changed.
    if (values.isbn && values.isbn !== existing.isbn) {
      const [dup] = await db
        .select({ id: books.id })
        .from(books)
        .where(and(eq(books.isbn, values.isbn), isNull(books.deletedAt), sql`${books.id} != ${id}`))
        .limit(1);
      if (dup) return NextResponse.json({ error: 'ISBN_ALREADY_EXISTS: ISBN sudah digunakan.' }, { status: 409 });
    }
    if (values.slug && values.slug !== existing.slug) {
      const [dup] = await db
        .select({ id: books.id })
        .from(books)
        .where(and(eq(books.slug, values.slug), isNull(books.deletedAt), sql`${books.id} != ${id}`))
        .limit(1);
      if (dup) return NextResponse.json({ error: 'Slug sudah digunakan.' }, { status: 409 });
    }

    const [row] = await db.update(books).set(values).where(eq(books.id, id)).returning();

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      module: 'BOOKS',
      description: `Edit buku "${row.title}" (ISBN ${row.isbn})`,
    });

    return NextResponse.json(row);
  } catch (error: any) {
    console.error('PATCH /api/books/:id error', error);
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'ISBN atau slug sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui buku.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'book:delete')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const [existing] = await db
      .select({ id: books.id, title: books.title })
      .from(books)
      .where(and(eq(books.id, id), isNull(books.deletedAt)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: 'BOOK_NOT_FOUND: Buku tidak ditemukan.' }, { status: 404 });
    }

    // Soft delete.
    await db
      .update(books)
      .set({ deletedAt: new Date(), status: 'inactive', updatedAt: new Date() })
      .where(eq(books.id, id));

    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      module: 'BOOKS',
      description: `Hapus (soft) buku "${existing.title}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/books/:id error', error);
    return NextResponse.json({ error: 'Gagal menghapus buku.' }, { status: 500 });
  }
}
