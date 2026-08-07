# Dashboard API

## Purpose

Dokumen ini mendefinisikan seluruh Server Actions, Business Rules, Authorization, Dashboard Widgets, Analytics, serta API yang berkaitan dengan **Dashboard** pada aplikasi TBM Semesta Alam.

Dashboard merupakan halaman utama setelah pengguna berhasil login. Informasi yang ditampilkan berbeda sesuai **Role-Based Access Control (RBAC)** sehingga setiap pengguna hanya melihat data yang relevan dengan hak aksesnya.

Dokumen ini menjadi acuan implementasi untuk:

- Dashboard Overview
- Analytics
- Server Actions
- Widgets
- Charts
- Activity Feed
- AI Coding Assistant

---

# Module Overview

Dashboard menyediakan ringkasan informasi secara real-time.

Role yang didukung:

```
Admin

Staff

Member
```

Guest tidak memiliki Dashboard.

---

# Dashboard Access

| Dashboard | Guest | Member | Staff | Admin |
|------------|:----:|:------:|:-----:|:-----:|
| Login Required | ❌ | ✅ | ✅ | ✅ |
| View Personal Dashboard | ❌ | ✅ | ❌ | ❌ |
| View Staff Dashboard | ❌ | ❌ | ✅ | ❌ |
| View Admin Dashboard | ❌ | ❌ | ❌ | ✅ |

---

# Dashboard Layout

```
Top Navigation

↓

Sidebar

↓

Dashboard Header

↓

Summary Cards

↓

Charts

↓

Tables

↓

Activity Timeline

↓

Quick Actions
```

---

# Admin Dashboard

Menampilkan seluruh statistik sistem.

Summary Cards

```
Total Books

Total Book Inventories

Available Inventories

Borrowed Inventories

Total Members

Active Staff

Today's Borrowings

Today's Returns

Outstanding Fines
```

---

# Staff Dashboard

Summary Cards

```
Borrowings Today

Returns Today

Available Books

Late Borrowings

Pending Fines

New Members

Inventory Maintenance
```

---

# Member Dashboard

Summary Cards

```
Borrowed Books

Borrowing History

Outstanding Fines

Books Due Soon

Active Membership
```

---

# Dashboard Widgets

## Statistics Cards

Menampilkan angka ringkasan.

Contoh

```
Total Books

Total Inventories

Borrowings

Returns

Members

Fines
```

---

## Recent Borrowings

Menampilkan peminjaman terbaru.

Kolom

```
Borrow Number

Member

Inventory Code

Book

Borrow Date

Status
```

---

## Recent Returns

Kolom

```
Borrow Number

Inventory Code

Book

Return Date

Condition
```

---

## Recent Members

Kolom

```
Member Code

Name

Join Date

Status
```

---

## Inventory Status

Menampilkan jumlah inventaris berdasarkan status.

```
Available

Borrowed

Reserved

Maintenance

Lost

Damaged
```

---

## Book Condition

```
Excellent

Good

Fair

Poor

Damaged
```

---

## Top Borrowed Books

Menampilkan buku yang paling sering dipinjam.

Kolom

```
Title

Borrow Count
```

---

## Late Borrowings

Menampilkan daftar keterlambatan.

Kolom

```
Member

Inventory Code

Book

Due Date

Late Days
```

---

## Outstanding Fines

Kolom

```
Member

Fine Number

Amount

Status
```

---

## Activity Timeline

Aktivitas terbaru.

Contoh

```
Book Added

Inventory Added

Borrow Book

Return Book

Fine Paid

Member Registered
```

---

# Dashboard Charts

## Borrowings per Month

```
Line Chart
```

---

## Returns per Month

```
Line Chart
```

---

## Books by Category

```
Bar Chart
```

---

## Books by Publisher

```
Bar Chart
```

---

## Books by Source

```
Pie Chart
```

---

## Inventory Status

```
Pie Chart
```

---

## Book Condition

```
Pie Chart
```

---

## Borrowing Trend

```
Area Chart
```

---

## Fine Collection

```
Bar Chart
```

---

# Quick Actions

Admin

```
Add Book

Add Inventory

Add Member

Add Staff

Generate Report
```

---

Staff

```
Borrow Book

Return Book

Add Inventory

Register Member
```

---

Member

```
Search Books

View Borrowings

View Fines

Edit Profile
```

---

# Server Actions

## getDashboardSummary()

Mengambil seluruh data ringkasan dashboard.

Output

```ts
{
  totalBooks: number
  totalInventories: number
  availableInventories: number
  borrowedInventories: number
  totalMembers: number
  totalStaff: number
  borrowingsToday: number
  returnsToday: number
  outstandingFines: number
}
```

---

## getDashboardCharts()

Mengambil data seluruh grafik.

---

## getRecentBorrowings()

Mengambil transaksi peminjaman terbaru.

---

## getRecentReturns()

Mengambil transaksi pengembalian terbaru.

---

## getRecentMembers()

Mengambil anggota terbaru.

---

## getLateBorrowings()

Mengambil daftar keterlambatan.

---

## getOutstandingFines()

Mengambil daftar denda yang belum dibayar.

---

## getActivityTimeline()

Mengambil aktivitas terbaru.

---

## getTopBorrowedBooks()

Mengambil daftar buku yang paling sering dipinjam.

---

# Route Handlers

```
GET

/api/dashboard

GET

/api/dashboard/summary

GET

/api/dashboard/charts

GET

/api/dashboard/recent-borrowings

GET

/api/dashboard/recent-returns

GET

/api/dashboard/recent-members

GET

/api/dashboard/activity

GET

/api/dashboard/late-borrowings

GET

/api/dashboard/top-books

GET

/api/dashboard/outstanding-fines
```

---

# Refresh Strategy

Dashboard menggunakan:

```
Server Components

+

Server Actions

+

On-demand Revalidation
```

Data yang sering berubah:

```
Borrowings

Returns

Inventories

Dashboard Summary
```

direfresh secara otomatis setelah transaksi berhasil.

---

# Business Rules

- Dashboard hanya dapat diakses setelah login.
- Data dashboard mengikuti Role pengguna.
- Statistik dihitung secara real-time.
- Soft deleted data tidak dihitung.
- Dashboard menggunakan query aggregation.
- Widget dapat dimatikan melalui konfigurasi sistem (opsional).

---

# Search

Dashboard mendukung pencarian cepat.

Admin

Staff

```
Book

Inventory Code

Member

Borrow Number
```

Member

```
Book Title

ISBN

Author
```

---

# Performance Guidelines

- Gunakan caching untuk statistik yang tidak sering berubah.
- Gunakan pagination pada tabel.
- Gunakan lazy loading untuk chart.
- Hindari query N+1.
- Gunakan database index pada kolom agregasi.

---

# Error Codes

| Code | Description |
|------|-------------|
| DASHBOARD_NOT_FOUND | Dashboard tidak ditemukan |
| SUMMARY_FAILED | Gagal mengambil ringkasan |
| CHART_FAILED | Gagal mengambil data grafik |
| ACTIVITY_FAILED | Gagal mengambil aktivitas |
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
  code: "SUMMARY_FAILED",
  message: "Failed to load dashboard summary."
}
```

---

# Data Sources

```
books

book_inventories

book_sources

borrowings

borrowing_details

returns

members

users

fines

categories

authors

publishers
```

---

# Activity Log

Dashboard mencatat:

- Dashboard Viewed
- Analytics Viewed
- Report Shortcut Used
- Quick Action Executed

---

# Related Documentation

- docs/PRD.md
- docs/FLOW.md
- docs/ROUTES.md
- docs/UI_UX.md
- docs/PERMISSIONS.md
- docs/ERRORS.md
- docs/api/reports.md
- docs/api/books.md
- docs/api/book-inventories.md
- docs/api/borrowings.md
- docs/api/returns.md
- docs/api/fines.md
- docs/api/members.md

---

# Definition of Done

Implementasi Dashboard API dianggap selesai apabila:

- Dashboard tersedia untuk Admin, Staff, dan Member.
- Statistik ditampilkan secara real-time.
- Widget dan grafik berfungsi.
- Data mengikuti Role pengguna.
- Quick Actions tersedia sesuai hak akses.
- Server Actions mengembalikan data yang konsisten.
- Authorization mengikuti `PERMISSIONS.md`.
- Response mengikuti `ERRORS.md`.
- Performa tetap optimal pada dataset besar.
- Seluruh implementasi konsisten dengan dokumentasi proyek.