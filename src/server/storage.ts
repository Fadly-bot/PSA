import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Storage client (server-side).
 *
 * Bucket: `book-covers` (see docs/STORAGE.md).
 * - File name format: `<uuid>-<slug>.<extension>`
 * - Allowed: JPG, JPEG, PNG, WebP
 * - Max size: 5 MB
 *
 * Uses the service-role key so uploads happen server-side after
 * authorization (staff/admin only). The public URL is what gets stored
 * in `books.cover_image`.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'book-covers';

function getClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('STORAGE_NOT_CONFIGURED: Supabase URL / service role key belum dikonfigurasi.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/** Validate a cover file against STORAGE.md rules. Throws with a safe message. */
export function validateCoverFile(file: { name: string; type: string; size: number }): void {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error('Format file tidak diizinkan. Gunakan JPG, JPEG, PNG, atau WebP.');
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error('Ekstensi file tidak diizinkan. Gunakan JPG, JPEG, PNG, atau WebP.');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Ukuran file maksimal 5 MB.');
  }
}

/**
 * Upload a book cover to the `book-covers` bucket.
 * Returns the public URL to store in `books.cover_image`.
 */
export async function uploadBookCover(file: ArrayBuffer, fileMeta: { name: string; type: string; size: number }, slug: string): Promise<string> {
  validateCoverFile(fileMeta);

  const client = getClient();
  const ext = fileMeta.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const fileName = `${crypto.randomUUID()}-${slug}.${ext}`;

  const { error } = await client.storage
    .from(BUCKET)
    .upload(fileName, file, { contentType: fileMeta.type, upsert: false });

  if (error) {
    throw new Error('COVER_UPLOAD_FAILED: Gagal mengunggah cover.');
  }

  const { data: publicData } = client.storage.from(BUCKET).getPublicUrl(fileName);
  return publicData.publicUrl;
}

/** Delete a cover file by path (or URL) from the bucket. Best-effort. */
export async function deleteBookCover(pathOrUrl: string): Promise<void> {
  if (!pathOrUrl) return;
  let path = pathOrUrl;
  if (pathOrUrl.startsWith('http')) {
    const url = new URL(pathOrUrl);
    path = url.pathname.split('/').pop() ?? pathOrUrl;
  }
  try {
    const client = getClient();
    await client.storage.from(BUCKET).remove([path]);
  } catch {
    // Best-effort cleanup; never fails the caller.
  }
}

/** Test connectivity to the configured bucket (used by settings/status). */
export async function testStorage(): Promise<{ ok: boolean; message: string }> {
  try {
    const client = getClient();
    const { error } = await client.storage.from(BUCKET).list('', { limit: 1 });
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Storage terhubung' };
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Storage belum dikonfigurasi' };
  }
}
