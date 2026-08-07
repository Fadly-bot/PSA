# Project Conventions

## Purpose

Dokumen ini mendefinisikan konvensi implementasi yang harus diikuti oleh seluruh developer dan AI Coding Assistant selama pengembangan aplikasi TBM Semesta Alam.

Tujuan:

- Menjaga konsistensi implementasi.
- Mengurangi duplikasi kode.
- Memudahkan maintenance.
- Memastikan AI menghasilkan struktur kode yang seragam.

Dokumen ini melengkapi:

- CODING_STANDARDS.md
- NAMING.md
- ARCHITECTURE.md

---

# General Principles

Selalu mengikuti prinsip:

- Server First
- Type Safety
- Reusable Components
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)
- Consistency over Cleverness

---

# Tech Stack

Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend

- Next.js Server Actions
- Route Handlers (hanya jika diperlukan)

Database

- PostgreSQL
- Drizzle ORM

Authentication

- Better Auth

Storage

- Supabase Storage

Validation

- Zod

---

# Folder Convention

```
src/

app/

actions/

components/

db/

lib/

hooks/

services/

validators/

types/

constants/
```

Jangan membuat folder baru tanpa alasan yang jelas.

---

# Server Actions First

Semua operasi CRUD menggunakan:

Server Actions

Gunakan Route Handlers hanya untuk:

- Upload file
- Webhook
- OAuth Callback
- Public API
- Export file

---

# Business Logic

Business logic tidak boleh berada di:

- React Component
- Page
- Layout

Business logic ditempatkan pada:

```
actions/

services/
```

---

# Database Access

Seluruh akses database hanya melalui:

```
db/

services/
```

Jangan mengakses database langsung dari komponen.

---

# Validation Flow

Urutan:

```
Request

↓

Zod Validation

↓

Authentication

↓

Authorization

↓

Business Logic

↓

Database

↓

Response
```

---

# Authentication Flow

Gunakan Better Auth.

Seluruh pengecekan session dilakukan di server.

Jangan memvalidasi session di client.

---

# Authorization Flow

Seluruh permission diperiksa pada:

Server Action

atau

Service

Bukan pada React Component.

---

# Error Handling

Gunakan format error yang konsisten.

Seluruh error harus menggunakan:

ERRORS.md

---

# Response Convention

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
    code: "...",
    message: "..."
}
```

---

# CRUD Convention

Semua entity menggunakan pola berikut.

```
create

get

getAll

update

delete

restore

search

export
```

Contoh

```
createBook

getBooks

updateBook

deleteBook

searchBooks

exportBooks
```

---

# Component Convention

Komponen dibagi menjadi:

UI

Feature

Layout

Shared

Jangan mencampur semuanya.

---

# Form Convention

Setiap form memiliki:

- Schema Zod
- Default Values
- Submit Handler
- Loading State
- Error State

---

# Table Convention

Seluruh tabel mendukung:

- Search
- Pagination
- Sorting
- Filter

Jika memungkinkan.

---

# Inventory Convention

Book

↓

BookInventory

↓

Borrow

Book tidak memiliki stock.

Jumlah buku dihitung dari:

BookInventory

---

# Search Convention

Guest

- Judul
- Penulis
- ISBN
- Kategori

Staff/Admin

Tambahan:

- Inventory Code

---

# Export Convention

Seluruh export berada pada:

```
Reports

atau

Books
```

Format:

- Excel
- PDF

---

# Upload Convention

Seluruh upload menggunakan:

Supabase Storage

Bucket

```
book-covers
```

---

# Logging Convention

Catat aktivitas berikut:

- Login
- Logout
- Tambah Buku
- Tambah Inventaris
- Tambah Anggota
- Peminjaman
- Pengembalian
- Hapus Data

---

# Soft Delete Convention

Gunakan:

```
deleted_at
```

Jangan menghapus data permanen kecuali:

Admin

---

# Pagination Convention

Gunakan:

```
page

limit

total

totalPages
```

---

# Search Convention

Gunakan:

```
q
```

Contoh

```
?q=atomic
```

---

# Sorting Convention

```
sort

order
```

Contoh

```
sort=title

order=asc
```

---

# Filter Convention

Gunakan nama field.

Contoh

```
category

author

publisher

status
```

---

# Date Convention

Gunakan:

UTC

Format:

ISO 8601

---

# AI Coding Assistant Rules

AI wajib:

- Mengikuti seluruh dokumentasi pada folder docs/.
- Tidak membuat struktur folder baru tanpa dokumentasi.
- Tidak membuat entity baru tanpa pembaruan DATABASE.md.
- Tidak membuat route baru tanpa pembaruan ROUTES.md.
- Tidak membuat Server Action baru tanpa pembaruan API.md.
- Tidak membuat enum baru tanpa pembaruan SCHEMA.md.
- Tidak membuat permission baru tanpa pembaruan PERMISSIONS.md.
- Tidak mengubah arsitektur tanpa pembaruan ARCHITECTURE.md.

---

# Related Documentation

- docs/ARCHITECTURE.md
- docs/NAMING.md
- docs/CODING_STANDARDS.md
- docs/PERMISSIONS.md
- docs/ERRORS.md
- docs/DATABASE.md
- docs/SCHEMA.md
- docs/API.md

---

# Definition of Done

Konvensi dianggap dipenuhi apabila:

- Struktur folder konsisten.
- Seluruh CRUD mengikuti pola yang sama.
- Seluruh validasi dilakukan sebelum business logic.
- Seluruh akses database melalui service atau layer yang telah ditentukan.
- Seluruh response mengikuti format standar.
- Seluruh implementasi mengikuti dokumentasi pada folder `docs/`.