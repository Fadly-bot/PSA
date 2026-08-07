# Books API

## Purpose

Dokumen ini menjelaskan seluruh **Server Actions** dan **Route Handlers** yang digunakan untuk mengelola data buku.

Modul Books merupakan pusat data katalog perpustakaan dan menjadi dasar bagi proses pencarian, peminjaman, dan pelaporan.

---

# Module Overview

Modul Books menangani:

* CRUD Buku (bibliografi judul)
* CRUD Inventaris Buku (eksemplar / Book Copies)
* CRUD Sumber Buku (Book Source)
* Upload Cover Buku
* Detail Buku
* Pencarian Buku
* Pencarian berdasarkan Kode Inventaris
* Export Buku (Excel/PDF)
* Filter Buku
* Pagination
* Soft Delete
* Restore Buku

---

# Authentication

Semua operasi selain melihat katalog memerlukan login.

---

# Authorization

| Action              | Guest | Member | Staff | Admin |
| ------------------- | :---: | :----: | :---: | :---: |
| Lihat Buku          |   ✅   |    ✅   |   ✅   |   ✅   |
| Detail Buku         |   ✅   |    ✅   |   ✅   |   ✅   |
| Cari Buku (judul)   |   ✅   |    ✅   |   ✅   |   ✅   |
| Cari Kode Inventaris|   ❌   |    ❌   |   ✅   |   ✅   |
| Tambah Buku         |   ❌   |    ❌   |   ✅   |   ✅   |
| Edit Buku           |   ❌   |    ❌   |   ✅   |   ✅   |
| Upload Cover        |   ❌   |    ❌   |   ✅   |   ✅   |
| CRUD Inventaris     |   ❌   |    ❌   |   ✅   |   ✅   |
| CRUD Sumber Buku    |   ❌   |    ❌   |   ✅   |   ✅   |
| Export Buku         |   ❌   |    ❌   |   ✅   |   ✅   |
| Hapus Buku          |   ❌   |    ❌   |   ✅   |   ✅   |
| Restore Buku        |   ❌   |    ❌   |   ❌   |   ✅   |
| Hapus Permanen      |   ❌   |    ❌   |   ❌   |   ✅   |

---

# Server Actions

---

## createBook()

### Purpose

Menambahkan buku baru (bibliografi judul).

### Parameters

| Field       | Required     |
| ----------- | ------------ |
| isbn        | ✅            |
| title       | ✅            |
| subtitle    | ❌            |
| slug        | ❌ (otomatis) |
| synopsis    | ❌            |
| publishYear | ✅            |
| language    | ✅            |
| pages       | ✅            |
| categoryId  | ✅            |
| authorId    | ✅            |
| publisherId | ✅            |
| status      | ❌ (otomatis: active) |
| coverImage  | ❌            |

### Validation

* ISBN unik.
* Judul wajib.
* Tahun terbit valid.
* Relasi harus valid.

### Business Rules

* Buku hanya menyimpan informasi bibliografi.
* Stok dan lokasi rak tidak diisi pada form Buku; dikelola melalui `createBookInventory()`.
* Status default = `active`.
* Slug dibuat otomatis jika kosong.

---

## updateBook()

### Purpose

Memperbarui data buku.

### Parameters

* bookId
* Seluruh field yang dapat diubah.

### Validation

Mengikuti aturan `createBook()`.

---

## deleteBook()

### Purpose

Soft delete buku.

### Business Rules

* Data tidak dihapus permanen.
* Status menjadi Deleted.
* Tidak tampil di katalog.

---

## restoreBook()

### Purpose

Mengembalikan buku yang telah di-soft delete.

### Authorization

Admin

---

## forceDeleteBook()

### Purpose

Menghapus buku secara permanen.

### Authorization

Admin

### Business Rules

* Hapus data database.
* Hapus cover dari Storage.
* Catat pada Activity Log.

---

## getBook()

Mengambil detail satu buku.

Parameter

```text id="f1w9cz"
bookId
```

---

## getBooks()

Mengambil daftar buku.

Support:

* Pagination
* Search
* Filter
* Sorting

---

## searchBooks()

Parameter (Pengunjung & Anggota)

| Field     |
| --------- |
| keyword   |
| category  |
| author    |
| publisher |
| language  |
| status    |

Parameter tambahan (Admin & Petugas)

| Field         |
| ------------- |
| inventoryCode |

Catatan: Pengunjung dan Anggota tidak dapat mencari berdasarkan Kode Inventaris.

---

## searchBookInventory()

### Purpose

Mencari inventaris (eksemplar) berdasarkan Kode Inventaris.

### Authorization

Admin / Petugas

### Parameters

| Field          |
| -------------- |
| inventoryCode  |

---

## uploadBookCover()

### Purpose

Mengunggah cover buku.

### Validation

* JPG
* JPEG
* PNG
* WebP
* Maksimal 5 MB

### Storage

Bucket

```text id="xb0paz"
book-covers
```

---

## removeBookCover()

Menghapus cover lama.

---

## duplicateBook()

### Purpose

Membuat salinan data buku tanpa menyalin ISBN.

---

## updateBookStock()

### Purpose

Tidak lagi digunakan pada entity Buku.

Stok dikelola melalui CRUD Inventaris Buku (`book_inventories`).

Business Rules

* Stok total dihitung dari jumlah `book_inventories` yang belum di-soft delete.
* Stok tersedia dihitung dari `book_inventories` berstatus `available`.

---

## updateBookStatus()

Status yang diperbolehkan (status judul di katalog)

* active
* inactive

---

# Server Actions - Inventaris Buku

## createBookInventory()

Menambahkan eksemplar (Book Copy) baru.

Parameters

| Field         | Required |
| ------------- | :------: |
| bookId        |    ✅     |
| inventoryCode |    ✅     |
| sourceId      |    ✅     |
| shelfId       |    ❌     |
| condition     |    ❌ (default good) |
| status        |    ❌ (default available) |
| notes         |    ❌     |

Business Rules

* `inventoryCode` harus unik.
* `sourceId` wajib (sumber buku).
* Status default = `available`.

---

## updateBookInventory()

Memperbarui eksemplar. Mengikuti aturan `createBookInventory()`.

---

## deleteBookInventory()

Soft delete eksemplar. Eksemplar tidak dapat dihapus jika memiliki peminjaman aktif.

---

# Server Actions - Sumber Buku

## createBookSource()

Menambahkan sumber buku baru.

Parameters

* name (wajib, unik)
* description (opsional)

---

## updateBookSource()

Memperbarui sumber buku. Mengikuti aturan `createBookSource()`.

---

## deleteBookSource()

Menghapus sumber buku. Tidak dapat dihapus jika masih digunakan oleh inventaris.

---

# Server Actions - Export

## exportBooks()

### Purpose

Mengekspor data Buku.

### Authorization

Admin / Petugas

### Formats

* Excel
* PDF

### Exported Columns (minimal)

* Judul
* ISBN
* Penulis
* Penerbit
* Kategori
* Kode Inventaris
* Sumber Buku
* Rak
* Kondisi
* Status

---

# Route Handlers

Sebagian besar operasi menggunakan Server Actions.

Route Handler hanya digunakan bila diperlukan.

---

## GET /api/books

Mengambil daftar buku.

Support

* Pagination
* Search
* Filter
* Sorting

---

## GET /api/books/:id

Mengambil detail buku.

---

## GET /api/books/search

Pencarian buku.

---

## POST /api/books/upload

Upload cover buku.

---

## GET /api/books/export

Export data Buku.

Parameter

* format=excel | pdf

---

## GET /api/inventories/search

Pencarian inventaris (eksemplar) berdasarkan Kode Inventaris. Admin / Petugas.

---

## GET /api/inventories

Daftar inventaris (semua judul).

## GET /api/inventories/:id

Detail inventaris.

---

## GET /api/book-sources

Daftar sumber buku.

## POST /api/book-sources

Tambah sumber buku.

## PUT /api/book-sources/:id

Perbarui sumber buku.

## DELETE /api/book-sources/:id

Hapus sumber buku.

---

# Query Parameters

Search

```text id="jlwm8h"
?q=atomic
```

Pagination

```text id="e4i8pd"
?page=1

&limit=20
```

Sorting

```text id="b8vtgo"
sort=title

order=asc
```

Filter

```text id="x3hcmf"
category=Programming

author=Robert Martin

language=Indonesia
```

---

# Validation

Mengikuti:

`docs/VALIDATION.md`

---

# Business Rules

* ISBN harus unik.
* Satu judul buku hanya muncul satu kali pada daftar buku.
* Setiap eksemplar (BookInventory) memiliki Kode Inventaris unik.
* Buku tidak dapat dipinjam jika tidak ada inventaris (BookInventory) berstatus `available`.
* Peminjaman mengacu pada **BookInventory**, bukan langsung ke Book.
* Saat meminjam, `book_inventories.status` menjadi `borrowed`; saat dikembalikan kembali menjadi `available`.
* Cover bersifat opsional.
* Soft delete digunakan sebagai default.
* Permanent delete hanya untuk Admin.

---

# Database Tables

Menggunakan:

* books
* book_sources
* book_inventories
* categories
* authors
* publishers
* shelves
* borrowings
* borrowing_details

---

# Response

## Success

```ts id="3kq2k2"
{
  success: true,
  message: "Book created successfully.",
  data: {}
}
```

---

## Error

```ts id="7p3u2w"
{
  success: false,
  message: "ISBN already exists."
}
```

---

# Error Codes

| Code                    | Description                     |
| ----------------------- | ------------------------------- |
| BOOK_NOT_FOUND          | Buku tidak ditemukan            |
| ISBN_ALREADY_EXISTS     | ISBN sudah digunakan            |
| INVALID_CATEGORY        | Kategori tidak ditemukan        |
| INVALID_AUTHOR          | Penulis tidak ditemukan         |
| INVALID_PUBLISHER       | Penerbit tidak ditemukan        |
| INVALID_SHELF           | Rak tidak ditemukan             |
| INVENTORY_NOT_FOUND     | Inventaris tidak ditemukan      |
| INVALID_SOURCE          | Sumber buku tidak ditemukan     |
| INVENTORY_CODE_EXISTS   | Kode inventaris sudah digunakan |
| SOURCE_NAME_EXISTS      | Nama sumber buku sudah digunakan |
| NO_AVAILABLE_INVENTORY  | Tidak ada eksemplar tersedia    |
| INVALID_STATUS          | Status tidak valid              |
| COVER_UPLOAD_FAILED     | Upload cover gagal              |
| EXPORT_FAILED           | Export gagal                    |

---

# Logging

Catat aktivitas berikut:

* Tambah Buku
* Edit Buku
* Hapus Buku
* Restore Buku
* Upload Cover
* Tambah / Edit / Hapus Inventaris
* Tambah / Edit / Hapus Sumber Buku
* Export Buku
* Update Status

---

# Security

* Validasi seluruh input.
* Periksa session.
* Periksa role.
* Validasi relasi database.
* Gunakan transaction untuk operasi multi-tabel.

---

# Performance

Gunakan:

* Pagination
* Index pada ISBN
* Index pada slug
* Index pada title
* Index pada inventory_code
* Lazy loading cover
* Optimized image

---

# Related Documentation

* `docs/PRD.md`
* `docs/DATABASE.md`
* `docs/SCHEMA.md`
* `docs/STORAGE.md`
* `docs/VALIDATION.md`
* `docs/AUTH.md`

---

# Definition of Done

Modul Books dianggap selesai jika:

* CRUD Buku berfungsi.
* CRUD Inventaris Buku berfungsi (dengan Sumber Buku wajib).
* CRUD Sumber Buku berfungsi.
* Upload Cover berfungsi.
* Search berfungsi (termasuk Kode Inventaris untuk Admin/Petugas).
* Filter berfungsi.
* Pagination berfungsi.
* Export Buku (Excel/PDF) berfungsi.
* Soft Delete berfungsi.
* Restore berfungsi.
* Peminjaman berbasis inventaris berjalan dengan benar.
* Permission sesuai role.
* Logging aktif.
* Validasi lengkap.
* Error handling konsisten.
