# Admin Bootstrap — Initial Admin Account

## Purpose

Membuat akun **admin pertama** sebelum aplikasi digunakan di production.

Mekanisme ini **tidak** membuka endpoint publik apa pun — admin hanya dapat
dibuat melalui CLI di server, bukan melalui halaman register.

## Prasyarat

- Node.js ≥ 22.9 (script menggunakan flag `--env-file-if-exists`).
- Database sudah berjalan dan migration sudah diterapkan:

  ```bash
  npm run db:migrate
  ```

- Environment variables sudah tersedia (`.env.local` atau environment server):

  - `DATABASE_URL`
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL`

## Cara Pakai

```bash
npm run admin:create -- --email admin@example.com --password 'YourStrongPass123'
```

Opsi tambahan:

```bash
npm run admin:create -- --email admin@example.com --password 'YourStrongPass123' --name 'Administrator Utama'
```

Atau gunakan environment variables (lebih aman — password tidak tampil di shell history):

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='YourStrongPass123' npm run admin:create -- --yes
```

> Catatan: kredensial yang dilewatkan via CLI flag (`--password`) dapat terlihat
> di proses/shell history. Sebaiknya gunakan environment variables.

## Flags

| Flag | Fungsi |
|------|--------|
| `--yes` | Lewati prompt konfirmasi (wajib pada shell non-interaktif / CI) |
| `--force` | Izinkan pembuatan admin tambahan meski admin lain sudah ada |
| `--name` | Nama tampilan admin (default: `Administrator`) |

## Yang Dilakukan Script

1. **Seeds role yang terdokumentasi** (`admin`, `staff`, `member`) secara
   idempotent — RBAC tidak dapat berfungsi tanpa data role ini.
2. **Membuat user melalui Better Auth** (`auth.api.signUpEmail`) sehingga
   password di-hash oleh Better Auth — tidak pernah disimpan plaintext.
3. **Memberikan role `admin`** melalui kolom `users.role_id` (RBAC yang sudah ada).
4. **Menjalankan perubahan dalam database transaction**.
5. **Mencatat audit log** `ADMIN_BOOTSTRAP`.

## Validasi

- Email harus valid dan unik.
- Password minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka
  (sesuai `docs/AUTH.md` — Password Policy).
- Nama minimal 3 karakter.

## Idempotency

- Jika admin dengan email yang sama **sudah ada**: script keluar dengan
  pesan `ADMIN_ALREADY_EXISTS` dan status 0 (tidak membuat duplikat).
- Jika admin lain (email berbeda) **sudah ada**: script menolak kecuali
  `--force` diberikan — ini adalah bootstrap *initial* admin, bukan alat
  untuk menambah admin.
- Jika email sudah dipakai user **non-admin**: script menolak dengan error.
- Script meminta konfirmasi sebelum membuat akun (gunakan `--yes` untuk
  shell non-interaktif).

## Keamanan

- **Tidak ada** email/password default yang di-hardcode di source code.
- Kredensial **tidak pernah dicetak** ke output (hanya email yang ditampilkan
  setelah berhasil; password tidak pernah).
- Tidak ada endpoint HTTP publik untuk membuat admin.
- `BETTER_AUTH_SECRET` dan `DATABASE_URL` hanya dibaca dari environment,
  tidak pernah ditulis ke log.
- Script berjalan server-side/CLI saja.

## Setelah Admin Dibuat

1. Login melalui `/login` dengan email & password admin.
2. Admin dapat mengelola: `/dashboard/settings`, `/dashboard/audit-logs`,
   laporan, dan seluruh data perpustakaan.
3. Hapus/putar kembali kredensial bila diperlukan.

## Catatan

- Register publik **selalu** menghasilkan role `member` — tidak ada jalur
  dari halaman register ke role admin (lihat `src/server/auth.ts`
  `databaseHooks` dan `docs/AUTH.md`).
- User biasa/member **tidak dapat** mengubah role-nya sendiri; role hanya
  diatur server-side.
