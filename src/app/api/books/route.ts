import { NextResponse } from 'next/server';
import { db } from '@/db/index';
import { books, categories, authors, publishers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  const rows = await db.select({
    id: books.id,
    title: books.title,
    isbn: books.isbn,
    publicationYear: books.publicationYear,
    category: categories.name,
    author: authors.name,
    publisher: publishers.name,
  })
    .from(books)
    .leftJoin(categories, eq(books.categoryId, categories.id))
    .leftJoin(authors, eq(books.authorId, authors.id))
    .leftJoin(publishers, eq(books.publisherId, publishers.id))
    .orderBy(desc(books.createdAt));

  return NextResponse.json({ items: rows });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.isbn || !body?.slug) {
    return NextResponse.json({ error: 'title, isbn, slug wajib diisi' }, { status: 400 });
  }

  const [row] = await db.insert(books).values({
    title: body.title,
    isbn: body.isbn,
    slug: body.slug,
    description: body.description ?? null,
    synopsis: body.synopsis ?? null,
    coverImage: body.coverImage ?? null,
    authorId: body.authorId ?? null,
    publisherId: body.publisherId ?? null,
    categoryId: body.categoryId ?? null,
    publicationYear: body.publicationYear ?? null,
    language: body.language ?? null,
    pages: body.pages ?? null,
    status: body.status ?? 'active',
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
