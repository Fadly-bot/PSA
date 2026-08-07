# Reports API

## Purpose

Dokumen ini mendefinisikan seluruh Server Actions, Business Rules, Validation, Authorization, dan API yang berkaitan dengan **Laporan (Reports)** pada aplikasi TBM Semesta Alam.

Modul Reports digunakan untuk menghasilkan laporan operasional perpustakaan yang dapat ditampilkan di dashboard maupun diekspor ke berbagai format.

Seluruh laporan mengambil data dari modul utama seperti:

- Books
- Book Inventories
- Borrowings
- Returns
- Members
- Fines

Dokumen ini menjadi acuan implementasi untuk:

- Server Actions
- Route Handlers
- Export Service
- Validation
- Authorization
- AI Coding Assistant

---

# Module Overview

Laporan yang tersedia:

```
Book Report

Inventory Report

Borrowing Report

Return Report

Fine Report

Member Report

Book + Borrowing Report

Dashboard Summary
```

---

# Authorization

| Action | Guest | Member | Staff | Admin |
|----------|:----:|:------:|:-----:|:-----:|
| View Reports | ❌ | ❌ | ✅ | ✅ |
| Generate Reports | ❌ | ❌ | ✅ | ✅ |
| Export Excel | ❌ | ❌ | ✅ | ✅ |
| Export PDF | ❌ | ❌ | ✅ | ✅ |
| Dashboard Analytics | ❌ | ❌ | ✅ | ✅ |

---

# Report Types

## Book Report

Menampilkan seluruh data bibliografi.

Kolom

```
ISBN

Title

Author

Publisher

Category

Total Inventory

Available Inventory

Borrowed Inventory

Created At
```

---

## Inventory Report

Menampilkan seluruh inventaris fisik.

Kolom

```
Inventory Code

Book Title

ISBN

Shelf

Book Source

Condition

Status

Created At
```

---

## Borrowing Report

Kolom

```
Borrow Number

Member

Inventory Code

Book Title

Borrow Date

Due Date

Status

Staff
```

---

## Return Report

Kolom

```
Borrow Number

Inventory Code

Book Title

Return Date

Late Days

Condition

Staff
```

---

## Fine Report

Kolom

```
Fine Number

Member

Borrow Number

Fine Type

Amount

Paid Amount

Remaining Amount

Status
```

---

## Member Report

Kolom

```
Member Code

Name

Class

Phone

Status

Borrow Count

Fine Count
```

---

## Book + Borrowing Report

Laporan gabungan.

Kolom

```
Book

ISBN

Inventory Code

Member

Borrow Date

Due Date

Return Date

Status
```

---

## Dashboard Summary

Menampilkan statistik.

```
Total Books

Total Inventories

Available Inventories

Borrowed Inventories

Members

Borrowings Today

Returns Today

Late Borrowings

Outstanding Fines
```

---

# Server Actions

## generateBookReport()

Menghasilkan laporan buku.

Output

- JSON
- Excel
- PDF

---

## generateInventoryReport()

Menghasilkan laporan inventaris.

---

## generateBorrowingReport()

Menghasilkan laporan peminjaman.

---

## generateReturnReport()

Menghasilkan laporan pengembalian.

---

## generateFineReport()

Menghasilkan laporan denda.

---

## generateMemberReport()

Menghasilkan laporan anggota.

---

## generateBookBorrowingReport()

Menghasilkan laporan gabungan buku dan peminjaman.

---

## generateDashboardSummary()

Menghasilkan data statistik dashboard.

Output

```ts
{
  totalBooks: number
  totalInventories: number
  availableInventories: number
  borrowedInventories: number
  totalMembers: number
  borrowingsToday: number
  returnsToday: number
  outstandingFines: number
}
```

---

# Route Handlers

```
GET

/api/reports/books

GET

/api/reports/inventories

GET

/api/reports/borrowings

GET

/api/reports/returns

GET

/api/reports/fines

GET

/api/reports/members

GET

/api/reports/book-borrowings

GET

/api/reports/dashboard

POST

/api/reports/export
```

---

# Export Formats

Didukung

```
Excel (.xlsx)

PDF (.pdf)

JSON
```

---

# Export Options

```ts
{
    reportType: string

    format:
        | "excel"
        | "pdf"
        | "json"

    filters: {}

    sorting: {}

    columns: []

    dateRange: {}
}
```

---

# Filters

Semua laporan mendukung filter.

Contoh

```
Start Date

End Date

Status

Member

Category

Shelf

Book Source

Author

Publisher

Inventory Status

Book Condition
```

---

# Sorting

```
Created At

Updated At

Book Title

Borrow Date

Return Date

Member Name

Inventory Code
```

---

# Search

Laporan mendukung pencarian berdasarkan

```
Book Title

ISBN

Inventory Code

Member Name

Borrow Number

Fine Number

Publisher

Author
```

---

# Pagination

Untuk tampilan dashboard.

```
page

limit
```

Export selalu menghasilkan seluruh data sesuai filter.

---

# Validation Rules

## Date Range

- Start Date ≤ End Date

---

## Export Format

Harus salah satu

```
excel

pdf

json
```

---

## Report Type

Harus salah satu

```
books

inventories

borrowings

returns

fines

members

bookBorrowings

dashboard
```

---

# Business Rules

- Export menggunakan filter yang sedang aktif.
- PDF menggunakan template resmi aplikasi.
- Excel menggunakan worksheet terpisah untuk setiap laporan.
- Dashboard menggunakan data real-time.
- Laporan tidak boleh menampilkan data yang telah di-soft delete kecuali dipilih secara eksplisit.
- Hanya Staff dan Admin yang dapat mengakses laporan.

---

# Dashboard Cards

```
Books

Inventories

Borrowings

Returns

Members

Fines

Late Borrowings

Available Books
```

---

# Charts

Dashboard mendukung grafik:

```
Borrowings per Month

Returns per Month

Books by Category

Books by Publisher

Books by Source

Inventory Status

Book Condition

Top Borrowed Books

Fine Collection
```

---

# Error Codes

| Code | Description |
|------|-------------|
| REPORT_NOT_FOUND | Jenis laporan tidak ditemukan |
| INVALID_REPORT_TYPE | Jenis laporan tidak valid |
| INVALID_EXPORT_FORMAT | Format ekspor tidak didukung |
| INVALID_DATE_RANGE | Rentang tanggal tidak valid |
| EXPORT_FAILED | Gagal menghasilkan laporan |
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
    code: "EXPORT_FAILED",
    message: "Failed to generate report."
}
```

---

# Data Sources

```
books

book_inventories

book_sources

authors

publishers

categories

shelves

members

borrowings

borrowing_details

returns

fines

users
```

---

# Performance Guidelines

- Gunakan pagination untuk tampilan web.
- Gunakan indexing pada kolom pencarian.
- Gunakan query aggregation untuk statistik dashboard.
- Gunakan lazy loading untuk laporan besar.
- Gunakan streaming response untuk export dataset berukuran besar.

---

# Activity Log

Catat aktivitas berikut:

- Generate Report
- Export Excel
- Export PDF
- Export JSON
- View Dashboard Analytics

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
- docs/api/book-inventories.md
- docs/api/borrowings.md
- docs/api/returns.md
- docs/api/fines.md
- docs/api/members.md

---

# Definition of Done

Implementasi Reports API dianggap selesai apabila:

- Seluruh jenis laporan tersedia.
- Dashboard Summary menampilkan statistik real-time.
- Export Excel, PDF, dan JSON berfungsi.
- Filter, Search, Sorting, dan Pagination berjalan dengan baik.
- Seluruh laporan mengambil data yang konsisten dari database.
- Authorization mengikuti `PERMISSIONS.md`.
- Response mengikuti `ERRORS.md`.
- Activity Log tercatat.
- Performa tetap baik untuk dataset besar.
- Seluruh implementasi konsisten dengan dokumentasi proyek.