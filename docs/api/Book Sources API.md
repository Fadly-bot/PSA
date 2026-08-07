# Book Sources API

## Purpose

Dokumen ini mendefinisikan seluruh Server Actions, Business Rules, Validation, Authorization, dan API yang berkaitan dengan manajemen **Book Source (Sumber Buku)** pada aplikasi TBM Semesta Alam.

Book Source digunakan untuk mencatat asal pengadaan setiap eksemplar buku (**Book Inventory**). Data ini bersifat dinamis sehingga Admin maupun Staff dapat menambah sumber baru sesuai kebutuhan perpustakaan.

Dokumen ini menjadi acuan implementasi untuk:

- Server Actions
- Route Handlers (jika diperlukan)
- Validation
- Authorization
- AI Coding Assistant

---

# Module Overview

Entity utama

```
BookSource
```

Digunakan untuk:

- Menyimpan sumber pengadaan buku.
- Digunakan oleh Book Inventory.
- Memudahkan pembuatan laporan pengadaan.
- Memudahkan pelacakan asal setiap eksemplar buku.

Contoh sumber buku:

- Pembelian
- Hibah
- BOS
- CSR
- Donasi Alumni
- Sumbangan
- Sponsor
- Lainnya

---

# Authorization

| Action | Guest | Member | Staff | Admin |
|----------|:----:|:------:|:-----:|:-----:|
| View Book Sources | ✅ | ✅ | ✅ | ✅ |
| Search Book Sources | ✅ | ✅ | ✅ | ✅ |
| Create Book Source | ❌ | ❌ | ✅ | ✅ |
| Update Book Source | ❌ | ❌ | ✅ | ✅ |
| Delete Book Source | ❌ | ❌ | ❌ | ✅ |
| Restore Book Source | ❌ | ❌ | ❌ | ✅ |
| Export Book Sources | ❌ | ❌ | ✅ | ✅ |

---

# Entity

BookSource

```
id
name
description
isActive
createdAt
updatedAt
deletedAt
```

---

# Relationships

```
BookSource
      │
      └──────────< BookInventory
```

One Book Source

↓

Many Book Inventories

---

# Server Actions

## createBookSource()

### Purpose

Menambahkan sumber buku baru.

### Permission

- Staff
- Admin

### Input

```ts
{
    name: string
    description?: string
}
```

### Process

- Validasi nama.
- Cek duplikasi.
- Membuat Book Source.

---

## getBookSources()

Mengambil seluruh sumber buku.

Features

- Pagination
- Search
- Sorting
- Filtering

---

## getBookSourceById()

Mengambil detail sumber buku.

---

## updateBookSource()

Mengubah sumber buku.

Permission

- Staff
- Admin

---

## deleteBookSource()

Soft Delete.

Permission

Admin

---

## restoreBookSource()

Mengembalikan sumber buku.

Permission

Admin

---

## searchBookSources()

Parameter

```
q
```

Mencari berdasarkan:

- Name

---

## exportBookSources()

Format

- Excel
- PDF

---

# Route Handlers

```
GET

/api/book-sources

GET

/api/book-sources/:id

POST

/api/book-sources

PATCH

/api/book-sources/:id

DELETE

/api/book-sources/:id

POST

/api/book-sources/:id/restore

POST

/api/book-sources/export
```

---

# Validation Rules

## Name

- Required
- Unique
- Minimal 2 karakter
- Maksimal 100 karakter

Contoh

```
Pembelian

Hibah

CSR

Donasi Alumni
```

---

## Description

Opsional.

Maksimal

```
1000 karakter
```

---

# Business Rules

- Nama sumber buku harus unik.
- Soft Delete digunakan.
- Book Source yang masih digunakan oleh Book Inventory tidak dapat dihapus permanen.
- Penghapusan hanya mengisi `deletedAt`.
- Book Source baru otomatis memiliki status aktif.
- Admin dan Staff dapat menambah sumber buku baru kapan saja.
- Book Inventory wajib memiliki satu Book Source.

---

# Search

Semua role

Berdasarkan

- Name

---

# Sorting

```
name

createdAt

updatedAt
```

---

# Filtering

```
isActive
```

---

# Pagination

```
page

limit
```

---

# Export

Format

- Excel
- PDF

Kolom

- Name
- Description
- Total Inventories
- Created At
- Status

---

# Error Codes

| Code | Description |
|------|-------------|
| BOOK_SOURCE_NOT_FOUND | Sumber buku tidak ditemukan |
| BOOK_SOURCE_ALREADY_EXISTS | Nama sumber buku sudah digunakan |
| BOOK_SOURCE_IN_USE | Sumber buku masih digunakan oleh inventaris |
| INVALID_BOOK_SOURCE | Data sumber buku tidak valid |
| PERMISSION_DENIED | Tidak memiliki izin |
| EXPORT_FAILED | Gagal membuat laporan |

---

# Response Format

Success

```ts
{
    success: true,
    data: {}
}
```

Error

```ts
{
    success: false,
    code: "BOOK_SOURCE_ALREADY_EXISTS",
    message: "Book source already exists."
}
```

---

# Database Tables

```
book_sources

book_inventories
```

Relasi

```
book_sources.id
        │
        └────── book_inventories.book_source_id
```

---

# Index Recommendation

```
name

is_active

created_at
```

---

# Activity Log

Catat aktivitas berikut:

- Create Book Source
- Update Book Source
- Delete Book Source
- Restore Book Source
- Export Book Sources

---

# Related Documentation

- docs/PRD.md
- docs/DATABASE.md
- docs/SCHEMA.md
- docs/FLOW.md
- docs/VALIDATION.md
- docs/PERMISSIONS.md
- docs/ERRORS.md
- docs/api/book-inventories.md
- docs/api/books.md

---

# Definition of Done

Implementasi Book Sources API dianggap selesai apabila:

- CRUD Book Source tersedia.
- Nama sumber buku bersifat unik.
- Soft Delete diterapkan.
- Relasi dengan Book Inventory berfungsi.
- Validasi menggunakan Zod.
- Authorization mengikuti `PERMISSIONS.md`.
- Response mengikuti `ERRORS.md`.
- Search, Pagination, Sorting, Filtering, dan Export berfungsi.
- Tidak dapat menghapus Book Source yang masih digunakan oleh inventaris.
- Audit Log tercatat.
- Seluruh implementasi konsisten dengan dokumentasi proyek.
```