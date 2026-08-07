# Publishers API

## Purpose

Dokumen ini mendefinisikan seluruh Server Actions, Business Rules, Validation, Authorization, dan API yang berkaitan dengan manajemen **Publisher (Penerbit)** pada aplikasi TBM Semesta Alam.

Publisher merupakan data master yang digunakan oleh Book. Satu Publisher dapat menerbitkan banyak Book.

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
Publisher
```

Digunakan untuk:

- Menyimpan data penerbit.
- Digunakan sebagai relasi pada Book.
- Mencegah duplikasi nama penerbit.
- Mendukung pencarian buku berdasarkan penerbit.

---

# Authorization

| Action | Guest | Member | Staff | Admin |
|----------|:----:|:------:|:-----:|:-----:|
| View Publishers | ✅ | ✅ | ✅ | ✅ |
| Search Publishers | ✅ | ✅ | ✅ | ✅ |
| Create Publisher | ❌ | ❌ | ✅ | ✅ |
| Update Publisher | ❌ | ❌ | ✅ | ✅ |
| Delete Publisher | ❌ | ❌ | ❌ | ✅ |
| Restore Publisher | ❌ | ❌ | ❌ | ✅ |

---

# Entity

Publisher

```
id
name
slug
address
city
province
country
postalCode
phone
email
website
description
logoUrl
isActive
createdAt
updatedAt
deletedAt
```

---

# Relationships

```
Publisher

↓

Books
```

One Publisher

↓

Many Books

---

# Server Actions

## createPublisher()

### Purpose

Menambahkan Publisher baru.

### Permission

- Staff
- Admin

### Input

```ts
{
  name: string
  address?: string
  city?: string
  province?: string
  country?: string
  postalCode?: string
  phone?: string
  email?: string
  website?: string
  description?: string
  logoUrl?: string
}
```

### Returns

```ts
{
  success: true,
  data: Publisher
}
```

---

## getPublishers()

### Purpose

Mengambil seluruh data Publisher.

### Permission

Semua role.

### Features

- Pagination
- Search
- Sorting
- Filtering

---

## getPublisherById()

Mengambil detail Publisher.

---

## updatePublisher()

Mengubah data Publisher.

### Permission

- Staff
- Admin

---

## deletePublisher()

Soft Delete Publisher.

### Permission

Admin

---

## restorePublisher()

Mengembalikan Publisher yang telah dihapus.

### Permission

Admin

---

## searchPublishers()

Melakukan pencarian Publisher.

### Parameter

```
q
```

### Search By

- Name
- City
- Country

---

# Route Handlers

```
GET

/api/publishers

GET

/api/publishers/:id

POST

/api/publishers

PATCH

/api/publishers/:id

DELETE

/api/publishers/:id

POST

/api/publishers/:id/restore
```

---

# Validation Rules

## Name

- Required
- Minimal 2 karakter
- Maksimal 200 karakter
- Harus unik

---

## Address

Opsional.

Maksimal

```
500 karakter
```

---

## City

Opsional.

Maksimal

```
100 karakter
```

---

## Province

Opsional.

Maksimal

```
100 karakter
```

---

## Country

Opsional.

Maksimal

```
100 karakter
```

---

## Postal Code

Opsional.

Maksimal

```
20 karakter
```

---

## Phone

Opsional.

Harus menggunakan format nomor telepon yang valid.

---

## Email

Opsional.

Harus berupa email yang valid.

---

## Website

Opsional.

Harus berupa URL yang valid.

---

## Description

Opsional.

Maksimal

```
3000 karakter
```

---

## Logo

Opsional.

Harus berupa URL yang valid.

---

# Search

Guest & Member

- Name

Staff & Admin

- Name
- City
- Country

---

# Sorting

```
name

city

createdAt

updatedAt
```

---

# Filtering

```
country

city

isActive
```

---

# Pagination

```
page

limit
```

---

# Business Rules

- Nama Publisher harus unik.
- Soft Delete digunakan.
- Publisher yang masih digunakan Book tidak dapat dihapus permanen.
- Penghapusan hanya mengisi `deletedAt`.
- Restore mengembalikan Publisher menjadi aktif.
- Website, email, dan logo bersifat opsional.
- Jika logo tidak tersedia, gunakan placeholder pada UI.

---

# Error Codes

| Code | Description |
|------|-------------|
| PUBLISHER_NOT_FOUND | Publisher tidak ditemukan |
| PUBLISHER_ALREADY_EXISTS | Nama Publisher sudah digunakan |
| PUBLISHER_IN_USE | Publisher masih digunakan oleh Book |
| INVALID_PUBLISHER_NAME | Nama Publisher tidak valid |
| INVALID_EMAIL | Email tidak valid |
| INVALID_PHONE | Nomor telepon tidak valid |
| INVALID_WEBSITE | Website tidak valid |
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
  code: "PUBLISHER_NOT_FOUND",
  message: "Publisher not found."
}
```

---

# Database Tables

Menggunakan tabel

```
publishers

books
```

Relasi

```
publishers.id

↓

books.publisher_id
```

---

# Index Recommendation

```
name

slug

city

country

is_active
```

---

# Audit Log

Catat aktivitas berikut:

- Create Publisher
- Update Publisher
- Delete Publisher
- Restore Publisher

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

Implementasi Publishers API dianggap selesai apabila:

- CRUD Publisher tersedia.
- Soft Delete berfungsi.
- Validasi diterapkan menggunakan Zod.
- Authorization mengikuti `PERMISSIONS.md`.
- Response mengikuti standar `ERRORS.md`.
- Search, Pagination, Sorting, dan Filtering berfungsi.
- Relasi dengan Book terjaga.
- Seluruh implementasi konsisten dengan dokumentasi proyek.