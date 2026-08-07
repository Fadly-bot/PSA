# Authors API

## Purpose

Dokumen ini mendefinisikan seluruh Server Actions, Business Rules, Validation, Authorization, dan API yang berkaitan dengan manajemen **Author (Penulis)** pada aplikasi TBM Semesta Alam.

Author merupakan data master yang digunakan oleh Book. Satu Author dapat memiliki banyak Book.

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
Author
```

Digunakan untuk:

- Menyimpan data penulis.
- Digunakan sebagai relasi pada Book.
- Mencegah duplikasi nama penulis.
- Mendukung pencarian buku berdasarkan penulis.

---

# Authorization

| Action | Guest | Member | Staff | Admin |
|----------|:----:|:------:|:-----:|:-----:|
| View Authors | ✅ | ✅ | ✅ | ✅ |
| Search Authors | ✅ | ✅ | ✅ | ✅ |
| Create Author | ❌ | ❌ | ✅ | ✅ |
| Update Author | ❌ | ❌ | ✅ | ✅ |
| Delete Author | ❌ | ❌ | ❌ | ✅ |
| Restore Author | ❌ | ❌ | ❌ | ✅ |

---

# Entity

Author

```
id
name
slug
biography
birthDate
nationality
photoUrl
isActive
createdAt
updatedAt
deletedAt
```

---

# Relationships

```
Author

↓

Books
```

One Author

↓

Many Books

---

# Server Actions

## createAuthor()

### Purpose

Menambahkan Author baru.

### Permission

- Staff
- Admin

### Input

```ts
{
  name: string
  biography?: string
  birthDate?: Date
  nationality?: string
  photoUrl?: string
}
```

### Returns

```ts
{
  success: true,
  data: Author
}
```

---

## getAuthors()

### Purpose

Mengambil seluruh Author.

### Permission

Semua role.

### Features

- Pagination
- Search
- Sorting
- Filtering

---

## getAuthorById()

Mengambil detail Author.

---

## updateAuthor()

Mengubah Author.

Permission:

- Staff
- Admin

---

## deleteAuthor()

Soft Delete.

Permission:

Admin

---

## restoreAuthor()

Mengembalikan Author.

Permission:

Admin

---

## searchAuthors()

Pencarian Author.

Parameter

```
q
```

Mencari berdasarkan

- Name
- Nationality

---

# Route Handlers

```
GET

/api/authors

GET

/api/authors/:id

POST

/api/authors

PATCH

/api/authors/:id

DELETE

/api/authors/:id

POST

/api/authors/:id/restore
```

---

# Validation Rules

## Name

- Required
- Minimal 2 karakter
- Maksimal 150 karakter
- Tidak boleh duplikat

---

## Biography

Opsional.

Maksimal

```
3000 karakter
```

---

## Birth Date

Opsional.

Tidak boleh melebihi tanggal hari ini.

---

## Nationality

Opsional.

Maksimal

```
100 karakter
```

---

## Photo

Opsional.

Harus berupa URL yang valid.

---

# Search

Guest & Member

- Name

Staff & Admin

- Name
- Nationality

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

nationality
```

---

# Pagination

```
page

limit
```

---

# Business Rules

- Nama Author harus unik.
- Soft Delete digunakan.
- Author yang masih digunakan Book tidak dapat dihapus permanen.
- Penghapusan hanya mengubah `deletedAt`.
- Restore mengembalikan Author menjadi aktif.

---

# Error Codes

| Code | Description |
|------|-------------|
| AUTHOR_NOT_FOUND | Author tidak ditemukan |
| AUTHOR_ALREADY_EXISTS | Nama Author sudah digunakan |
| AUTHOR_IN_USE | Author masih digunakan oleh Book |
| INVALID_AUTHOR_NAME | Nama Author tidak valid |
| INVALID_BIRTH_DATE | Tanggal lahir tidak valid |
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
  code: "AUTHOR_NOT_FOUND",
  message: "Author not found."
}
```

---

# Database Tables

Menggunakan tabel

```
authors

books
```

Relasi

```
authors.id

↓

books.author_id
```

---

# Index Recommendation

```
name

slug

is_active
```

---

# Audit Log

Catat aktivitas berikut:

- Create Author
- Update Author
- Delete Author
- Restore Author

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

Implementasi Authors API dianggap selesai apabila:

- CRUD Author tersedia.
- Soft Delete berfungsi.
- Validasi diterapkan menggunakan Zod.
- Authorization mengikuti `PERMISSIONS.md`.
- Response mengikuti standar `ERRORS.md`.
- Search, Pagination, Sorting, dan Filtering berfungsi.
- Relasi dengan Book terjaga.
- Seluruh implementasi konsisten dengan dokumentasi proyek.