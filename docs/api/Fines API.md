# Fines API

## Purpose

Dokumen ini mendefinisikan seluruh Server Actions, Business Rules, Validation, Authorization, dan API yang berkaitan dengan **Denda (Fine Management)** pada aplikasi TBM Semesta Alam.

Modul Fine digunakan untuk mengelola seluruh denda yang muncul akibat:

- Keterlambatan pengembalian
- Buku hilang
- Buku rusak
- Pelanggaran lain yang ditentukan oleh perpustakaan

Seluruh denda terhubung dengan transaksi **Borrowing** dan **Book Inventory**.

Dokumen ini menjadi acuan implementasi untuk:

- Server Actions
- Route Handlers
- Validation
- Authorization
- AI Coding Assistant

---

# Module Overview

Entity utama

```
Fine
```

Digunakan untuk:

- Menghasilkan denda otomatis.
- Mengelola pembayaran denda.
- Menyimpan riwayat pembayaran.
- Membuat laporan denda.

---

# Authorization

| Action | Guest | Member | Staff | Admin |
|----------|:----:|:------:|:-----:|:-----:|
| View Own Fines | ❌ | ✅ | ❌ | ❌ |
| View All Fines | ❌ | ❌ | ✅ | ✅ |
| Search Fines | ❌ | ❌ | ✅ | ✅ |
| Create Fine | ❌ | ❌ | ✅ | ✅ |
| Update Fine | ❌ | ❌ | ✅ | ✅ |
| Pay Fine | ❌ | ❌ | ✅ | ✅ |
| Waive Fine | ❌ | ❌ | ❌ | ✅ |
| Delete Fine | ❌ | ❌ | ❌ | ✅ |
| Export Fines | ❌ | ❌ | ✅ | ✅ |

---

# Module Flow

```
Borrow Returned

↓

Late?

↓

YES

↓

Calculate Fine

↓

Create Fine

↓

Waiting Payment

↓

Paid / Waived

↓

Completed
```

---

# Relationships

```
Member

↓

Borrowing

↓

Borrowing Detail

↓

Book Inventory

↓

Fine
```

---

# Fine Status

```
pending

paid

waived

cancelled
```

---

# Fine Type

```
late_return

lost_book

damaged_book

other
```

---

# Entity

Fine

```
id
fineNumber
memberId
borrowingId
bookInventoryId
fineType
status
amount
paidAmount
remainingAmount
description
issuedAt
paidAt
waivedAt
createdBy
updatedBy
createdAt
updatedAt
deletedAt
```

---

# Server Actions

## createFine()

### Purpose

Membuat denda baru.

### Permission

- Staff
- Admin

### Input

```ts
{
  memberId: string
  borrowingId: string
  bookInventoryId: string
  fineType: "late_return" | "lost_book" | "damaged_book" | "other"
  amount: number
  description?: string
}
```

---

## calculateFine()

Menghitung jumlah denda otomatis.

Input

```ts
{
  borrowingId: string
}
```

Output

```ts
{
  lateDays: number
  fineAmount: number
}
```

---

## getFines()

Mengambil seluruh data denda.

Features

- Pagination
- Search
- Filter
- Sorting

---

## getFineById()

Mengambil detail denda.

---

## updateFine()

Mengubah nominal atau deskripsi denda.

Permission

- Staff
- Admin

---

## payFine()

Melakukan pembayaran denda.

Permission

- Staff
- Admin

Input

```ts
{
  fineId: string
  amount: number
  paymentMethod: string
  notes?: string
}
```

---

## waiveFine()

Menghapus kewajiban pembayaran denda.

Permission

Admin

Input

```ts
{
  fineId: string
  reason: string
}
```

---

## deleteFine()

Soft Delete.

Permission

Admin

---

## exportFines()

Format

- Excel
- PDF

---

# Route Handlers

```
GET

/api/fines

GET

/api/fines/:id

POST

/api/fines

PATCH

/api/fines/:id

POST

/api/fines/:id/pay

POST

/api/fines/:id/waive

DELETE

/api/fines/:id

POST

/api/fines/export
```

---

# Validation Rules

## Amount

- Required
- Harus lebih besar dari 0

---

## Payment

- Tidak boleh melebihi Remaining Amount.

---

## Fine Type

Harus salah satu:

```
late_return

lost_book

damaged_book

other
```

---

## Waive Reason

- Required
- Minimal 10 karakter

---

# Business Rules

- Fine otomatis dibuat jika buku terlambat.
- Fine juga dapat dibuat manual oleh Staff/Admin.
- Pembayaran dapat dilakukan sebagian (partial payment).
- Remaining Amount dihitung otomatis.
- Status berubah menjadi **paid** jika Remaining Amount = 0.
- Hanya Admin yang dapat melakukan waive.
- Fine tidak boleh dihapus jika sudah dibayar.
- Soft Delete digunakan.

---

# Fine Calculation

Contoh konfigurasi

```
Rp1.000 / hari
```

Contoh

```
Late Days = 5

↓

Fine = Rp5.000
```

Nilai mengikuti konfigurasi sistem.

---

# Search

Staff

Admin

Berdasarkan

- Fine Number
- Member Code
- Member Name
- Inventory Code
- Borrow Number

Member

Hanya dapat melihat dendanya sendiri.

---

# Sorting

```
issuedAt

paidAt

amount

status

createdAt
```

---

# Filtering

```
status

fineType

member

date

paid
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

- Fine Number
- Member
- Borrow Number
- Inventory Code
- Fine Type
- Amount
- Paid Amount
- Remaining Amount
- Status
- Issued At

---

# Error Codes

| Code | Description |
|------|-------------|
| FINE_NOT_FOUND | Denda tidak ditemukan |
| INVALID_FINE_AMOUNT | Nominal denda tidak valid |
| PAYMENT_EXCEEDS_REMAINING | Pembayaran melebihi sisa denda |
| FINE_ALREADY_PAID | Denda sudah lunas |
| FINE_ALREADY_WAIVED | Denda telah dibebaskan |
| INVALID_FINE_TYPE | Jenis denda tidak valid |
| WAIVE_REASON_REQUIRED | Alasan pembebasan wajib diisi |
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
  code: "FINE_ALREADY_PAID",
  message: "Fine has already been paid."
}
```

---

# Database Tables

```
fines

borrowings

borrowing_details

book_inventories

members

users
```

Relasi

```
members
      │
      └──── borrowings
                 │
                 └──── borrowing_details
                             │
                             └──── book_inventories
                                          │
                                          └──── fines
```

---

# Database Transaction

Seluruh proses pembayaran berada dalam satu transaction.

```
Validate Fine

↓

Create Payment Record

↓

Update Fine

↓

Create Activity Log

↓

Commit
```

Jika gagal

```
Rollback
```

---

# Activity Log

Catat aktivitas berikut:

- Create Fine
- Calculate Fine
- Update Fine
- Pay Fine
- Waive Fine
- Delete Fine
- Export Fines

---

# Related Documentation

- docs/PRD.md
- docs/DATABASE.md
- docs/SCHEMA.md
- docs/FLOW.md
- docs/VALIDATION.md
- docs/PERMISSIONS.md
- docs/ERRORS.md
- docs/api/borrowings.md
- docs/api/returns.md
- docs/api/members.md

---

# Definition of Done

Implementasi Fines API dianggap selesai apabila:

- CRUD Fine tersedia.
- Perhitungan denda otomatis berjalan.
- Pembayaran penuh maupun sebagian didukung.
- Admin dapat melakukan waive fine.
- Soft Delete diterapkan.
- Database Transaction digunakan.
- Authorization mengikuti `PERMISSIONS.md`.
- Response mengikuti `ERRORS.md`.
- Search, Pagination, Sorting, Filtering, dan Export berfungsi.
- Audit Log tercatat.
- Seluruh implementasi konsisten dengan dokumentasi proyek.