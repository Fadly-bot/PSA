**SEO INDEXING REQUIREMENT**

Implementasikan mekanisme SEO/indexing Next.js untuk TBM Semesta Alam.

Buat jika belum tersedia:

- `src/app/sitemap.ts`
- `src/app/robots.ts`

Gunakan Next.js Metadata API pada halaman publik.

Sitemap harus dinamis dan mengambil URL halaman publik yang memang boleh diindeks dari database.

Minimal sitemap mencakup:

- homepage `/`
- katalog publik
- detail buku publik

Jangan masukkan:

- `/login`
- `/register`
- `/dashboard`
- `/admin`
- `/settings`
- `/profile`
- `/api/*`

Gunakan production base URL dari environment variable, bukan localhost.

Pastikan:

`https://DOMAIN/sitemap.xml`

menghasilkan HTTP 200 dan XML sitemap yang valid.

Pastikan:

`https://DOMAIN/robots.txt`

menghasilkan HTTP 200 dan berisi referensi ke sitemap production.

Setiap halaman buku publik harus memiliki:

- title unik
- meta description
- canonical URL
- Open Graph metadata jika relevan

Jangan memasukkan data privat atau halaman admin ke sitemap.

Setelah selesai, lakukan build dan verifikasi bahwa sitemap dan robots dapat diakses.

Jangan mengklaim Google Search Console sudah terverifikasi atau sitemap sudah disubmit jika belum dilakukan secara manual.
***

klo semisal di cline sudah habis buat yang gratis apa bisa untuk di freebuff dibuat satu prompt yang mencakup dari phase 4 sampai request indexing agar bisa selesai dengan cepat
***
