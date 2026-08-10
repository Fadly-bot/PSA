# DATABASE.md

# Database Design

## Project

TBM Semesta Alam

---

# Database

## Engine

PostgreSQL

## ORM

Drizzle ORM

## Database Provider

Supabase PostgreSQL

## Connection (Penting!)

- Production memakai **Supabase Transaction Pooler** (PgBouncer transaction mode, port `6543`).
- Client database (`src/db/index.ts`) WAJIB menggunakan **`prepare: false`** pada postgres.js.
- Jangan ubah ke `prepare: true` (default): PgBouncer me-recycle koneksi idle dan membuang prepared statements, sehingga transaksi bisa tampak sukses di sisi client tetapi **tidak pernah benar-benar commit** (silent data loss — POST 201 tetapi data tidak tersimpan, pola yang pernah terjadi di Phase 3).
- Gejala kegagalan: semua query biasa tetap jalan, hanya operasi `db.transaction()` yang diam-diam hilang setelah server idle beberapa menit. Restart dev server menyembunyikan gejala ini.

---

# Design Principles

* UUID sebagai Primary Key.
* Soft delete menggunakan `deleted_at` (untuk data penting).
* Timestamp pada seluruh tabel.
* Foreign Key menggunakan `ON DELETE RESTRICT` kecuali disebutkan lain.
* Seluruh nama tabel menggunakan bentuk plural.
* Seluruh nama kolom menggunakan `snake_case`.

---

# ERD Overview

```text
roles
   │
   └──────< users
               │
               └──────< members
                           │
                           ├──────< borrowings
                           │             │
                           │             ├──────< borrowing_details
                           │             │                 │
                           │             │                 └────── book_inventories
                           │             │
                           │             └──────< returns
                           │
                           └──────< fines

authors ──────< books >────── publishers

categories ───< books

book_sources ──< book_inventories

books ─────────< book_inventories

shelves ───────< book_inventories

users ───────< audit_logs
```

Arsitektur data:

```text
Book
  ↓
BookInventory
  ↓
BorrowingDetail
  ↓
Borrowing
  ↓
Return
  ↓
Fine
```

Peminjaman dilakukan berdasarkan **BookInventory**. `Book` hanya menyimpan metadata bibliografi, bukan stok atau inventaris fisik.

---

# Enum

## User Status

* active
* inactive
* suspended

---

## Book Condition (Kondisi Fisik Eksemplar)

* good
* damaged
* lost

---

## Inventory Status (Status Eksemplar)

* available
* borrowed
* maintenance
* lost

---

## Book Status (Status Judul Buku di Katalog)

* active
* inactive

---

## Borrow Status

* borrowed
* returned
* overdue
* cancelled

---

## Fine Status

* unpaid
* paid

---

# Tables

---

# roles

Role pengguna.

| Column      | Type               |
| ----------- | ------------------ |
| id          | uuid PK            |
| name        | varchar(50) UNIQUE |
| description | text               |
| created_at  | timestamp          |
| updated_at  | timestamp          |

---

# users

Informasi akun login.

| Column        | Type               |
| ------------- | ------------------ |
| id            | uuid PK            |
| role_id       | uuid FK            |
| name          | varchar(150)       |
| email         | varchar UNIQUE     |
| password_hash | text               |
| avatar_url    | text               |
| status        | enum               |
| last_login    | timestamp          |
| created_at    | timestamp          |
| updated_at    | timestamp          |
| deleted_at    | timestamp nullable |

Relationship

* Many Users → One Role

---

# members

Profil anggota perpustakaan.

| Column      | Type           |
| ----------- | -------------- |
| id          | uuid PK        |
| user_id     | uuid FK UNIQUE |
| member_code | varchar UNIQUE |
| phone       | varchar        |
| address     | text           |
| birth_date  | date           |
| join_date   | date           |
| status      | boolean        |
| created_at  | timestamp      |
| updated_at  | timestamp      |

Relationship

* One User → One Member

---

# categories

Kategori buku.

| Column      | Type           |
| ----------- | -------------- |
| id          | uuid PK        |
| name        | varchar UNIQUE |
| description | text           |
| created_at  | timestamp      |
| updated_at  | timestamp      |

---

# authors

Penulis buku.

| Column     | Type      |
| ---------- | --------- |
| id         | uuid PK   |
| name       | varchar   |
| biography  | text      |
| photo_url  | text      |
| created_at | timestamp |
| updated_at | timestamp |

---

# publishers

Penerbit buku.

| Column     | Type      |
| ---------- | --------- |
| id         | uuid PK   |
| name       | varchar   |
| address    | text      |
| email      | varchar   |
| phone      | varchar   |
| website    | text      |
| created_at | timestamp |
| updated_at | timestamp |

---

# shelves

Lokasi rak buku.

| Column      | Type           |
| ----------- | -------------- |
| id          | uuid PK        |
| code        | varchar UNIQUE |
| name        | varchar        |
| floor       | integer        |
| description | text           |
| created_at  | timestamp      |
| updated_at  | timestamp      |

---

# book_sources

Sumber pengadaan buku (Sumber Buku). Data bersifat dinamis dan dikelola oleh Admin serta Petugas.

| Column      | Type           |
| ----------- | -------------- |
| id          | uuid PK        |
| name        | varchar UNIQUE |
| description | text           |
| created_at  | timestamp      |
| updated_at  | timestamp      |

Contoh data:

* Pembelian
* Hibah
* Sumbangan
* Donasi Alumni
* BOS
* CSR

---

# book_inventories

Inventaris Buku (book copies / eksemplar fisik). Menjadi objek utama dalam proses peminjaman.

| Column         | Type               |
| -------------- | ------------------ |
| id             | uuid PK            |
| inventory_code | varchar UNIQUE     |
| book_id        | uuid FK            |
| source_id      | uuid FK            |
| shelf_id       | uuid FK nullable   |
| condition      | enum               |
| status         | enum               |
| notes          | text               |
| created_at     | timestamp          |
| updated_at     | timestamp          |
| deleted_at     | timestamp nullable |

Relationship

* Many Book Inventories → One Book
* Many Book Inventories → One Book Source
* Many Book Inventories → One Shelf
* One Book Inventory → Many Borrowing Details

---

# books

Master data buku (informasi bibliografi judul). Stok, lokasi rak, kondisi, dan sumber dikelola pada tabel `book_inventories`.

| Column           | Type               |
| ---------------- | ------------------ |
| id               | uuid PK            |
| isbn             | varchar UNIQUE     |
| title            | varchar            |
| slug             | varchar UNIQUE     |
| description      | text               |
| synopsis         | text               |
| cover_image      | text               |
| author_id        | uuid FK            |
| publisher_id     | uuid FK            |
| category_id      | uuid FK            |
| publication_year | integer            |
| language         | varchar            |
| pages            | integer            |
| status           | enum               |
| created_at       | timestamp          |
| updated_at       | timestamp          |
| deleted_at       | timestamp nullable |

Relationship

* Many Books → One Author
* Many Books → One Publisher
* Many Books → One Category
* One Book → Many Book Inventories

Total stok dan stok tersedia dihitung dari tabel `book_inventories`.

---

# borrowings

Header transaksi peminjaman.

| Column      | Type           |
| ----------- | -------------- |
| id          | uuid PK        |
| member_id   | uuid FK        |
| borrow_code | varchar UNIQUE |
| borrow_date | date           |
| due_date    | date           |
| return_date | date nullable  |
| status      | enum           |
| notes       | text           |
| created_at  | timestamp      |
| updated_at  | timestamp      |

Relationship

* One Member → Many Borrowings

---

# borrowing_details

Daftar Inventaris Buku (eksemplar fisik) pada satu transaksi.

| Column             | Type      |
| ------------------ | --------- |
| id                 | uuid PK   |
| borrowing_id       | uuid FK   |
| book_inventory_id  | uuid FK   |
| created_at         | timestamp |

Relationship

* One Borrowing → Many Borrowing Details
* One Book Inventory → Many Borrowing Details

Setiap baris mewakili satu eksemplar fisik (BookInventory) yang dipinjam.

---

# fines

Data denda.

| Column       | Type               |
| ------------ | ------------------ |
| id           | uuid PK            |
| borrowing_id | uuid FK UNIQUE     |
| amount       | numeric(10,2)      |
| paid_at      | timestamp nullable |
| status       | enum               |
| created_at   | timestamp          |

Relationship

* One Borrowing → One Fine

---

# audit_logs

Audit trail aktivitas sistem dan kepatuhan.

| Column      | Type      |
| ----------- | --------- |
| id          | uuid PK   |
| user_id     | uuid FK   |
| action      | varchar   |
| module      | varchar   |
| description | text      |
| ip_address  | varchar   |
| user_agent  | text      |
| created_at  | timestamp |

Relationship

* One User → Many Audit Logs

---

# Storage

Supabase Storage

Bucket

```
book-covers/
```

Contoh

```
book-covers/
    atomic-habits.webp
    clean-code.webp
    harry-potter.jpg
```

Kolom yang menyimpan URL:

```
books.cover_image
```

---

# Cardinality

```
Role
 1
 │
 N
User

User
 1
 │
 1
Member

Category
 1
 │
 N
Book

Author
 1
 │
 N
Book

Publisher
 1
 │
 N
Book

Shelf
 1
 │
 N
Book Inventory

Book Source
 1
 │
 N
Book Inventory

Book
 1
 │
 N
Book Inventory

Member
 1
 │
 N
Borrowing

Borrowing
 1
 │
 N
Borrowing Detail

Book Inventory
 1
 │
 N
Borrowing Detail

Borrowing
 1
 │
 1
Fine

User
 1
 │
 N
Audit Log
```

---

# Index Recommendation

Create index pada:

* users.email
* members.member_code
* books.title
* books.isbn
* books.slug
* books.category_id
* books.author_id
* books.publisher_id
* book_sources.name
* book_inventories.inventory_code
* book_inventories.book_id
* book_inventories.source_id
* book_inventories.shelf_id
* book_inventories.status
* borrowings.member_id
* borrowings.borrow_date
* borrowings.status
* borrowing_details.book_inventory_id
* returns.borrowing_id
* returns.return_date
* fines.borrowing_id
* audit_logs.user_id

---

# Constraints

* Email harus unik.
* ISBN harus unik.
* Slug buku harus unik.
* Kode anggota harus unik.
* Kode peminjaman harus unik.
* Kode inventaris harus unik.
* Nama sumber buku harus unik.
* `return_date` tidak boleh lebih awal dari `borrow_date`.
* Nominal denda tidak boleh negatif.
* Satu eksemplar (BookInventory) memiliki paling banyak satu peminjaman aktif.
* Ketersediaan buku dihitung dari `book_inventories` berstatus `available`; tidak disimpan sebagai kolom pada `books`.

---

# Soft Delete

Menggunakan kolom:

```
deleted_at
```

Diterapkan pada:

* users
* books
* book_inventories

---

# Future Tables

Untuk pengembangan berikutnya dapat ditambahkan:

* book_images (galeri buku)
* book_reviews
* book_favorites
* reservations
* notifications
* settings
* banners
* announcements
* email_logs
* push_notifications
* ai_recommendations
* chatbot_histories
* qr_tokens
* barcode_scans

---

# Migration Order

1. roles
2. users
3. members
4. categories
5. authors
6. publishers
7. shelves
8. book_sources
9. books
10. book_inventories
11. borrowings
12. borrowing_details
13. returns
14. fines
15. audit_logs
