# CHANGELOG.md

# Changelog

Semua perubahan penting pada proyek ini akan dicatat dalam dokumen ini.

Dokumen ini mengikuti prinsip **Keep a Changelog** dan menggunakan **Semantic Versioning (SemVer)**.

---

# Version Format

Gunakan format:

```text
MAJOR.MINOR.PATCH
```

Contoh:

```text
1.0.0
1.1.0
1.1.1
2.0.0
```

---

# Change Categories

Gunakan kategori berikut untuk setiap versi.

## Added

Fitur baru.

---

## Changed

Perubahan pada fitur yang sudah ada.

---

## Deprecated

Fitur yang akan dihapus pada versi mendatang.

---

## Removed

Fitur yang telah dihapus.

---

## Fixed

Perbaikan bug.

---

## Security

Perbaikan keamanan.

---

# Unreleased

## Added

* Initial project documentation.
* Project architecture.
* Product Requirement Document (PRD).
* Database design.
* Drizzle schema specification.
* User flow documentation.
* Route specification.
* UI/UX specification.
* Authentication specification.
* Storage specification.
* Validation specification.
* API specification.
* Coding standards.
* Deployment guide.
* Testing guide.
* Contribution guide.
* AI Agent guide.

## Changed

* Optimasi performa Dashboard API: menggabungkan 14 query COUNT menjadi 7 query (`count(*) FILTER`), mengurangi round-trip ke database.
* Menambahkan 11 database index (books, book_inventories, borrowings, returns, fines) untuk mempercepat query dashboard & filter katalog (migration `0004_shallow_colleen_wing`).
* Migrasi parameter halaman edit ke Next.js 16 `params: Promise` dengan `use(params)`.
* Sanitasi slug nama file upload cover buku di `storage.ts` (URL-safe).

## Added

* **Kelola Petugas** (`/dashboard/staff`, admin-only): list, tambah, edit, aktif/nonaktif, ubah role (staff ↔ member), search, pagination, confirmation dialog.
* API admin baru: `GET/POST /api/users`, `PATCH /api/users/[id]` (permission `user:*`).
* Halaman & menu sidebar "Kelola Petugas" (admin-only) + proteksi middleware `/dashboard/staff`.

## Changed

* Staff yang dibuat via `/api/users` tidak memiliki profil member (profil dibuat otomatis saat di-demote menjadi member, dipertahankan saat di-promote kembali).
* Update `docs/Permissions.md` (section Staff & route protection).

## Fixed

* `/api/borrowings/[id]` kini mengembalikan 404 (bukan 500) untuk id non-UUID.
* **Upload cover buku**: bucket `book-covers` yang hilang kini dibuat otomatis (`ensureBucket` idempotent di `storage.ts`) + script setup `scripts/setup-storage.ts` untuk bucket & policy RLS. Sebelumnya upload selalu gagal dengan `COVER_UPLOAD_FAILED` karena bucket belum pernah dibuat dan `storage.buckets` ber-RLS tanpa policy.

## Changed

* **Design system**: palet hijau hangat (referensi Digital Community Library UI/UX), font Nunito + DM Serif Display, badge tone (success/warning/error/info/neutral), skeleton loading, toast, stat cards, book cards, focus rings aksesibilitas, mobile table strategy.
* **Navbar publik reusable** (`src/components/public-navbar.tsx`): auth-aware (Masuk/Daftar/Dasbor/Keluar) + hamburger menu mobile dengan dropdown & backdrop.
* **Dashboard layout**: sidebar desktop dengan section grouping + drawer mobile (hamburger + backdrop, a11y dialog). Logout kini redirect ke `/`.
* **Halaman publik dipoles**: beranda (hero, search, kategori, koleksi terbaru, CTA), katalog (book cards, empty/error/loading state), detail buku (cover, sinopsis, ketersediaan), login & register (panel hero + form card).
* Status badge peminjaman kini berwarna sesuai status (Dipinjam info / Dikembalikan success / Terlambat error / Dibatalkan neutral).

---

# v1.0.0 - Initial Release

Release Date:

```text
YYYY-MM-DD
```

## Added

### Authentication

* Login
* Logout
* Register
* Session Management
* Role-Based Authentication

### Dashboard

* Dashboard Admin
* Dashboard Staff
* Dashboard Member

### Books

* CRUD Buku
* Cover Buku
* Detail Buku
* Pencarian Buku
* Filter Buku

### Categories

* CRUD Kategori

### Authors

* CRUD Penulis

### Publishers

* CRUD Penerbit

### Shelves

* CRUD Rak

### Members

* CRUD Anggota

### Borrowings

* Peminjaman Buku
* Riwayat Peminjaman

### Returns

* Pengembalian Buku

### Fines

* Manajemen Denda

### Reports

* Laporan Peminjaman
* Laporan Pengembalian
* Statistik Dashboard

### Storage

* Upload Cover Buku

### Security

* Authentication
* Authorization
* Role Management

---

## Changed

* Initial application architecture.

---

## Fixed

* Initial bug fixes sebelum rilis pertama.

---

## Security

* Authentication security.
* Session protection.
* Input validation.

---

# v1.1.0 - Inventory-Based Books System

Release Date:

```text
YYYY-MM-DD
```

## Added

### Inventaris Buku (BookInventory / Book Copies)

* Setiap judul buku dapat memiliki banyak inventaris (eksemplar fisik).
* CRUD Inventaris Buku untuk Admin dan Petugas.
* Kode inventaris unik per eksemplar.
* Pencarian berdasarkan Kode Inventaris untuk Admin dan Petugas.
* Peminjaman dilakukan berdasarkan Inventaris Buku, bukan hanya judul.

### Sumber Buku (BookSource)

* Manajemen Sumber Buku (dinamis) untuk Admin dan Petugas.
* Contoh awal: Pembelian, Hibah, Sumbangan, Donasi Alumni, BOS, CSR.
* Sumber Buku wajib dipilih saat menambah Inventaris Buku.

### Tampilan & Pencarian

* Satu judul buku hanya muncul satu kali pada halaman Admin/Petugas.
* Seluruh inventaris judul ditampilkan sebagai tabel/daftar (Kode Inventaris, Kondisi, Status, Lokasi Rak, Sumber Buku).
* Pencarian Pengunjung/Anggota tetap berdasarkan Judul, Penulis, ISBN, Kategori (bukan kode inventaris).

### Export & Laporan

* Export Data Buku ke Excel dan PDF.
* Laporan Buku.
* Laporan Buku + Peminjaman.
* Laporan dapat diekspor ke Excel dan PDF.

## Changed

* Arsitektur data berubah dari `Book → Stock → Borrow` menjadi `Book → BookInventory (Book Copies) → Borrow`.
* `books` tidak lagi menyimpan `shelf_id`, `stock`, dan `available_stock`; data eksemplar dipindahkan ke `book_inventories`.
* `book_inventories.status` menggantikan status stok pada `books`.
* `borrowing_details.book_id` → `book_inventories_id`; kolom `quantity` dihapus karena satu baris mewakili satu eksemplar.
* Status Buku di katalog kini hanya `active` / `inactive`.
* Menambahkan tabel `book_sources` dan `book_inventories`.
* Menambahkan enum `book_condition` dan `inventory_status`.
* `books.status` (available/unavailable/maintenance/lost) dipindahkan menjadi `book_inventories.status`.

---


Gunakan template berikut setiap membuat versi baru.

---

# vX.Y.Z - YYYY-MM-DD

## Added

* ...

## Changed

* ...

## Deprecated

* ...

## Removed

* ...

## Fixed

* ...

## Security

* ...

---

# Semantic Versioning Rules

## MAJOR

Naikkan versi MAJOR jika terdapat perubahan yang tidak kompatibel (breaking changes).

Contoh:

```text
1.0.0

↓

2.0.0
```

---

## MINOR

Naikkan versi MINOR jika menambahkan fitur baru tanpa merusak kompatibilitas.

Contoh:

```text
1.2.0

↓

1.3.0
```

---

## PATCH

Naikkan versi PATCH untuk perbaikan bug atau peningkatan kecil.

Contoh:

```text
1.2.3

↓

1.2.4
```

---

# Release Checklist

Sebelum membuat release baru:

* Semua fitur selesai.
* Semua test utama lulus.
* Dokumentasi diperbarui.
* Migration database telah diuji.
* Build berhasil.
* Deployment berhasil.
* Smoke test selesai.
* Changelog diperbarui.

---

# Documentation Changes

Jika ada perubahan pada dokumentasi penting, tambahkan ke changelog.

Contoh:

## Changed

* Memperbarui `DATABASE.md`.
* Memperbarui `AUTH.md`.
* Memperbarui `API.md`.

---

# Database Changes

Catat setiap perubahan seperti:

* Penambahan tabel.
* Perubahan kolom.
* Penghapusan kolom.
* Perubahan relasi.
* Migration baru.

---

# API Changes

Catat perubahan seperti:

* Server Action baru.
* Route Handler baru.
* Endpoint baru.
* Perubahan request/response.
* Perubahan permission.

---

# UI Changes

Catat perubahan seperti:

* Halaman baru.
* Komponen baru.
* Perubahan layout.
* Perbaikan responsivitas.
* Peningkatan aksesibilitas.

---

# Security Changes

Catat perubahan seperti:

* Perubahan autentikasi.
* Perubahan permission.
* Perbaikan kerentanan.
* Pembaruan dependency keamanan.

---

# Dependency Updates

Jika ada pembaruan dependency penting, catat:

* Nama package.
* Versi lama.
* Versi baru.
* Alasan pembaruan.

Contoh:

```text
Updated:
Drizzle ORM 0.44 → 0.45

Reason:
Performance improvement and bug fixes.
```

---

# Migration Log

Jika terdapat migration database baru, tambahkan ringkasan.

Contoh:

```text
Migration:
0005_add_book_cover

Changes:

- Added cover_image column
- Added thumbnail_url column
- Added storage_path column
```

---

# AI Documentation Update

Jika AI coding assistant menghasilkan perubahan yang memengaruhi struktur proyek atau dokumentasi, perubahan tersebut harus dicatat pada changelog agar riwayat pengembangan tetap terdokumentasi.

---

# Best Practices

* Perbarui changelog setiap merge ke branch `main`.
* Gunakan kalimat yang singkat dan jelas.
* Jangan menghapus riwayat versi lama.
* Catat perubahan yang berdampak pada pengguna atau pengembang.
* Simpan urutan versi dari yang terbaru ke yang terlama.
