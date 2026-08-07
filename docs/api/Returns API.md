# Returns API

## Purpose

Dokumen ini mendefinisikan seluruh Server Actions, Business Rules, Validation, Authorization, dan API yang berkaitan dengan proses **Pengembalian Buku (Return)** pada aplikasi TBM Semesta Alam.

Proses pengembalian dilakukan berdasarkan **Book Inventory**, bukan Book. Saat buku dikembalikan, sistem akan memperbarui status inventaris, menghitung keterlambatan, membuat denda (jika ada), serta mencatat aktivitas ke audit log.

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
Borrowing
BorrowingDetail
BookInventory
Fine
```

Return digunakan untuk:

- Mengembalikan inventaris buku.
- Memperbarui status inventaris.
- Menghitung keterlambatan.
- Membuat denda otomatis.
- Mencatat kondisi buku saat kembali.
- Menyimpan riwayat pengembalian.

---

# Authorization

| Action | Guest | Member | Staff | Admin |
|----------|:----:|:------:|:-----:|:-----:|
| View Own Returns | ❌ | ✅ | ❌ | ❌ |
| Return Book | ❌ | ❌ | ✅ | ✅ |
| Update Return | ❌ | ❌ | ✅ | ✅ |
| Cancel Return | ❌ | ❌ | ❌ | ✅ |
| Export Returns | ❌ | ❌ | ✅ | ✅ |
| View All Returns | ❌ | ❌ | ✅ | ✅ |

---

# Return Flow

```
Borrowing

↓

Scan / Input Inventory Code

↓

Validasi Borrowing

↓

Validasi Inventory

↓

Input Book Condition

↓

Hitung Keterlambatan

↓

Generate Fine (Optional)

↓

Update Inventory Status

↓

Update Borrowing Status

↓

Create Activity Log

↓

Success
```

---

# Relationships

```
Borrowing

↓

BorrowingDetail

↓

BookInventory

↓

Return

↓

Fine
```

---

# Return Status

```
returned

late

lost

damaged
```

---

# Server Actions

## returnBook()

### Purpose

Mengembalikan satu atau lebih inventaris buku.

### Permission

- Staff
- Admin

### Input

```ts
{
  borrowingId: string

  items: [
    {
      borrowingDetailId: string
      returnedCondition:
        | "excellent"
        | "good"
        | "fair"
        | "poor"
        | "damaged"
      notes?: string
    }
  ]
}
```

### Process

- Validasi Borrowing.
- Validasi Borrowing Detail.
- Validasi Inventory.
- Hitung keterlambatan.
- Generate Fine bila diperlukan.
- Update kondisi inventaris.
- Update status inventaris menjadi available.
- Update Borrowing bila seluruh inventaris telah kembali.

---

## getReturns()

Mengambil seluruh data pengembalian.

Features

- Pagination
- Search
- Filter
- Sorting

---

## getReturnById()

Mengambil detail pengembalian.

---

## updateReturn()

Mengubah catatan pengembalian.

Permission

- Staff
- Admin

---

## cancelReturn()

Membatalkan transaksi pengembalian.

Permission

Admin

Digunakan apabila terjadi kesalahan input.

---

## searchReturns()

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

## exportReturns()

Format

- Excel
- PDF

---

# Route Handlers

```
GET

/api/returns

GET

/api/returns/:id

POST

/api/returns

PATCH

/api/returns/:id

POST

/api/returns/:id/cancel

POST

/api/returns/export
```

---

# Validation Rules

## Borrowing

Harus

- Ada
- Status = borrowed

---

## Inventory

Harus

```
status = borrowed
```

---

## Returned Condition

Harus salah satu

```
excellent

good

fair

poor

damaged
```

---

## Return Date

Tidak boleh lebih kecil dari Borrow Date.

---

# Late Return

Jika

```
Return Date > Due Date
```

maka sistem menghitung:

```
Late Days
```

dan membuat Fine apabila aturan perpustakaan mengharuskannya.

---

# Business Rules

- Return dilakukan berdasarkan Book Inventory.
- Satu inventaris hanya dapat dikembalikan satu kali.
- Inventaris otomatis berubah menjadi **available** setelah berhasil dikembalikan.
- Kondisi buku diperbarui sesuai input petugas.
- Jika buku terlambat, sistem menghitung jumlah hari keterlambatan.
- Jika terdapat denda, sistem membuat data Fine secara otomatis.
- Borrowing berubah menjadi **returned** apabila seluruh inventaris telah dikembalikan.
- Seluruh proses menggunakan Database Transaction.

---

# Inventory Status Flow

```
borrowed

↓

available
```

Jika kondisi buku rusak berat

```
borrowed

↓

damaged
```

Jika buku hilang

```
borrowed

↓

lost
```

---

# Search

Staff

Admin

Mencari berdasarkan

- Borrow Number
- Inventory Code
- Member Name
- Member Code
- Book Title

Member

Hanya dapat melihat riwayat pengembaliannya sendiri.

---

# Sorting

```
returnDate

borrowDate

dueDate

memberName

createdAt
```

---

# Filtering

```
status

late

member

staff

condition
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
- Return Date
- Member
- Inventory Code
- Book Title
- Return Condition
- Late Days
- Fine
- Staff

---

# Error Codes

| Code | Description |
|------|-------------|
| RETURN_NOT_FOUND | Data pengembalian tidak ditemukan |
| BORROWING_NOT_FOUND | Data peminjaman tidak ditemukan |
| INVENTORY_NOT_FOUND | Inventaris tidak ditemukan |
| INVENTORY_NOT_BORROWED | Inventaris tidak sedang dipinjam |
| INVALID_RETURN_DATE | Tanggal pengembalian tidak valid |
| INVALID_RETURN_CONDITION | Kondisi buku tidak valid |
| RETURN_ALREADY_COMPLETED | Buku sudah dikembalikan |
| FINE_GENERATION_FAILED | Gagal membuat denda |
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
  code: "RETURN_ALREADY_COMPLETED",
  message: "Book has already been returned."
}
```

---

# Database Tables

```
borrowings

borrowing_details

book_inventories

returns

fines

users
```

Relasi

```
borrowings
      │
      └──── borrowing_details
                   │
                   └──── book_inventories
                               │
                               └──── returns
                                        │
                                        └──── fines
```

---

# Database Transaction

Seluruh proses berikut berada dalam satu transaction.

```
Validate Borrowing

↓

Create Return

↓

Update Borrowing Detail

↓

Update Inventory

↓

Create Fine (Optional)

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

- Return Book
- Update Return
- Cancel Return
- Generate Fine
- Export Returns

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
- docs/api/book-inventories.md
- docs/api/fines.md

---

# Definition of Done

Implementasi Returns API dianggap selesai apabila:

- Pengembalian dilakukan berdasarkan Book Inventory.
- Status inventaris diperbarui otomatis.
- Kondisi buku dapat dicatat saat pengembalian.
- Perhitungan keterlambatan berjalan otomatis.
- Fine dibuat otomatis bila diperlukan.
- Database Transaction digunakan.
- Authorization mengikuti `PERMISSIONS.md`.
- Response mengikuti `ERRORS.md`.
- Search, Pagination, Sorting, Filtering, dan Export berfungsi.
- Audit Log tercatat.
- Seluruh implementasi konsisten dengan dokumentasi proyek.