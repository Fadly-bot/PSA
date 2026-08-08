# UI_UX.md

# UI / UX Design Specification

## Project

TBM Semesta Alam

---

# Design Goals

Aplikasi harus:

* Modern
* Bersih (Clean)
* Mudah digunakan
* Responsif
* Konsisten
* Ramah untuk pengguna baru
* Cepat diakses

---

# Design Principles

* Minimalist
* Accessibility First
* Mobile First
* Responsive
* Consistent Components
* Reusable UI
* Fast Interaction

---

# Target Device

* Mobile
* Tablet
* Laptop
* Desktop

---

# Layout Structure

## Public Layout

Komponen:

* Navbar
* Hero Section
* Search Bar
* Featured Books
* Categories
* Footer

---

## Auth Layout

Komponen:

* Logo
* Welcome Text
* Authentication Form
* Background Illustration (Opsional)

---

## Dashboard Layout

Komponen:

* Sidebar
* Header
* Breadcrumb
* Notification Button
* User Menu
* Main Content

---

# Sitemap

```text id="7qshbc"
Home
│
├── Books
│      └── Detail Book
│
├── Categories
│
├── About
│
├── Contact
│
├── Login
│
└── Register

Dashboard
│
├── Overview
├── Books
├── Book Inventories
├── Book Sources
├── Categories
├── Authors
├── Publishers
├── Shelves
├── Members
├── Borrowings
├── Returns
├── Fines
├── Reports
├── Users
├── Roles
├── Settings
└── Profile
```

---

# Color Palette

Primary

* Blue

Secondary

* Emerald

Success

* Green

Warning

* Yellow

Danger

* Red

Background

* White
* Gray
* Dark (Dark Mode)

---

# Typography

Heading

* Bold

Body

* Regular

Caption

* Medium

---

# Border Radius

Gunakan radius konsisten.

* Card
* Button
* Input
* Dialog

---

# Spacing

Gunakan sistem spacing 4px / 8px.

---

# Icon

Gunakan:

* Lucide React

---

# Navigation

Navbar

Menu:

* Home
* Books
* Categories
* About
* Contact

Kanan:

* Login
* Register

Jika login:

* Dashboard
* Profile
* Logout

---

# Sidebar

Dashboard

Menu:

Dashboard

Master Data

* Books
* Book Inventories
* Book Sources
* Categories
* Authors
* Publishers
* Shelves

Library

* Members
* Borrowings
* Returns
* Fines

Administration

* Users
* Roles
* Reports
* Settings
* Audit Logs

---

# Dashboard

Menampilkan

* Total Books
* Total Members
* Total Borrowings
* Total Returns
* Total Fines
* Popular Books

Grafik

* Borrow Trend
* New Members

---

# Home Page

Section

Hero

↓

Search

↓

Popular Books

↓

Newest Books

↓

Categories

↓

About

↓

FAQ

↓

Footer

---

# Books Page

Komponen

Search

Filter

Sorting

Pagination

Book Grid

---

# Books Page (Admin / Staff)

Tampilan khusus Admin dan Petugas:

* Satu judul buku (Book) hanya muncul satu kali.
* Setiap baris memperlihatkan judul beserta ringkasan jumlah stok/stok tersedia.
* Inventaris (Book Copies) dari judul tersebut dapat diperluas dan ditampilkan sebagai tabel/daftar di bawahnya.
* Kolom Inventaris: Kode Inventaris, Kondisi, Status, Lokasi Rak, Sumber Buku.
* Search mendukung Kode Inventaris.
* Tombol Export Excel / PDF.

---

# Book Inventory Page

Komponen

* Table Inventaris (semua judul)
* Search by Kode Inventaris
* Filter (Kondisi, Status, Sumber Buku, Rak)
* Pagination
* Detail Inventaris
* Tambah / Edit / Hapus Inventaris

---

# Book Source Page

Komponen

* Table Sumber Buku
* Search
* CRUD (Tambah / Edit / Hapus)

---

# Book Card

Menampilkan

* Cover Buku
* Judul
* Penulis
* Kategori
* Ketersediaan (stok tersedia dari jumlah Inventaris available)
* Tombol Detail

---

# Book Detail

Menampilkan

Cover Besar

Judul

ISBN

Kategori

Penulis

Penerbit

Bahasa

Tahun Terbit

Jumlah Halaman

Stok

Status

Sinopsis

Daftar Inventaris (untuk Admin/Petugas)

* Kode Inventaris
* Kondisi
* Status
* Lokasi Rak
* Sumber Buku

Button

Pinjam

---

# Cover Upload

Admin / Staff

Komponen

Upload Area

Preview

Replace Button

Delete Button

Progress Indicator

Validation Message

---

# Book Form

Field (bibliografi judul)

ISBN

Judul

Kategori

Penulis

Penerbit

Bahasa

Jumlah Halaman

Tahun

Status

Sinopsis

Cover Upload

Button

Save

Cancel

Catatan: Stok dan lokasi rak tidak lagi diisi pada form Buku; keduanya dikelola melalui form Inventaris Buku.

---

# Inventory Form

Field

Buku (Judul)

Kode Inventaris

Sumber Buku (wajib, dari daftar dinamis)

Rak

Kondisi (Baik / Rusak Ringan / Rusak Berat)

Status (Tersedia / Dipinjam / Maintenance / Hilang)

Catatan

Button

Save

Cancel

---

# Category Page

Table

Search

Pagination

CRUD

---

# Author Page

Table

Search

CRUD

---

# Publisher Page

Table

Search

CRUD

---

# Shelf Page

Table

CRUD

---

# Member Page

Table

Search

Filter

Pagination

Detail

Edit

Delete

---

# Borrowing Page

Table

Search

Status Badge

Borrow Button

Return Button

---

# Return Page

Table

Fine Information

Return Button

---

# Fine Page

Table

Payment Status

Filter

---

# User Page

Table

Role Badge

Status Badge

CRUD

---

# Report Page

Jenis Laporan

* Laporan Peminjaman
* Laporan Buku
* Laporan Buku + Peminjaman

Komponen

Filter (jenis laporan, tanggal, kategori)

Preview

Export PDF

Export Excel

---

# Settings Page

Tabs

General

Library

Storage

Security

System

---

# Profile Page

Avatar

Personal Information

Change Password

Activity

---

# Table Standard

Semua tabel menggunakan:

* Search
* Pagination
* Sorting
* Row Selection
* Bulk Action
* Empty State

---

# Dialog

Gunakan Dialog untuk

Delete

Confirmation

Warning

Reset

---

# Toast

Success

Error

Info

Warning

---

# Empty State

Jika data kosong.

Tampilkan

* Icon
* Judul
* Deskripsi
* Tombol Aksi

---

# Loading

Gunakan

Skeleton Loader

Untuk

Card

Table

Form

Dashboard

---

# Error State

Jika terjadi error.

Tampilkan

* Icon
* Pesan
* Retry Button

---

# Badges

Gunakan Badge untuk

Inventory Status (Status Eksemplar)

* Available
* Borrowed
* Maintenance
* Lost

Book Condition (Kondisi Eksemplar)

* Good
* Damaged
* Lost

Borrow Status

* Borrowed
* Returned
* Overdue

Fine Status

* Paid
* Unpaid

User Status

* Active
* Inactive
* Suspended

---

# Form Validation

Semua form harus:

* Inline Error
* Required Indicator
* Disabled saat Submit
* Loading Button

---

# Accessibility

Semua komponen harus:

* Keyboard Friendly
* Screen Reader Friendly
* Focus Indicator
* ARIA Label
* Color Contrast

---

# Responsive Rules

Mobile

* Sidebar menjadi Drawer
* Card satu kolom
* Tabel dapat di-scroll horizontal

Tablet

* Sidebar Collapse
* Card dua kolom

Desktop

* Sidebar tetap
* Grid tiga hingga empat kolom

---

# Animation

Gunakan Framer Motion untuk:

* Page Transition
* Modal
* Dropdown
* Sidebar
* Hover Card
* Toast

Animasi harus halus dan tidak mengganggu performa.

---

# Reusable Components

Layout

* Navbar
* Sidebar
* Header
* Footer
* Breadcrumb

Book

* BookCard
* BookGrid
* BookTable
* BookSearch
* BookFilter
* BookForm
* BookCoverUpload
* BookInventoryTable
* BookInventoryForm
* BookSourceTable
* BookSourceForm
* InventorySearchBar

Dashboard

* StatisticCard
* ChartCard
* ActivityCard

Form

* Input
* Select
* Textarea
* DatePicker
* Upload
* Dialog

Shared

* DataTable
* Pagination
* SearchBar
* FilterBar
* StatusBadge
* EmptyState
* LoadingSkeleton
* ConfirmDialog
* DeleteDialog

---

# Dark Mode

Semua halaman mendukung:

* Background gelap
* Card gelap
* Kontras teks yang baik
* Icon dan badge tetap terbaca

---

# Future UI

* QR Code Scanner
* Barcode Scanner
* AI Recommendation Widget
* Chatbot Widget
* Notification Center
* Calendar View
* Analytics Dashboard
