# ROUTES.md

# Application Routes

## Project

TBM Semesta Alam

---

# Routing Strategy

Framework: **Next.js App Router**

Routing menggunakan:

* Route Groups
* Nested Routes
* Dynamic Routes
* Protected Routes
* Public Routes

---

# Route Groups

```text
(app)
(auth)
(dashboard)
(public)
(api)
```

---

# Folder Structure

```text
app/
│
├── (public)/
├── (auth)/
├── (dashboard)/
├── api/
├── not-found.tsx
├── error.tsx
├── loading.tsx
└── layout.tsx
```

---

# Public Routes

Tidak membutuhkan login.

## Home

```text
/
```

Menampilkan:

* Hero Section
* Buku Terbaru
* Buku Populer
* Kategori
* FAQ
* Footer

---

## Catalog

```text
/books
```

Fitur

* Search
* Filter
* Sorting
* Pagination

---

## Book Detail

```text
/books/[slug]
```

Menampilkan

* Cover
* Detail Buku
* Penulis
* Kategori
* Penerbit
* Rak
* Status
* Sinopsis

---

## Categories

```text
/categories
```

---

## Category Detail

```text
/categories/[slug]
```

---

## About

```text
/about
```

---

## Contact

```text
/contact
```

---

# Authentication Routes

## Login

```text
/login
```

---

## Register

```text
/register
```

---

## Forgot Password

```text
/forgot-password
```

---

## Reset Password

```text
/reset-password
```

---

# Member Routes

Semua route membutuhkan login.

## Dashboard

```text
/dashboard
```

---

## Profile

```text
/dashboard/profile
```

---

## Edit Profile

```text
/dashboard/profile/edit
```

---

## Change Password

```text
/dashboard/profile/password
```

---

## Borrow History

```text
/dashboard/borrowings
```

---

## Borrow Detail

```text
/dashboard/borrowings/[id]
```

---

## Fines

```text
/dashboard/fines
```

---

## Wishlist (Future)

```text
/dashboard/wishlist
```

---

# Staff Routes

## Books

```text
/dashboard/books
```

Menampilkan buku (judul) satu kali per baris. Setiap baris dapat diperluas untuk menampilkan seluruh Inventaris (eksemplar) judul tersebut.

Fitur:

* Search (termasuk Kode Inventaris)
* Filter
* Sorting
* Pagination
* Export Excel / PDF

---

## Add Book

```text
/dashboard/books/new
```

---

## Book Detail

```text
/dashboard/books/[id]
```

Menampilkan:

* Informasi bibliografi buku
* Daftar Inventaris (eksemplar) dengan Kode Inventaris, Kondisi, Status, Lokasi Rak, dan Sumber Buku

---

## Edit Book

```text
/dashboard/books/[id]/edit
```

---

## Book Inventories

```text
/dashboard/inventories
```

Menampilkan seluruh inventaris (eksemplar) dari semua judul. Mendukung pencarian berdasarkan Kode Inventaris.

## Add Book Inventory

```text
/dashboard/inventories/new
```

## Edit Book Inventory

```text
/dashboard/inventories/[id]/edit
```

---

## Categories

```text
/dashboard/categories
```

---

## Add Category

```text
/dashboard/categories/new
```

---

## Edit Category

```text
/dashboard/categories/[id]/edit
```

---

## Authors

```text
/dashboard/authors
```

---

## Publishers

```text
/dashboard/publishers
```

---

## Shelves

```text
/dashboard/shelves
```

---

## Book Sources

```text
/dashboard/book-sources
```

---

## Add Book Source

```text
/dashboard/book-sources/new
```

---

## Edit Book Source

```text
/dashboard/book-sources/[id]/edit
```

---

## Members

```text
/dashboard/members
```

---

## Borrowings

```text
/dashboard/borrowings/manage
```

---

## Borrow Detail

```text
/dashboard/borrowings/manage/[id]
```

---

## Returns

```text
/dashboard/returns
```

---

## Fines

```text
/dashboard/fines/manage
```

---

# Admin Routes

## Users

```text
/dashboard/users
```

---

## Add User

```text
/dashboard/users/new
```

---

## Edit User

```text
/dashboard/users/[id]/edit
```

---

## Roles

```text
/dashboard/roles
```

---

## Activity Logs

```text
/dashboard/activity-logs
```

---

## Reports

```text
/dashboard/reports
```

---

## Settings

```text
/dashboard/settings
```

---

## Backup

```text
/dashboard/settings/backup
```

---

## Restore

```text
/dashboard/settings/restore
```

---

# API Routes

Menggunakan Route Handlers.

## Authentication

```text
/api/auth/*
```

---

## Books

```text
/api/books
```

```text
/api/books/[id]
```

```text
/api/books/export
```

---

## Book Inventories

```text
/api/inventories
```

```text
/api/inventories/[id]
```

```text
/api/inventories/search
```

---

## Book Sources

```text
/api/book-sources
```

```text
/api/book-sources/[id]
```

---

## Categories

```text
/api/categories
```

---

## Authors

```text
/api/authors
```

---

## Publishers

```text
/api/publishers
```

---

## Shelves

```text
/api/shelves
```

---

## Members

```text
/api/members
```

---

## Borrowings

```text
/api/borrowings
```

---

## Returns

```text
/api/returns
```

---

## Fines

```text
/api/fines
```

---

## Upload

```text
/api/upload
```

---

## Dashboard

```text
/api/dashboard
```

---

## Reports

```text
/api/reports
```

---

# Server Actions

Disarankan menggunakan Server Actions untuk operasi CRUD.

```text
actions/
```

Isi folder

```text
actions/

books.ts

bookInventories.ts

bookSources.ts

categories.ts

authors.ts

publishers.ts

shelves.ts

members.ts

borrowings.ts

returns.ts

fines.ts

users.ts

settings.ts
```

---

# Dynamic Routes

Menggunakan:

```text
[id]
```

Untuk:

* Edit
* Detail
* Delete

Dan

```text
[slug]
```

Untuk halaman publik.

---

# Route Protection

## Guest

Akses:

* /
* /books
* /about
* /contact
* /login
* /register

---

## Member

Tambahan:

* /dashboard
* /dashboard/profile
* /dashboard/borrowings
* /dashboard/fines

---

## Staff

Tambahan:

* Semua halaman manajemen buku
* Inventaris Buku (eksemplar)
* Sumber Buku
* Kategori
* Penulis
* Rak
* Anggota
* Peminjaman

---

## Admin

Tambahan:

* Users
* Roles
* Settings
* Reports
* Activity Logs

---

# Layout Structure

## Root Layout

```text
layout.tsx
```

Komponen

* Theme Provider
* Auth Provider
* Toaster

---

## Public Layout

Komponen

* Navbar
* Footer

---

## Auth Layout

Komponen

* Logo
* Form Container

---

## Dashboard Layout

Komponen

* Sidebar
* Header
* Breadcrumb
* User Menu
* Notification
* Main Content

---

# Error Pages

## 404

```text
/not-found
```

---

## 403

Tidak memiliki route khusus.

Ditampilkan ketika role tidak memiliki izin.

---

## 500

Menggunakan

```text
error.tsx
```

---

# Loading

Menggunakan

```text
loading.tsx
```

Untuk:

* Dashboard
* Books
* Members
* Reports

---

# Middleware

Melindungi route:

* /dashboard/*
* /api/* (sesuai kebutuhan)

Tugas middleware:

* Cek Session
* Cek Role
* Redirect Login
* Redirect Forbidden

---

# URL Convention

Gunakan:

* Huruf kecil
* Kebab-case
* Tidak menggunakan underscore
* Dynamic route menggunakan ID atau slug

Contoh:

```text
/dashboard/books
/dashboard/books/new
/dashboard/books/123/edit
/books/atomic-habits
```

---

# Future Routes

```text
/dashboard/reservations
```

```text
/dashboard/notifications
```

```text
/dashboard/chatbot
```

```text
/dashboard/recommendations
```

```text
/dashboard/analytics
```
