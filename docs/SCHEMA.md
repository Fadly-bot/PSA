# SCHEMA.md

# Drizzle ORM Schema Documentation

## Project

TBM Semesta Alam

---

# Overview

Schema menggunakan:

* PostgreSQL
* Drizzle ORM
* UUID Primary Key
* Timestamp otomatis
* Soft Delete pada tabel tertentu

Semua tabel berada di schema `public`.

---

# File Structure

```
src/
└── db/
    ├── index.ts
    ├── schema.ts
    ├── relations.ts
    └── migrations/
```

---

# Common Columns

Setiap tabel menggunakan pola berikut:

```ts
id UUID PRIMARY KEY
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

Untuk tabel yang mendukung soft delete:

```ts
deleted_at TIMESTAMP NULL
```

---

# Enum Definitions

## user_status

```
active
inactive
suspended
```

---

## book_status (Status Judul Buku di Katalog)

```
active
inactive
```

---

## inventory_status (Status Eksemplar)

```
available
borrowed
maintenance
lost
```

---

## book_condition (Kondisi Fisik Eksemplar)

```
good
damaged
lost
```

---

## borrow_status

```
borrowed
returned
overdue
cancelled
```

---

## fine_status

```
unpaid
paid
```

---

# Table Schemas

---

## roles

```ts
id: uuid
name: varchar(50) unique
description: text nullable
created_at: timestamp
updated_at: timestamp
```

---

## users

```ts
id: uuid
role_id: uuid references roles.id
name: varchar(150)
email: varchar unique
password_hash: text
avatar_url: text nullable
status: user_status
last_login: timestamp nullable
created_at: timestamp
updated_at: timestamp
deleted_at: timestamp nullable
```

Constraint:

* email unique

---

## members

```ts
id: uuid
user_id: uuid references users.id unique
member_code: varchar unique
phone: varchar nullable
address: text nullable
birth_date: date nullable
join_date: date
status: boolean default true
created_at: timestamp
updated_at: timestamp
```

---

## categories

```ts
id: uuid
name: varchar unique
description: text nullable
created_at: timestamp
updated_at: timestamp
```

---

## authors

```ts
id: uuid
name: varchar
biography: text nullable
photo_url: text nullable
created_at: timestamp
updated_at: timestamp
```

---

## publishers

```ts
id: uuid
name: varchar
address: text nullable
email: varchar nullable
phone: varchar nullable
website: text nullable
created_at: timestamp
updated_at: timestamp
```

---

## shelves

```ts
id: uuid
code: varchar unique
name: varchar
floor: integer nullable
description: text nullable
created_at: timestamp
updated_at: timestamp
```

---

## book_sources

```ts
id: uuid
name: varchar unique
description: text nullable
created_at: timestamp
updated_at: timestamp
```

Contoh data awal:

```text
Pembelian
Hibah
Sumbangan
Donasi Alumni
BOS
CSR
```

---

## book_inventories

```ts
id: uuid
inventory_code: varchar unique
book_id: uuid references books.id
source_id: uuid references book_sources.id
shelf_id: uuid references shelves.id nullable
condition: book_condition default good
status: inventory_status default available
notes: text nullable
created_at: timestamp
updated_at: timestamp
deleted_at: timestamp nullable
```

Validation Rules:

* `inventory_code` unik.
* `book_id` wajib.
* `source_id` wajib.
* Total stok dan stok tersedia dihitung dari `book_inventories`, tidak disimpan sebagai kolom.

---

## books

```ts
id: uuid
isbn: varchar unique
title: varchar
slug: varchar unique
description: text nullable
synopsis: text nullable
cover_image: text nullable
author_id: uuid references authors.id
publisher_id: uuid references publishers.id
category_id: uuid references categories.id
publication_year: integer nullable
language: varchar nullable
pages: integer nullable
status: book_status default active
created_at: timestamp
updated_at: timestamp
deleted_at: timestamp nullable
```

Validation Rules:

* Buku (judul) hanya menyimpan informasi bibliografi.
* Stok, lokasi rak, kondisi, dan sumber dikelola pada `book_inventories`.

---

## borrowings

```ts
id: uuid
member_id: uuid references members.id
borrow_code: varchar unique
borrow_date: date
due_date: date
return_date: date nullable
status: borrow_status default borrowed
notes: text nullable
created_at: timestamp
updated_at: timestamp
```

---

## borrowing_details

```ts
id: uuid
borrowing_id: uuid references borrowings.id
book_inventory_id: uuid references book_inventories.id
created_at: timestamp
```

Setiap baris mewakili satu eksemplar fisik (BookInventory) yang dipinjam.

---

## fines

```ts
id: uuid
borrowing_id: uuid references borrowings.id unique
amount: numeric(10,2) default 0
paid_at: timestamp nullable
status: fine_status default unpaid
created_at: timestamp
```

---

## activity_logs

```ts
id: uuid
user_id: uuid references users.id
action: varchar
module: varchar
description: text nullable
ip_address: varchar nullable
user_agent: text nullable
created_at: timestamp
```

---

# Relations

## rolesRelations

```
roles (1) ----------- (N) users
```

---

## usersRelations

```
users (1) ----------- (1) members
users (1) ----------- (N) activity_logs
```

---

## booksRelations

```
authors (1) ----------- (N) books
publishers (1) -------- (N) books
categories (1) -------- (N) books
books (1) ------------- (N) book_inventories
```

---

## bookSourcesRelations

```
book_sources (1) ------ (N) book_inventories
```

---

## bookInventoriesRelations

```
books (1) ------------- (N) book_inventories
book_sources (1) ------ (N) book_inventories
shelves (1) ----------- (N) book_inventories
book_inventories (1) -- (N) borrowing_details
```

---

## borrowingsRelations

```
members (1) ----------- (N) borrowings
borrowings (1) -------- (N) borrowing_details
borrowings (1) -------- (1) fines
```

---

# Suggested Drizzle Export Order

```ts
// Enums
userStatusEnum
bookStatusEnum
inventoryStatusEnum
bookConditionEnum
borrowStatusEnum
fineStatusEnum

// Master Tables
roles
users
members
categories
authors
publishers
shelves
bookSources
books
bookInventories

// Transaction Tables
borrowings
borrowingDetails
fines

// Utility Tables
activityLogs
```

---

# Index Strategy

## Search Optimization

```
books.title
books.isbn
books.slug
```

---

## Filter Optimization

```
books.category_id
books.author_id
books.publisher_id
books.status
book_sources.name
book_inventories.inventory_code
book_inventories.book_id
book_inventories.source_id
book_inventories.shelf_id
book_inventories.condition
book_inventories.status
```

---

## Transaction Optimization

```
borrowings.member_id
borrowings.status
borrowings.borrow_date
borrowing_details.book_inventory_id
```

---

## Audit Optimization

```
activity_logs.user_id
activity_logs.created_at
```

---

# Soft Delete Query Convention

Seluruh query untuk tabel yang memiliki `deleted_at` harus menggunakan filter:

```ts
deleted_at IS NULL
```

---

# Cover Image Convention

Kolom:

```
books.cover_image
```

Format yang disimpan:

```
book-covers/atomic-habits.webp
```

URL publik dibentuk melalui Supabase Storage.

---

# Migration Order

Urutan migration agar foreign key tidak gagal:

```
01_roles
02_users
03_members
04_categories
05_authors
06_publishers
07_shelves
08_book_sources
09_books
10_book_inventories
11_borrowings
12_borrowing_details
13_fines
14_activity_logs
```

---

# Seed Data

Minimal data awal:

## Roles

```
admin
petugas
anggota
```

---

## Categories

```
Teknologi
Pemrograman
Jaringan
Database
AI & Machine Learning
Bisnis
Novel
Pendidikan
```

---

## Shelves

```
A1 - Teknologi
A2 - Pemrograman
B1 - Novel
B2 - Pendidikan
```

---

## Book Sources

```
Pembelian
Hibah
Sumbangan
Donasi Alumni
BOS
CSR
```

---

## Admin User

```
email: admin@perpus.local
role: admin
status: active
```

---

# Notes for AI Coding Assistant

* Gunakan `pgTable()` untuk seluruh tabel.
* Gunakan `relations()` terpisah di `relations.ts`.
* Jangan gunakan cascade delete pada tabel transaksi.
* `books` hanya menyimpan informasi bibliografi; stok dan lokasi rak dikelola pada `book_inventories`.
* Peminjaman mengacu pada `book_inventories` (eksemplar fisik), bukan langsung ke `books`.
* Gunakan transaction ketika melakukan peminjaman dan pengembalian agar konsistensi eksemplar (BookInventory) selalu terjaga.
* Ubah `book_inventories.status` menjadi `borrowed` saat dipinjam dan kembali ke `available` saat dikembalikan.
* Stok tersedia dihitung dari `book_inventories` berstatus `available`.
* Seluruh operasi penting harus membuat record pada `activity_logs`.
* Validasi seluruh input menggunakan Zod sebelum query database dijalankan.
