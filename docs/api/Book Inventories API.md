# Book Inventories API

## Purpose

Dokumen ini mendefinisikan seluruh Server Actions, Business Rules, Validation, Authorization, dan API yang berkaitan dengan manajemen **Book Inventory (Eksemplar Buku)** pada aplikasi TBM Semesta Alam.

Book Inventory merepresentasikan **setiap eksemplar fisik buku**, bukan informasi bibliografi. Setiap inventaris memiliki kode unik, kondisi, lokasi rak, sumber buku, dan status tersendiri.

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
BookInventory
```

Digunakan untuk:

- Menyimpan setiap eksemplar fisik buku.
- Menentukan lokasi rak buku.
- Menentukan sumber pengadaan buku.
- Menentukan kondisi buku.
- Menentukan status ketersediaan buku.
- Menjadi objek utama dalam proses peminjaman.

---

# Authorization

| Action | Guest | Member | Staff | Admin |
|----------|:----:|:------:|:-----:|:-----:|
| View Inventory | ❌ | ❌ | ✅ | ✅ |
| Search Inventory | ❌ | ❌ | ✅ | ✅ |
| Create Inventory | ❌ | ❌ | ✅ | ✅ |
| Update Inventory | ❌ | ❌ | ✅ | ✅ |
| Delete Inventory | ❌ | ❌ | ❌ | ✅ |
| Restore Inventory | ❌ | ❌ | ❌ | ✅ |
| Export Inventory | ❌ | ❌ | ✅ | ✅ |

---

# Entity

BookInventory

```
id
inventoryCode
bookId
bookSourceId
shelfId
condition
status
notes
createdAt
updatedAt
deletedAt
```

---

# Relationships

```
Book
   │
   └──────────< BookInventory
                     │
                     ├────────── Shelf
                     │
                     ├────────── BookSource
                     │
                     └──────────< BorrowingDetail
```

---

# Inventory Status

```
available

borrowed

reserved

maintenance

lost

damaged
```

---

# Book Condition

```
excellent

good

fair

poor

damaged
```

---

# Server Actions

## createBookInventory()

### Purpose

Menambahkan inventaris baru.

### Permission

- Staff
- Admin

### Input

```ts
{
    inventoryCode: string
    bookId: string
    bookSourceId: string
    shelfId: string
    condition: "excellent" | "good" | "fair" | "poor" | "damaged"
    notes?: string
}
```

### Process

- Validasi Book.
- Validasi Shelf.
- Validasi Book Source.
- Validasi Inventory Code.
- Membuat Book Inventory.

---

## getBookInventories()

Mengambil seluruh inventaris.

Features

- Pagination
- Search
- Sorting
- Filtering

---

## getBookInventoryById()

Mengambil detail inventaris.

---

## updateBookInventory()

Mengubah inventaris.

Permission

- Staff
- Admin

---

## deleteBookInventory()

Soft Delete.

Permission

Admin

---

## restoreBookInventory()

Restore inventaris.

Permission

Admin

---

## searchBookInventory()

Parameter

```
q
```

Mencari berdasarkan

- Inventory Code
- Book Title
- ISBN
- Shelf
- Source

---

## exportBookInventories()

Format

- Excel
- PDF

---

# Route Handlers

```
GET

/api/book-inventories

GET

/api/book-inventories/:id

POST

/api/book-inventories

PATCH

/api/book-inventories/:id

DELETE

/api/book-inventories/:id

POST

/api/book-inventories/:id/restore

POST

/api/book-inventories/export
```

---

# Validation Rules

## Inventory Code

- Required
- Unique
- Maksimal 50 karakter

Contoh

```
INV-2026-000001
```

---

## Book

- Required
- Harus ada pada tabel Books.

---

## Shelf

- Required
- Harus ada pada tabel Shelves.

---

## Book Source

- Required
- Harus ada pada tabel BookSources.

---

## Condition

Harus salah satu dari

```
excellent

good

fair

poor

damaged
```

---

## Status

Harus salah satu dari

```
available

borrowed

reserved

maintenance

lost

damaged
```

Status awal:

```
available
```

---

## Notes

Opsional.

Maksimal

```
1000 karakter
```

---

# Business Rules

- Inventory Code harus unik.
- Satu inventaris hanya mewakili satu buku fisik.
- Satu Book dapat memiliki banyak Book Inventory.
- Inventaris wajib memiliki Shelf.
- Inventaris wajib memiliki Book Source.
- Inventaris dengan status **borrowed** tidak dapat dipinjam lagi.
- Inventaris dengan status **maintenance**, **lost**, atau **damaged** tidak dapat dipinjam.
- Inventaris yang masih dipinjam tidak dapat dihapus.
- Soft Delete digunakan.

---

# Inventory Status Flow

```
available
        │
        ├──────────────► borrowed
        │                    │
        │                    ▼
        │               available
        │
        ├──────────────► maintenance
        │                    │
        │                    ▼
        │               available
        │
        ├──────────────► reserved
        │                    │
        │                    ▼
        │               borrowed
        │
        ├──────────────► lost
        │
        └──────────────► damaged
```

---

# Search

Staff

Admin

Berdasarkan

- Inventory Code
- Book Title
- ISBN
- Shelf
- Book Source

---

# Sorting

```
inventoryCode

condition

status

createdAt

updatedAt
```

---

# Filtering

```
status

condition

book

shelf

bookSource
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

- Inventory Code
- Book Title
- ISBN
- Shelf
- Source
- Condition
- Status
- Created At

---

# Error Codes

| Code | Description |
|------|-------------|
| INVENTORY_NOT_FOUND | Inventaris tidak ditemukan |
| INVENTORY_CODE_EXISTS | Kode inventaris sudah digunakan |
| INVENTORY_ALREADY_BORROWED | Inventaris sedang dipinjam |
| INVENTORY_NOT_AVAILABLE | Inventaris tidak tersedia |
| INVALID_BOOK | Buku tidak ditemukan |
| INVALID_SHELF | Rak tidak ditemukan |
| INVALID_BOOK_SOURCE | Sumber buku tidak ditemukan |
| INVALID_CONDITION | Kondisi buku tidak valid |
| INVALID_STATUS | Status inventaris tidak valid |
| PERMISSION_DENIED | Tidak memiliki izin |

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
    code: "INVENTORY_NOT_AVAILABLE",
    message: "Inventory is not available."
}
```

---

# Database Tables

```
book_inventories

books

book_sources

shelves

borrowing_details
```

Relasi

```
books.id
        │
        └────── book_inventories.book_id

book_sources.id
        │
        └────── book_inventories.book_source_id

shelves.id
        │
        └────── book_inventories.shelf_id

book_inventories.id
        │
        └────── borrowing_details.book_inventory_id
```

---

# Index Recommendation

```
inventory_code

book_id

book_source_id

shelf_id

status

condition
```

---

# Activity Log

Catat aktivitas berikut:

- Create Inventory
- Update Inventory
- Change Inventory Status
- Delete Inventory
- Restore Inventory
- Export Inventory

---

# Related Documentation

- docs/PRD.md
- docs/DATABASE.md
- docs/SCHEMA.md
- docs/FLOW.md
- docs/VALIDATION.md
- docs/PERMISSIONS.md
- docs/ERRORS.md
- docs/api/books.md
- docs/api/book-sources.md
- docs/api/shelves.md
- docs/api/borrowings.md

---

# Definition of Done

Implementasi Book Inventories API dianggap selesai apabila:

- CRUD Book Inventory tersedia.
- Inventory Code bersifat unik.
- Relasi dengan Book, Shelf, dan Book Source berfungsi.
- Status inventaris berubah sesuai alur bisnis.
- Validasi menggunakan Zod.
- Authorization mengikuti `PERMISSIONS.md`.
- Response mengikuti `ERRORS.md`.
- Search, Pagination, Sorting, Filtering, dan Export berfungsi.
- Soft Delete diterapkan.
- Audit Log tercatat.
- Seluruh implementasi konsisten dengan dokumentasi proyek.