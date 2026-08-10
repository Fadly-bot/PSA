/**
 * One-shot storage setup for the `book-covers` bucket (idempotent).
 *
 * Why this exists (Phase 3 fix):
 *  - `storage.buckets` had RLS enabled with NO policies, and the `book-covers`
 *    bucket did not exist, so the Storage API rejected every upload with
 *    "new row violates row-level security policy" (AccessDenied).
 *  - The Storage API in this project evaluates object writes as the `anon`
 *    role, so a bucket-scoped anon INSERT policy is required.
 *  - Supabase's normal `createBucket()` call is blocked here because bucket
 *    RLS rejects the INSERT — so we create the bucket + policies directly via
 *    SQL (owner role), mirroring what Supabase provisions for a public bucket.
 *
 * Run against the target database (e.g. production):
 *   npm run db:migrate  # (once)
 *   node --env-file-if-exists=.env.local --import tsx scripts/setup-storage.ts
 *
 * Safe to run multiple times (all statements are idempotent).
 */
import { db } from '../src/db/index';

async function main() {
  try {
    // 1. Create the public bucket (5 MB limit, JPG/JPEG/PNG/WebP per STORAGE.md).
    const created = await db.execute(`
      insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values ('book-covers', 'book-covers', true, 5242880, array['image/jpeg','image/png','image/webp'])
      on conflict (id) do nothing
      returning id, name, public
    `);
    console.log('bucket:', JSON.stringify(created));

    // 2. Bucket metadata policies (public read + service role management).
    await db.execute(`
      do $$
      begin
        if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'buckets' and policyname = 'Public bucket metadata read') then
          create policy "Public bucket metadata read" on storage.buckets
            for select using (true);
        end if;
        if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'buckets' and policyname = 'Service role buckets manage') then
          create policy "Service role buckets manage" on storage.buckets
            for all to service_role using (true) with check (true);
        end if;
      end
      $$;
    `);
    console.log('bucket policies OK');

    // 3. Object policies: public read + anon INSERT (the Storage API in this
    //    project evaluates object writes as the anon role) + service_role full
    //    access for deletes/cleanup. Least privilege: anon cannot update/delete.
    await db.execute(`
      do $$
      begin
        if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public Access') then
          create policy "Public Access" on storage.objects
            for select using (bucket_id = 'book-covers');
        end if;
        if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Anon upload book covers') then
          create policy "Anon upload book covers" on storage.objects
            for insert to anon with check (bucket_id = 'book-covers');
        end if;
        if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Service role objects full access') then
          create policy "Service role objects full access" on storage.objects
            for all to service_role using (true) with check (true);
        end if;
      end
      $$;
    `);
    console.log('object policies OK');

    // 4. Tighten pre-existing broader policies created during earlier debugging
    //    (anon ALL -> INSERT-only, drop unused authenticated policy).
    await db.execute(`
      do $$
      begin
        if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Anon manage book covers') then
          drop policy "Anon manage book covers" on storage.objects;
        end if;
        if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated objects full access') then
          drop policy "Authenticated objects full access" on storage.objects;
        end if;
        if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Authenticated users can upload') then
          drop policy "Authenticated users can upload" on storage.objects;
        end if;
        if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Storage admin objects full access') then
          drop policy "Storage admin objects full access" on storage.objects;
        end if;
      end
      $$;
    `);
    console.log('legacy policies cleaned');

    // 5. Verify.
    const buckets = await db.execute(`select id, name, public from storage.buckets order by name`);
    console.log('buckets:', JSON.stringify(buckets));
    const pol = await db.execute(
      `select tablename, policyname, cmd, roles::text from pg_policies
       where schemaname = 'storage' and (tablename = 'objects' or tablename = 'buckets')
       order by tablename, policyname`,
    );
    console.log('policies:', JSON.stringify(pol));
    console.log('STORAGE SETUP COMPLETE');
  } catch (e: any) {
    console.error('SETUP_FAIL:', (e?.cause?.message ?? e?.message ?? String(e)).slice(0, 500));
    process.exit(1);
  }
  process.exit(0);
}

main();
