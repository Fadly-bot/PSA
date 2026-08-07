# Shelves API

## Purpose

Dokumen ini mendefinisikan seluruh Server Actions, Business Rules, Validation, Authorization, dan API yang berkaitan dengan manajemen **Shelf (Rak Buku)** pada aplikasi TBM Semesta Alam.

Shelf digunakan sebagai lokasi fisik penyimpanan setiap **Book Inventory**.

Dokumen ini menjadi acuan implementasi untuk:

- Server Actions
- Route Handlers (jika diperlukan)
- Validation
- Authorization
- AI Coding Assistant

---

# Module Overview

Entity:

```
Shelf
```

Digunakan untuk:

- Menyimpan lokasi fisik buku.
- Digunakan oleh Book Inventory.
- Memudahkan pencarian lokasi buku.
- Mendukung pengelompokan rak.

---

# Authorization

| Action | Guest | Member | Staff | Admin |
|----------|:----:|:------:|:-----:|:-----:|
| View Shelves | ✅ | ✅ | ✅ | ✅ |
| Search Shelves | ✅ | ✅ | ✅ | ✅ |
| Create Shelf | ❌ | ❌ | ✅ | ✅ |
| Update Shelf | ❌ | ❌ | ✅ | ✅ |
| Delete Shelf | ❌ | ❌ | ❌ | ✅ |
| Restore Shelf | ❌ | ❌ | ❌ | ✅ |

---

# Entity

Shelf

```
id
code
name
location
description
capacity
isActive
createdAt
updatedAt
deletedAt
```

---

# Relationships

```
Shelf
   │
   └───────< BookInventory
```

One Shelf

↓

Many Book Inventories

---

# Server Actions

## createShelf()

### Purpose

Menambahkan rak baru.

### Permission

- Staff
- Admin

### Input

```ts
{
  code: string
  name: string
  location?: string
  description?: string
  capacity?: number
}
```

### Returns

```ts
{
  success: true,
  data: Shelf
}
```

---

## getShelves()

### Purpose

Mengambil seluruh data rak.

### Permission

Semua role.

### Features

- Pagination
- Search
- Sorting
- Filtering

---

## getShelfById()

Mengambil detail rak.

---

## updateShelf()

Mengubah data rak.

### Permission

- Staff
- Admin

---

## deleteShelf()

Soft Delete.

### Permission

Admin

---

## restoreShelf()

Mengembalikan rak.

### Permission

Admin

---

## searchShelves()

Melakukan pencarian rak.

### Parameter

```
q
```

Mencari berdasarkan:

- Code
- Name
- Location

---

# Route Handlers

```
GET

/api/shelves

GET

/api/shelves/:id

POST

/api/shelves

PATCH

/api/shelves/:id

DELETE

/api/shelves/:id

POST

/api/shelves/:id/restore
```

---

# Validation Rules

## Code

- Required
- Harus unik
- Maksimal 30 karakter

Contoh

```
A-01
B-03
REF-02
```

---

## Name

- Required
- Minimal 2 karakter
- Maksimal 100 karakter

Contoh

```
Rak Novel

Rak Teknologi

Rak Referensi
```

---

## Location

Opsional.

Maksimal

```
200 karakter
```

---

## Description

Opsional.

Maksimal

```
1000 karakter
```

---

## Capacity

Opsional.

Harus berupa angka positif.

Minimal

```
1
```

---

# Search

Guest & Member

- Code
- Name

Staff & Admin

- Code
- Name
- Location

---

# Sorting

```
code

name

location

createdAt

updatedAt
```

---

# Filtering

```
isActive

location
```

---

# Pagination

```
page

limit
```

---

# Business Rules

- Kode rak harus unik.
- Nama rak boleh sama apabila kode berbeda.
- Soft Delete digunakan.
- Rak yang masih digunakan oleh Book Inventory tidak dapat dihapus permanen.
- Capacity digunakan sebagai informasi, bukan pembatas mutlak.
- Satu Book Inventory hanya boleh berada pada satu Shelf.
- Shelf dapat memiliki banyak Book Inventory.

---

# Error Codes

| Code | Description |
|------|-------------|
| SHELF_NOT_FOUND | Rak tidak ditemukan |
| SHELF_ALREADY_EXISTS | Kode rak sudah digunakan |
| SHELF_IN_USE | Rak masih digunakan oleh Book Inventory |
| INVALID_SHELF_CODE | Kode rak tidak valid |
| INVALID_CAPACITY | Kapasitas rak tidak valid |
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
  code: "SHELF_NOT_FOUND",
  message: "Shelf not found."
}
```

---

# Database Tables

Menggunakan tabel

```
shelves

book_inventories
```

Relasi

```
shelves.id

↓

book_inventories.shelf_id
```

---

# Index Recommendation

```
code

name

location

is_active
```

---

# Audit Log

Catat aktivitas berikut:

- Create Shelf
- Update Shelf
- Delete Shelf
- Restore Shelf

---

# Related Documentation

- docs/DATABASE.md
- docs/SCHEMA.md
- docs/VALIDATION.md
- docs/PERMISSIONS.md
- docs/ERRORS.md
- docs/api/books.md

---

# Definition of Done

Implementasi Shelves API dianggap selesai apabila:

- CRUD Shelf tersedia.
- Soft Delete berfungsi.
- Validasi menggunakan Zod.
- Authorization mengikuti `PERMISSIONS.md`.
- Response mengikuti standar `ERRORS.md`.
- Search, Pagination, Sorting, dan Filtering berfungsi.
- Relasi dengan `BookInventory` terjaga.
- Tidak dapat menghapus Shelf yang masih digunakan oleh inventaris buku.
- Seluruh implementasi konsisten dengan dokumentasi proyek.