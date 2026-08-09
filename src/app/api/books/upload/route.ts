import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/server/auth-utils';
import { createAuditLog } from '@/server/audit';
import { uploadBookCover } from '@/server/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/books/upload
 * Uploads a book cover to the `book-covers` bucket (Supabase Storage).
 * Body: multipart/form-data with `file` and optional `slug`.
 * Returns { url } — the public URL to store in books.cover_image.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 401 });
    if (!hasPermission(user.role, 'book:update') && !hasPermission(user.role, 'book:create')) {
      return NextResponse.json({ error: 'Tidak memiliki izin.' }, { status: 403 });
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get('file');
    const slug = (formData?.get('slug') as string | null)?.trim() || 'cover';

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const url = await uploadBookCover(buffer, { name: file.name, type: file.type, size: file.size }, slug);

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      module: 'BOOKS',
      description: 'Upload cover buku',
    });

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('POST /api/books/upload error', error);
    const message = error?.message ?? 'Gagal mengunggah cover.';
    const status = message.startsWith('STORAGE_NOT_CONFIGURED') ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
