import { NextResponse } from 'next/server';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db/index';
import {
  authors,
  bookInventories,
  bookSources,
  books,
  borrowings,
  borrowingDetails,
  categories,
  members,
  publishers,
  shelves,
  users,
} from '@/db/schema';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';

export const runtime = 'nodejs';

/** Escape a CSV cell per RFC 4180. */
function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(csvCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvCell).join(','));
  }
  // BOM so Excel recognizes UTF-8.
  return '\uFEFF' + lines.join('\r\n');
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'report:read')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'books';
    const format = searchParams.get('format') ?? 'json';
    const categoryId = searchParams.get('category');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!['books', 'borrowings', 'book-borrowings'].includes(type)) {
      return NextResponse.json({ error: 'INVALID_REPORT_TYPE: Jenis laporan tidak valid.' }, { status: 400 });
    }
    if (!['json', 'csv'].includes(format)) {
      return NextResponse.json({ error: 'INVALID_EXPORT_FORMAT: Format tidak valid.' }, { status: 400 });
    }
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json({ error: 'INVALID_DATE_RANGE: Rentang tanggal tidak valid.' }, { status: 400 });
    }

    let headers: string[] = [];
    let rows: (string | number | null | undefined)[][] = [];
    let data: unknown[] = [];

    if (type === 'books') {
      // Laporan Buku — kolom minimal sesuai PRD: Judul, ISBN, Penulis, Penerbit,
      // Kategori, Kode Inventaris, Sumber Buku, Rak, Kondisi, Status.
      const conditions: any[] = [isNull(books.deletedAt)];
      if (categoryId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId)) {
        conditions.push(eq(books.categoryId, categoryId));
      }
      if (status === 'active' || status === 'inactive') {
        conditions.push(eq(books.status, status));
      }

      const bookRows = await db
        .select({
          id: books.id,
          title: books.title,
          isbn: books.isbn,
          authorName: authors.name,
          publisherName: publishers.name,
          categoryName: categories.name,
          status: books.status,
        })
        .from(books)
        .leftJoin(authors, eq(books.authorId, authors.id))
        .leftJoin(publishers, eq(books.publisherId, publishers.id))
        .leftJoin(categories, eq(books.categoryId, categories.id))
        .where(and(...conditions))
        .orderBy(books.title);

      const invRows = bookRows.length
        ? await db
            .select({
              bookId: bookInventories.bookId,
              inventoryCode: bookInventories.inventoryCode,
              condition: bookInventories.condition,
              status: bookInventories.status,
              sourceName: bookSources.name,
              shelfCode: shelves.code,
            })
            .from(bookInventories)
            .leftJoin(bookSources, eq(bookInventories.sourceId, bookSources.id))
            .leftJoin(shelves, eq(bookInventories.shelfId, shelves.id))
            .where(and(isNull(bookInventories.deletedAt), sql`${bookInventories.bookId} IN (${sql.join(bookRows.map((b) => sql`${b.id}`), sql`, `)})`))
            .orderBy(bookInventories.inventoryCode)
        : [];

      headers = ['Judul', 'ISBN', 'Penulis', 'Penerbit', 'Kategori', 'Kode Inventaris', 'Sumber Buku', 'Rak', 'Kondisi', 'Status'];
      for (const b of bookRows) {
        const invs = invRows.filter((i) => i.bookId === b.id);
        if (invs.length === 0) {
          rows.push([b.title, b.isbn, b.authorName ?? '', b.publisherName ?? '', b.categoryName ?? '', '', '', '', '', b.status]);
        } else {
          for (const inv of invs) {
            rows.push([b.title, b.isbn, b.authorName ?? '', b.publisherName ?? '', b.categoryName ?? '', inv.inventoryCode, inv.sourceName ?? '', inv.shelfCode ?? '', inv.condition, inv.status]);
          }
        }
      }
      data = bookRows;
    } else if (type === 'borrowings') {
      const conditions: any[] = [];
      if (startDate) conditions.push(sql`${borrowings.borrowDate} >= ${startDate}`);
      if (endDate) conditions.push(sql`${borrowings.borrowDate} <= ${endDate}`);
      if (status === 'borrowed' || status === 'returned' || status === 'overdue' || status === 'cancelled') {
        conditions.push(eq(borrowings.status, status));
      }

      const bRows = await db
        .select({
          id: borrowings.id,
          borrowCode: borrowings.borrowCode,
          borrowDate: borrowings.borrowDate,
          dueDate: borrowings.dueDate,
          returnDate: borrowings.returnDate,
          status: borrowings.status,
          memberCode: members.memberCode,
          memberName: users.name,
          inventoryCode: bookInventories.inventoryCode,
          bookTitle: books.title,
        })
        .from(borrowings)
        .leftJoin(members, eq(borrowings.memberId, members.id))
        .leftJoin(users, eq(members.userId, users.id))
        .leftJoin(borrowingDetails, eq(borrowingDetails.borrowingId, borrowings.id))
        .leftJoin(bookInventories, eq(borrowingDetails.bookInventoryId, bookInventories.id))
        .leftJoin(books, eq(bookInventories.bookId, books.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(borrowings.borrowDate));

      headers = ['No Pinjam', 'Anggota', 'Kode Inventaris', 'Judul Buku', 'Tgl Pinjam', 'Jatuh Tempo', 'Tgl Kembali', 'Status'];
      rows = bRows.map((r) => [r.borrowCode, r.memberName ?? r.memberCode, r.inventoryCode ?? '', r.bookTitle ?? '', r.borrowDate, r.dueDate, r.returnDate ?? '', r.status]);
      data = bRows;
    } else {
      // Laporan Buku + Peminjaman (gabungan).
      const conditions: any[] = [];
      if (startDate) conditions.push(sql`${borrowings.borrowDate} >= ${startDate}`);
      if (endDate) conditions.push(sql`${borrowings.borrowDate} <= ${endDate}`);
      if (status === 'borrowed' || status === 'returned' || status === 'overdue' || status === 'cancelled') {
        conditions.push(eq(borrowings.status, status));
      }

      const combined = await db
        .select({
          bookTitle: books.title,
          isbn: books.isbn,
          inventoryCode: bookInventories.inventoryCode,
          memberName: users.name,
          memberCode: members.memberCode,
          borrowCode: borrowings.borrowCode,
          borrowDate: borrowings.borrowDate,
          dueDate: borrowings.dueDate,
          returnDate: borrowings.returnDate,
          status: borrowings.status,
        })
        .from(borrowingDetails)
        .innerJoin(borrowings, eq(borrowingDetails.borrowingId, borrowings.id))
        .innerJoin(bookInventories, eq(borrowingDetails.bookInventoryId, bookInventories.id))
        .innerJoin(books, eq(bookInventories.bookId, books.id))
        .leftJoin(members, eq(borrowings.memberId, members.id))
        .leftJoin(users, eq(members.userId, users.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(borrowings.borrowDate));

      headers = ['Judul Buku', 'ISBN', 'Kode Inventaris', 'Anggota', 'No Pinjam', 'Tgl Pinjam', 'Jatuh Tempo', 'Tgl Kembali', 'Status'];
      rows = combined.map((r) => [r.bookTitle, r.isbn, r.inventoryCode, r.memberName ?? r.memberCode, r.borrowCode, r.borrowDate, r.dueDate, r.returnDate ?? '', r.status]);
      data = combined;
    }

    await createAuditLog({
      userId: user.id,
      action: 'EXPORT',
      module: 'REPORTS',
      description: `Laporan ${type} (${format})`,
    });

    if (format === 'csv') {
      const filename = `laporan-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      return new NextResponse(toCsv(headers, rows), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ type, data, count: data.length });
  } catch (error) {
    console.error('GET /api/reports error', error);
    return NextResponse.json({ error: 'Gagal menghasilkan laporan.' }, { status: 500 });
  }
}
