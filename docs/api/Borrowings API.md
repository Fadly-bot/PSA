# Borrowings API

## Purpose

Dokumen ini mendefinisikan seluruh Server Actions, Business Rules, Validation, Authorization, dan API yang berkaitan dengan proses **Peminjaman Buku (Borrowing)** pada aplikasi TBM Semesta Alam.

Berbeda dengan sistem lama, proses peminjaman dilakukan berdasarkan **BookInventory**, bukan langsung terhadap **Book**.

Dokumen ini menjadi acuan implementasi untuk:

- Server Actions
- Route Handlers (jika diperlukan)
- Validation
- Authorization
- AI Coding Assistant

---

# Module Overview

Entity utama:

```
Borrowing
BorrowingDetail
BookInventory
Member
```

Borrowing berfungsi untuk:

- Mencatat transaksi peminjaman.
- Menghubungkan anggota dengan inventaris buku.
- Mengubah status inventaris.
- Menghasilkan riwayat peminjaman.
- Menjadi dasar proses pengembalian.

---

# Authorization

| Action | Guest | Member | Staff | Admin |
|----------|:----:|:------:|:-----:|:-----:|
| View Own Borrowings | ❌ | ✅ | ❌ | ❌ |
| Create Borrowing | ❌ | ❌ | ✅ | ✅ |
| Update Borrowing | ❌ | ❌ | ✅ | ✅ |
| Cancel Borrowing | ❌ | ❌ | ✅ | ✅ |
| Extend Borrowing | ❌ | ❌ | ✅ | ✅ |
| Approve Borrowing | ❌ | ❌ | ✅ | ✅ |
| Export Borrowings | ❌ | ❌ | ✅ | ✅ |
| View All Borrowings | ❌ | ❌ | ✅ | ✅ |

---

# Borrowing Flow

```
Member

↓

Staff memilih Inventaris

↓

Validasi Member

↓

Validasi Inventaris

↓

Create Borrowing

↓

Create Borrowing Detail

↓

Update Inventory Status

↓

Success
```

---

# Relationships

```
Member

↓

Borrowing

↓

BorrowingDetail

↓

BookInventory

↓

Book
```

---

# Borrowing Status

```
borrowed

returned

late

cancelled
```

---

# Server Actions

## createBorrowing()

### Purpose

Membuat transaksi peminjaman baru.

### Permission

- Staff
- Admin

### Input

```ts
{
  memberId: string
  borrowDate: Date
  dueDate: Date
  notes?: string

  items: [
    {
      bookInventoryId: string
    }
  ]
}
```

### Process

- Validasi member.
- Validasi inventaris.
- Membuat Borrowing.
- Membuat Borrowing Detail.
- Mengubah status inventaris menjadi **borrowed**.

---

## getBorrowings()

Mengambil seluruh transaksi.

Features

- Pagination
- Search
- Filter
- Sorting

---

## getBorrowingById()

Mengambil detail transaksi.

---

## updateBorrowing()

Mengubah data transaksi sebelum buku dikembalikan.

---

## cancelBorrowing()

Membatalkan transaksi.

Status inventaris dikembalikan menjadi:

```
available
```

---

## extendBorrowing()

Memperpanjang masa pinjam.

Input

```ts
{
    borrowingId: string
    newDueDate: Date
}
```

---

## searchBorrowings()

Parameter

```
q
```

Mencari berdasarkan

- Borrow Number
- Member Code
- Member Name
- Inventory Code
- Book Title

---

## exportBorrowings()

Format

- Excel
- PDF

---

# Route Handlers

```
GET

/api/borrowings

GET

/api/borrowings/:id

POST

/api/borrowings

PATCH

/api/borrowings/:id

POST

/api/borrowings/:id/cancel

POST

/api/borrowings/:id/extend

POST

/api/borrowings/export
```

---

# Validation Rules

## Member

Harus:

- Active
- Tidak diblokir
- Tidak expired

---

## Inventory

Harus:

```
status = available
```

---

## Due Date

Harus lebih besar dari:

```
Borrow Date
```

---

## Borrow Limit

Tidak boleh melebihi batas maksimal peminjaman.

Contoh

```
3 buku
```

Nilai mengikuti konfigurasi aplikasi.

---

# Business Rules

- Borrow dilakukan berdasarkan **BookInventory**.
- Satu inventaris hanya boleh dipinjam oleh satu anggota pada waktu yang sama.
- Inventaris otomatis berubah menjadi **borrowed** setelah transaksi berhasil.
- Inventaris tidak dapat dipilih apabila status bukan **available**.
- Member yang diblokir tidak dapat melakukan peminjaman.
- Member dengan masa aktif berakhir tidak dapat melakukan peminjaman.
- Borrowing dapat berisi lebih dari satu inventaris.
- Seluruh proses dijalankan dalam **Database Transaction**.
- Jika salah satu inventaris gagal diproses, seluruh transaksi dibatalkan (rollback).

---

# Inventory Status Flow

```
available

↓

borrowed

↓

available
```

Jika buku hilang atau rusak berat, status dapat diubah melalui modul Inventaris.

---

# Search

Staff

Admin

Mencari berdasarkan:

- Borrow Number
- Inventory Code
- Member Code
- Member Name
- Book Title

Member

Hanya dapat melihat riwayat peminjamannya sendiri.

---

# Sorting

```
borrowDate

dueDate

createdAt

memberName
```

---

# Filtering

```
status

member

staff

date

late
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

- Borrow Number
- Borrow Date
- Due Date
- Member
- Inventory Code
- Book Title
- Status
- Staff

---

# Error Codes

| Code | Description |
|------|-------------|
| BORROWING_NOT_FOUND | Data peminjaman tidak ditemukan |
| MEMBER_NOT_FOUND | Anggota tidak ditemukan |
| MEMBER_BLOCKED | Anggota diblokir |
| MEMBER_EXPIRED | Keanggotaan telah berakhir |
| INVENTORY_NOT_FOUND | Inventaris tidak ditemukan |
| INVENTORY_NOT_AVAILABLE | Inventaris sedang tidak tersedia |
| MAX_BORROW_LIMIT | Melebihi batas peminjaman |
| INVALID_DUE_DATE | Tanggal jatuh tempo tidak valid |
| BORROW_ALREADY_CANCELLED | Peminjaman sudah dibatalkan |
| EXPORT_FAILED | Gagal membuat laporan |
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
    message: "Selected inventory is not available."
}
```

---

# Database Tables

```
borrowings

borrowing_details

members

book_inventories

books

users
```

Relasi

```
members

↓

borrowings

↓

borrowing_details

↓

book_inventories

↓

books
```

---

# Database Transaction

Seluruh proses berikut harus berada dalam satu transaction.

```
Create Borrowing

↓

Create Borrowing Details

↓

Update Book Inventory

↓

Create Activity Log

↓

Commit
```

Jika salah satu gagal

```
Rollback
```

---

# Activity Log

Catat aktivitas berikut:

- Borrow Book
- Cancel Borrowing
- Extend Borrowing
- Update Borrowing

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
- docs/api/members.md
- docs/api/book-inventories.md
- docs/api/returns.md

---

# Definition of Done

Implementasi Borrowings API dianggap selesai apabila:

- CRUD transaksi peminjaman tersedia.
- Peminjaman menggunakan **BookInventory**.
- Status inventaris berubah otomatis saat dipinjam.
- Validasi member dan inventaris diterapkan.
- Database transaction digunakan.
- Authorization mengikuti `PERMISSIONS.md`.
- Response mengikuti `ERRORS.md`.
- Search, Pagination, Sorting, Filtering, dan Export berfungsi.
- Audit log tercatat.
- Seluruh implementasi konsisten dengan dokumentasi proyek.