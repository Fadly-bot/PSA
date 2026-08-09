Responsif Audit:

Lakukan responsive UI audit pada seluruh aplikasi TBM Semesta Alam.

Jangan mengubah desain utama jika tidak diperlukan.

Periksa seluruh halaman publik dan dashboard pada minimal breakpoint:

- mobile: 320px
- mobile: 375px
- mobile: 390px
- mobile: 430px
- tablet: 768px
- laptop: 1024px
- desktop: 1280px
- large desktop: 1440px+

Periksa:

- navbar
- sidebar/dashboard
- tabel
- card
- form
- button
- input
- modal/dialog
- pagination
- search/filter
- gambar cover buku
- typography
- spacing
- overflow horizontal
- grid/flex layout
- halaman kosong/loading/error
- katalog publik
- detail buku
- login/register

Pastikan tidak ada:
- horizontal scrolling yang tidak diperlukan
- teks terpotong
- tombol keluar layar
- tabel merusak layout mobile
- gambar keluar container
- navbar bertabrakan
- form terlalu lebar
- sidebar menutupi konten

Gunakan responsive CSS/Tailwind yang sudah digunakan project.
Jangan mengganti arsitektur atau desain secara keseluruhan.

Setelah audit:
1. Perbaiki masalah responsive yang ditemukan.
2. Jalankan typecheck.
3. Jalankan lint.
4. Jalankan build.
5. Laporkan breakpoint dan masalah yang diperbaiki.

Jangan mengklaim responsive jika belum diverifikasi.
***
Gunakan gambar terlampir sebagai logo resmi TBM Semesta Alam. Jangan membuat ulang atau mengganti desain logo. Gunakan gambar ini sebagai sumber asset untuk integrasi navbar, favicon, metadata, dan Open Graph.

TASK: Integrasikan logo resmi TBM Semesta Alam ke dalam aplikasi yang sudah ada.

PENTING:
- Jangan mengubah desain, layout, warna, spacing, typography, atau komponen website yang sudah ada selain bagian yang memang diperlukan untuk memasukkan logo.
- Jangan membuat ulang navbar.
- Jangan mengubah struktur halaman yang sudah bekerja.
- Jangan mengubah business logic, API, database, authentication, RBAC, atau fitur lainnya.
- Jangan mengganti logo dengan logo buatan AI atau placeholder.
- Gunakan file logo yang saya berikan sebagai sumber logo resmi.

LOGO:
Logo terdiri dari:
- ikon/teks "TBM"
- tulisan "Semesta Alam"
- tagline "Taman Bacaan Masyarakat"

Gunakan logo tersebut sebagai identitas resmi aplikasi dengan nama:
"TBM Semesta Alam"

==================================================
1. SIAPKAN ASSET LOGO
==================================================

Jika file logo belum berada di folder public/, tempatkan/copy asset logo ke:

public/logo-tbm-semesta-alam.png

Jika format/path asset sudah tersedia, gunakan asset yang sudah ada dan jangan membuat duplikat.

Jangan mengedit isi logo.

Pastikan asset dapat diakses secara publik oleh Next.js.

==================================================
2. NAVBAR
==================================================

Integrasikan logo ke navbar yang SUDAH ADA.

Ketentuan:
- Gunakan logo TBM sebagai bagian identitas sebelah kiri navbar.
- Pertahankan menu navbar yang sudah ada.
- Jangan mengubah desain navbar secara keseluruhan.
- Jangan mengubah warna atau style menu yang sudah ada kecuali penyesuaian spacing minimum agar logo terlihat rapi.
- Logo harus responsive.
- Pada desktop, tampilkan logo dengan ukuran yang proporsional.
- Pada mobile, jangan sampai logo menyebabkan navbar overflow.
- Jika navbar menggunakan link ke homepage, logo harus menjadi link ke `/`.

Gunakan Next.js `Image` jika sesuai dengan implementasi project.

Contoh konsep:

[LOGO TBM]  menu-menu yang sudah ada

Bukan:

[TBM] [Semesta Alam] sebagai teks terpisah.

Gunakan asset logo resmi sebagai satu kesatuan.

==================================================
3. FAVICON
==================================================

Gunakan bagian "TBM" dari logo sebagai identitas favicon.

Jika memungkinkan tanpa merusak kualitas:
- gunakan asset logo yang sesuai untuk favicon/icon
- favicon harus tetap terlihat jelas pada ukuran kecil
- jangan gunakan seluruh logo horizontal jika hasilnya terlalu kecil/tidak terbaca

Implementasikan menggunakan mekanisme icon Next.js App Router yang sesuai dengan struktur project.

Prioritaskan:

src/app/icon.png

atau mekanisme metadata icon yang sesuai.

Jika diperlukan, buat asset favicon/icon dari logo yang diberikan tanpa mengubah identitas visual TBM.

Jangan mengubah favicon menjadi ikon generik Next.js.

==================================================
4. METADATA WEBSITE
==================================================

Periksa:

src/app/layout.tsx

Gunakan Next.js Metadata API.

Pastikan metadata utama menggunakan:

title:
"TBM Semesta Alam"

description:
"Taman Bacaan Masyarakat Semesta Alam"

Jika dokumentasi project memiliki description resmi yang lebih spesifik, gunakan description tersebut.

Tambahkan metadata icon/favicon yang sesuai.

Jangan menggunakan metadata dari template Next.js bawaan.

==================================================
5. OPEN GRAPH
==================================================

Tambahkan Open Graph metadata untuk website.

Gunakan logo TBM sebagai image jika asset tersebut cocok untuk Open Graph.

Minimal:

openGraph:
- title: "TBM Semesta Alam"
- description: deskripsi resmi TBM Semesta Alam
- url: production URL
- siteName: "TBM Semesta Alam"
- type: "website"
- images: logo/OG image yang tersedia

Jika menggunakan logo horizontal sebagai OG image dan dimensinya tidak ideal, jangan memaksakan asset favicon. Gunakan asset yang paling sesuai dari logo yang tersedia.

Jangan membuat desain website baru.

==================================================
6. TWITTER / SOCIAL METADATA
==================================================

Jika project memang menggunakan metadata sosial:

Tambahkan metadata Twitter/X yang relevan:

- card: "summary_large_image"
- title: "TBM Semesta Alam"
- description: deskripsi resmi
- images: asset logo/OG image yang sesuai

Jangan menambahkan informasi sosial yang tidak tersedia.

==================================================
7. PRODUCTION URL
==================================================

Jangan hardcode:

http://localhost
localhost:3000

Gunakan environment variable production base URL yang sudah digunakan project.

Jika belum ada environment variable untuk site URL, periksa dokumentasi project terlebih dahulu.

Gunakan pola yang konsisten, misalnya:

NEXT_PUBLIC_SITE_URL

Tetapi JANGAN membuat environment variable baru jika project sudah memiliki variable resmi untuk production URL.

==================================================
8. SEO HALAMAN PUBLIK
==================================================

Periksa halaman publik yang sudah ada.

Pastikan homepage menggunakan:

"TBM Semesta Alam"

sebagai title/brand.

Jangan mengubah tampilan visual halaman.

Jika halaman katalog dan detail buku publik sudah tersedia, metadata dapat dibuat dinamis sesuai dokumentasi SEO yang sudah ada.

Untuk detail buku:

- title unik berdasarkan judul buku
- description relevan
- canonical URL
- Open Graph metadata jika diperlukan

Jangan memasukkan:
- data user
- email
- informasi admin
- data internal
- data authentication
- informasi private database

ke metadata publik.

==================================================
9. FAVICON VS LOGO NAVBAR
==================================================

PENTING:

Navbar:
gunakan logo lengkap TBM Semesta Alam.

Favicon:
gunakan bagian/logo TBM yang tetap terbaca pada ukuran kecil.

Jangan memaksa seluruh logo horizontal menjadi favicon jika menyebabkan tulisan "Semesta Alam" tidak terbaca.

==================================================
10. JANGAN MENGUBAH HAL LAIN
==================================================

Jangan mengubah:

- database
- schema
- migrations
- Better Auth
- RBAC
- API
- business logic
- dashboard
- master data
- borrowing
- inventory
- styling website yang tidak berkaitan dengan logo
- struktur navigasi
- layout halaman lainnya

Hanya lakukan perubahan yang diperlukan untuk:
1. asset logo
2. navbar
3. favicon/icon
4. metadata
5. Open Graph
6. Twitter metadata jika relevan
7. canonical/site URL jika memang diperlukan untuk metadata

==================================================
11. VERIFIKASI
==================================================

Setelah implementasi:

1. Jalankan type-check.
2. Jalankan build.
3. Pastikan tidak ada TypeScript error.
4. Pastikan homepage tetap dapat dibuka.
5. Pastikan logo navbar tampil.
6. Pastikan favicon/icon terdeteksi.
7. Pastikan metadata `<title>` menggunakan "TBM Semesta Alam".
8. Pastikan Open Graph metadata tersedia.
9. Pastikan tidak ada perubahan desain website yang tidak berkaitan dengan task ini.

Jika ada error, perbaiki error tersebut tanpa mengubah scope.

==================================================
FINAL REPORT
==================================================

Berikan laporan singkat:

- Asset logo yang digunakan
- File yang dibuat
- File yang diubah
- Navbar: PASS/FAIL
- Favicon: PASS/FAIL
- Metadata: PASS/FAIL
- Open Graph: PASS/FAIL
- Type-check: PASS/FAIL
- Build: PASS/FAIL

Jangan mengklaim deployment atau Google Search Console berhasil karena task ini hanya integrasi logo dan metadata.
***
Setelah logo selesai, lakukan final:

- `npm run typecheck`
- `npm run build`
- cek navbar
- cek favicon
- cek metadata
- cek Open Graph
***
Untuk Vercel:

Lakukan FINAL PRODUCTION ENVIRONMENT AUDIT untuk aplikasi TBM Semesta Alam.

Jangan mengubah kode kecuali memang diperlukan untuk production configuration.

Periksa seluruh source code dan konfigurasi:

- package.json
- next.config.ts
- drizzle.config.ts
- src/db/
- src/server/
- src/app/
- Better Auth configuration
- database connection
- storage configuration
- SEO configuration
- sitemap
- robots
- authentication
- admin functionality

Cari seluruh penggunaan process.env dan environment variable lain di project.

Tentukan environment variable mana yang WAJIB tersedia di Vercel Production.

Untuk setiap variable, berikan:

1. Nama variable
2. Fungsi
3. Apakah wajib atau opsional
4. Apakah digunakan server-side atau client-side
5. Apakah perlu Environment: Production
6. Dari mana nilainya harus diperoleh
7. Apakah aman menggunakan value yang sama dengan local atau harus berbeda
8. Apakah variable tersebut merupakan secret

JANGAN menampilkan nilai secret yang sedang digunakan.
JANGAN mengarang nilai environment variable.

Khusus periksa:

- DATABASE_URL
- BETTER_AUTH_SECRET
- Better Auth trusted origins / base URL
- production site URL
- storage credentials jika digunakan
- public environment variables
- API secrets jika ada

Periksa juga apakah:

NEXT_PUBLIC_SITE_URL

atau nama variable production URL lainnya benar-benar digunakan oleh aplikasi.

Pastikan tidak ada localhost yang digunakan sebagai production URL.

Periksa apakah .env.local sudah benar-benar di-ignore oleh Git.

Jalankan:

npm run typecheck
npm run build

Jika tersedia, lakukan pengecekan konfigurasi production.

Setelah selesai, buat bagian laporan:

# Vercel Environment Variables

| Variable | Required | Secret | Environment | Source |
|---|---|---|---|---|

Kemudian buat:

# Vercel Deployment Checklist

- Environment variables
- Database
- Better Auth
- Production URL
- Storage
- Build
- Migration
- Admin
- SEO
- Sitemap
- Robots

Jangan mengklaim deployment berhasil.

Jangan memberikan nilai secret.

Berhenti setelah laporan.
***
Untuk Gambar :
![[ChatGPT Image 9 Agu 2026, 10.33.54.png]]
***
All verifications pass. The audit is complete — one justified fix was made ( .env.production  added to  .gitignore , matching the explicit requirement in  docs/DEPLOYMENT.md ).
────────────────────────────────────────────────────────────────────────────────
TBM Semesta Alam — Final Production Environment Audit
Overall Status
READY FOR VERCEL ENV
Tidak ada blocking issue. Satu perbaikan keamanan kecil diterapkan:  .env.production  ditambahkan ke  .gitignore  (dokumentasi  docs/DEPLOYMENT.md  memang mewajibkannya).
Environment Variables Discovered
Semua variable di bawah benar-benar direferensikan oleh kode (hasil  grep process.env.*  di seluruh  src/ ,  scripts/ , dan config):
┌──────────────────────────┬────────────────────────────────────────────────────────────┬──────────────────────────────────────────────┬────────────────────────┐
│ Variable                 │ File Pengguna                                              │ Fungsi                                       │ Required               │
├──────────────────────────┼────────────────────────────────────────────────────────────┼──────────────────────────────────────────────┼────────────────────────┤
│ DATABASE_URL             │ src/db/index.ts, drizzle.config.ts                         │ Koneksi PostgreSQL (runtime + migration +    │ ✅ Ya                  │
│                          │                                                            │ CLI admin)                                   │                        │
│ BETTER_AUTH_SECRET       │ src/server/auth.ts                                         │ Secret signing session Better Auth           │ ✅ Ya                  │
│ BETTER_AUTH_URL          │ src/server/auth.ts (baseURL), src/app/layout.tsx (fallback │ Base URL auth server                         │ ✅ Ya                  │
│                          │ SITE_URL)                                                  │                                              │                        │
│ NEXT_PUBLIC_BETTER_AUTH_ │ src/lib/auth-client.ts                                     │ Base URL auth untuk client browser           │ ✅ Ya                  │
│ URL                      │                                                            │                                              │                        │
│ NEXT_PUBLIC_SITE_URL     │ src/app/layout.tsx → canonical/OG/sitemap/robots           │ Base URL production untuk SEO                │ ✅ Ya                  │
│ NEXT_PUBLIC_SUPABASE_URL │ src/server/storage.ts                                      │ URL proyek Supabase (storage cover)          │ ⚠️ Jika pakai cover    │
│                          │                                                            │                                              │ upload                 │
│ SUPABASE_SERVICE_ROLE_KE │ src/server/storage.ts                                      │ Service role key (server-only) untuk upload  │ ⚠️ Jika pakai cover    │
│ Y                        │                                                            │ cover                                        │ upload                 │
│ ADMIN_EMAIL              │ scripts/create-admin.ts                                    │ Email admin bootstrap (CLI)                  │ ❌ Optional (CLI saja) │
│ ADMIN_PASSWORD           │ scripts/create-admin.ts                                    │ Password admin bootstrap (CLI)               │ ❌ Optional (CLI saja) │
│ ADMIN_NAME               │ scripts/create-admin.ts                                    │ Nama admin bootstrap (CLI)                   │ ❌ Optional (CLI saja) │
└──────────────────────────┴────────────────────────────────────────────────────────────┴──────────────────────────────────────────────┴────────────────────────┘
Tidak digunakan oleh kode:
-  NEXT_PUBLIC_SUPABASE_ANON_KEY  — 0 referensi di  src/ . Hanya disebut  docs/DEPLOYMENT.md  dan  .env.example  (dengan catatan). Bukan variable yang dipakai aplikasi; dipertahankan sebagai kandidat cleanup — tidak dihapus karena dokumentasi menyebutkannya.
Required Production Variables
1.  DATABASE_URL
2.  BETTER_AUTH_SECRET
3.  BETTER_AUTH_URL
4.  NEXT_PUBLIC_BETTER_AUTH_URL
5.  NEXT_PUBLIC_SITE_URL
6.  NEXT_PUBLIC_SUPABASE_URL  +  SUPABASE_SERVICE_ROLE_KEY  (hanya jika fitur upload cover diaktifkan)
Public Variables
Aman di-expose ke client (bukan secret,  NEXT_PUBLIC_  tepat):
-  NEXT_PUBLIC_BETTER_AUTH_URL
-  NEXT_PUBLIC_SITE_URL
-  NEXT_PUBLIC_SUPABASE_URL  (nilainya memang public)
Secret Variables (server-only)
Jangan pernah dimasukkan ke  NEXT_PUBLIC_*  atau di-commit:
-  BETTER_AUTH_SECRET  🔒
-  DATABASE_URL  🔒
-  SUPABASE_SERVICE_ROLE_KEY  🔒
-  ADMIN_PASSWORD  🔒 (CLI)
Database
- PostgreSQL (Supabase PostgreSQL / Postgres apa pun) — driver  postgres  (postgres-js), ORM Drizzle.
-  DATABASE_URL  → dibaca oleh  src/db/index.ts  (runtime Next.js),  drizzle.config.ts  (migration/studio/generate).
- Format: connection string PostgreSQL standar ( postgresql://user:password@host:port/dbname ) — cocok dengan driver postgres-js. Gunakan connection string langsung Supabase (bukan pooling mode yang salah); jika koneksi Supabase default terbatas, gunakan connection string dengan port pooling yang disediakan Supabase (5763) bila perlu.
- ✅ Tidak ada password hardcoded, tidak ada localhost untuk production (fallback localhost hanya untuk dev).
- Build lokal tidak memerlukan DB (46/46 halaman ter-compile tanpa DB aktif) → aman untuk Vercel build.
Better Auth
-  BETTER_AUTH_SECRET  — wajib, server-only, di-generate sendiri oleh user ( openssl rand -base64 32 ). Jangan gunakan fallback dev ( dev-insecure-secret-change-me ) di production.
-  BETTER_AUTH_URL  — wajib HTTPS domain production (no trailing slash).
-  NEXT_PUBLIC_BETTER_AUTH_URL  — wajib, sama dengan  BETTER_AUTH_URL , untuk  authClient  di browser.
- Trusted origins: tidak ada  trustedOrigins  eksplisit di  src/server/auth.ts  — Better Auth menurunkan trusted origin dari  baseURL  ( BETTER_AUTH_URL ). Aman selama  BETTER_AUTH_URL  = domain production HTTPS. (Non-blocking: jika akses via custom domain +  *.vercel.app  bersamaan, tambahkan  trustedOrigins .)
- Cookies: Better Auth otomatis menggunakan secure cookie saat  baseURL  HTTPS. Tidak ada  cookieCache / useSecureCookies  manual — default sudah benar untuk production.
- ✅ Supabase Auth tidak digunakan — autentikasi 100% Better Auth.
Supabase Storage
- Supabase hanya dipakai untuk storage cover buku ( src/server/storage.ts , bucket  book-covers ).
-  NEXT_PUBLIC_SUPABASE_URL  +  SUPABASE_SERVICE_ROLE_KEY  → server-side only (module  src/server/storage.ts , dipanggil dari API route  /api/books/upload  yang ter-authorize staff/admin).
- ✅ Service role key tidak pernah: dipakai di client component, dikirim ke browser, masuk  NEXT_PUBLIC_* , hardcoded, atau masuk Git.
-  NEXT_PUBLIC_SUPABASE_ANON_KEY  — tidak dipakai kode (storage memakai service role key). Boleh diisi di Vercel, tidak wajib.
- Jika storage tidak dikonfigurasi, upload cover akan error  STORAGE_NOT_CONFIGURED  — fitur lain tetap berjalan.
SEO
-  NEXT_PUBLIC_SITE_URL  → export  SITE_URL  di  src/app/layout.tsx  →  metadataBase , canonical, Open Graph ( og:url ), Twitter,  sitemap.ts ,  robots.ts .
- ✅ Sitemap & robots runtime/dynamic ( force-dynamic ), memakai  SITE_URL  dari env — bukan hardcoded.
- ✅ Tidak ada  http://localhost  /  http://127.0.0.1  sebagai URL production; fallback localhost hanya dev.
- ⚠️ Domain production belum diketahui → gunakan placeholder  https://<PRODUCTION-DOMAIN>  dan user wajib menggantinya dengan domain Vercel/custom domain sebenarnya.
Git Security
- ✅  .gitignore  kini mencakup:  .env ,  .env.local ,  .env*.local ,  .env.production ,  .env*.production  (+  .obsidian/ ,  .next/ ,  node_modules/ ).
- ✅  git ls-files  → tidak ada  .env*  ter-track (hanya  next-env.d.ts  yang kebetulan mengandung "env").
- ✅  .env.local  → tidak dikenal Git ( did not match any file ).
- ✅ Secret scan di  src/ ,  scripts/ , config → tidak ada pattern  postgres://user:pass@ ,  sk-... , JWT hardcoded (hanya fallback localhost dev yang wajar).
- ✅ Tidak ada  console.log(secret)  atau API yang membocorkan secret.
- Sejarah commit: tidak ditemukan secret yang pernah masuk (scan 3 commit terakhir kosong).
Vercel Configuration
Variable yang harus diisi di Vercel → Project → Settings → Environment Variables:
PRODUCTION (REQUIRED):
┌─────────────────────────────┬─────────────────────────────────────────┐
│ Variable                    │ Nilai                                   │
├─────────────────────────────┼─────────────────────────────────────────┤
│ DATABASE_URL                │ <POSTGRES_PRODUCTION_CONNECTION_STRING> │
│ BETTER_AUTH_SECRET          │ <GENERATE_PRODUCTION_SECRET>            │
│ BETTER_AUTH_URL             │ https://<PRODUCTION-DOMAIN>             │
│ NEXT_PUBLIC_BETTER_AUTH_URL │ https://<PRODUCTION-DOMAIN>             │
│ NEXT_PUBLIC_SITE_URL        │ https://<PRODUCTION-DOMAIN>             │
└─────────────────────────────┴─────────────────────────────────────────┘
PRODUCTION (jika cover upload aktif):
┌───────────────────────────┬───────────────────────────────┐
│ Variable                  │ Nilai                         │
├───────────────────────────┼───────────────────────────────┤
│ NEXT_PUBLIC_SUPABASE_URL  │ https://<PROJECT>.supabase.co │
│ SUPABASE_SERVICE_ROLE_KEY │ <SERVICE_ROLE_KEY> (secret)   │
└───────────────────────────┴───────────────────────────────┘
PREVIEW (disarankan — agar preview & sitemap test berfungsi):
┌─────────────────────────────┬───────────────────────────────────────────────────┐
│ Variable                    │ Nilai                                             │
├─────────────────────────────┼───────────────────────────────────────────────────┤
│ NEXT_PUBLIC_BETTER_AUTH_URL │ https://<preview-domain>.vercel.app               │
│ NEXT_PUBLIC_SITE_URL        │ https://<preview-domain>.vercel.app               │
│ BETTER_AUTH_URL             │ https://<preview-domain>.vercel.app               │
│ BETTER_AUTH_SECRET          │ nilai sama dengan production (agar session valid) │
│ DATABASE_URL                │ boleh pakai DB dev/test terpisah                  │
└─────────────────────────────┴───────────────────────────────────────────────────┘
DEVELOPMENT: cukup  .env.local  lokal (sudah berisi  DATABASE_URL ,  BETTER_AUTH_SECRET ,  BETTER_AUTH_URL ).  ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME  hanya untuk CLI, tidak perlu di Vercel.
Migration
- Migration tersedia:  0000_tough_synch.sql ,  0001_plain_virginia_dare.sql ,  0002_gifted_shotgun.sql  (+ snapshot + journal).
- Command (sesuai  package.json ):  npm run db:migrate  (=  drizzle-kit migrate ), membaca  DATABASE_URL  dari  drizzle.config.ts .
- ⚠️ Pastikan  DATABASE_URL  yang aktif saat menjalankan adalah production, bukan lokal (migration tidak boleh jalan ke DB lokal secara tidak sengaja).
- Langkah user setelah DB production siap:
// bash
# 1. Jalankan migration terhadap production (sekali)
npm run db:migrate
# 2. Bootstrap admin pertama
npm run admin:create -- --email admin@domain --password '<kuat>'
- Script admin meng-seed role  admin / staff / member  (idempotent) → setelah migration + admin:create, RBAC siap. Tidak ada pembuatan admin otomatis saat deploy, tidak ada default password, tidak ada endpoint publik.
Verification
- Typecheck: ✅  npx tsc --noEmit  → 0 errors
- Lint: ✅  npm run lint  → clean
- Build: ✅  npm run build  → Compiled, 46/46 pages (tanpa DB — build tidak butuh koneksi DB)
- Secret scan: ✅ Tidak ada hardcoded secret;  .env.local / .env.production  ter-ignore & tidak ter-track
- Database-dependent checks: ⚠️ DB lokal tidak aktif → halaman DB-dependent ( / ,  /books , dashboard) belum diuji end-to-end; ini environment issue, bukan code failure. Build + middleware + auth config terverifikasi dari sisi kode.
Blocking Issues
Tidak ada.
Final Vercel ENV Checklist
Sebelum deploy, isi di Vercel:
PRODUCTION  DATABASE_URL                 = <production PG connection string>   🔒
PRODUCTION  BETTER_AUTH_SECRET           = <openssl rand -base64 32>           🔒
PRODUCTION  BETTER_AUTH_URL              = https://<PRODUCTION-DOMAIN>
PRODUCTION  NEXT_PUBLIC_BETTER_AUTH_URL  = https://<PRODUCTION-DOMAIN>
PRODUCTION  NEXT_PUBLIC_SITE_URL         = https://<PRODUCTION-DOMAIN>
PRODUCTION  NEXT_PUBLIC_SUPABASE_URL     = https://<PROJECT>.supabase.co        (jika cover upload)
PRODUCTION  SUPABASE_SERVICE_ROLE_KEY    = <service role key>                   🔒 (jika cover upload)
PREVIEW     NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_BETTER_AUTH_URL / BETTER_AUTH_URL = https://<preview>.vercel.app
PREVIEW     BETTER_AUTH_SECRET / DATABASE_URL = (sama/dev)
Post-deploy:  npm run db:migrate  (sekali) →  npm run admin:create  → verifikasi  /sitemap.xml  &  /robots.txt  → siap Google Search Console.
Catatan: Deployment tidak dilakukan; Vercel tidak diklaim dikonfigurasi; DB production tidak diklaim terkoneksi; GSC tidak diklaim selesai — semua adalah langkah manual untuk user.
