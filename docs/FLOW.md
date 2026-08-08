# FLOW.md

# Business Flow & User Flow

## Project

TBM Semesta Alam

---

# Tujuan

Dokumen ini menjelaskan alur bisnis (Business Flow) dan alur pengguna (User Flow) agar seluruh pengembangan memiliki perilaku yang konsisten.

---

# Aktor

* Guest (Pengunjung)
* Member (Anggota)
* Staff (Petugas)
* Admin

---

# Business Flow Overview

```text
Guest
   │
   ▼
Register
   │
   ▼
Login
   │
   ▼
Browse Books
   │
   ▼
Borrow Book
   │
   ▼
Book Borrowed
   │
   ▼
Return Book
   │
   ▼
Finish
```

---

# Authentication Flow

## Register

Guest

↓

Isi formulir

↓

Validasi

↓

Email belum digunakan

↓

Buat akun

↓

Buat data Member

↓

Login

↓

Dashboard Member

---

## Login

User

↓

Input Email

↓

Input Password

↓

Validasi

↓

Password benar

↓

Buat Session

↓

Redirect sesuai Role

Guest → Login

Member → Dashboard Member

Staff → Dashboard Staff

Admin → Dashboard Admin

---

## Logout

User

↓

Klik Logout

↓

Hapus Session

↓

Redirect Home

---

# Book Browsing Flow

Guest / Member

↓

Home

↓

Cari Buku

↓

Filter

↓

Sorting

↓

Klik Buku

↓

Detail Buku

↓

Lihat Status

↓

Jika tersedia

↓

Pinjam

---

# Borrow Book Flow

Member

↓

Pilih Buku

↓

Klik Pinjam

↓

Cek Login

↓

Cek Status Member

↓

Cek Ketersediaan Inventaris (book_inventories berstatus available)

↓

Cek Maksimal Pinjam

↓

Validasi

↓

Buat Borrowing

↓

Status Inventaris = Borrowed

↓

Berhasil

---

# Return Book Flow

Staff

↓

Cari Transaksi

↓

Klik Pengembalian

↓

Input Kondisi Buku (update `book_inventories.condition`)

↓

Hitung Keterlambatan

↓

Ada Denda?

↓

Ya

↓

Buat Fine

↓

Update Borrowing

↓

Status Inventaris = Available (kembali tersedia)

↓

Selesai

---

# Fine Flow

Return

↓

Terlambat?

↓

Tidak

↓

Selesai

↓

Ya

↓

Hitung

↓

Simpan Fine

↓

Status = Unpaid

↓

Member Bayar

↓

Status = Paid

---

# Book Management Flow

Staff/Admin

↓

Dashboard

↓

Books

↓

Tambah Buku

↓

Isi Form

↓

Upload Cover

↓

Validasi

↓

Simpan

↓

Berhasil

---

# Cover Upload Flow

Staff/Admin

↓

Pilih Cover

↓

Validasi Format

↓

Validasi Ukuran

↓

Upload ke Supabase Storage

↓

Dapatkan Public URL

↓

Simpan ke books.cover_image

↓

Preview Cover

↓

Selesai

---

# Update Book Flow

Staff/Admin

↓

Pilih Buku

↓

Edit

↓

Ubah Data

↓

(Optional) Ganti Cover

↓

Simpan

↓

Berhasil

---

# Delete Book Flow

Staff/Admin

↓

Pilih Buku

↓

Konfirmasi

↓

Soft Delete

↓

Tidak tampil di katalog

---

# Member Management Flow

Admin

↓

Members

↓

Tambah

↓

Validasi

↓

Generate Member Code

↓

Simpan

↓

Berhasil

---

# Category Flow

Admin/Staff

↓

Kategori

↓

Tambah

↓

Edit

↓

Hapus

↓

Refresh Data

---

# Author Flow

Admin/Staff

↓

Penulis

↓

Tambah

↓

Edit

↓

Hapus

---

# Publisher Flow

Admin/Staff

↓

Penerbit

↓

Tambah

↓

Edit

↓

Hapus

---

# Shelf Flow

Admin/Staff

↓

Rak

↓

Tambah

↓

Edit

↓

Hapus

---

# Inventory Management Flow

Admin/Staff

↓

Pilih Buku

↓

Tambah Inventaris

↓

Pilih Sumber Buku (wajib)

↓

Pilih Rak

↓

Input Kode Inventaris

↓

Input Kondisi / Status / Catatan

↓

Validasi

↓

Simpan

↓

Tampil pada daftar Inventaris judul buku

---

# Book Source Management Flow

Admin/Staff

↓

Sumber Buku

↓

Tambah

↓

Edit

↓

Hapus

↓

Refresh

---

# Inventory Search Flow

Admin/Staff

↓

Input Kode Inventaris

↓

Cari

↓

Tampilkan Inventaris & Judul Buku terkait

---

# Export Data Buku Flow

Admin/Staff

↓

Pilih Buku / Filter

↓

Generate

↓

Preview

↓

Export Excel / PDF

---

# Dashboard Flow

Login

↓

Dashboard

↓

Load Statistik

↓

Load Grafik

↓

Load Aktivitas

↓

Selesai

---

# Report Flow

Admin

↓

Reports

↓

Pilih Jenis

↓

Pilih Tanggal

↓

Generate

↓

Preview

↓

Export PDF / Excel

---

# Search Flow

User

↓

Input Keyword

↓

Search

↓

Filter

↓

Sorting

↓

Pagination

↓

Result

---

# Profile Flow

User

↓

Profile

↓

Edit

↓

Validasi

↓

Update

↓

Berhasil

---

# Change Password Flow

User

↓

Profile

↓

Password Lama

↓

Password Baru

↓

Konfirmasi

↓

Validasi

↓

Update

↓

Logout Semua Session (Opsional)

---

# Error Flow

## Login Gagal

Login

↓

Password Salah

↓

Tampilkan Error

↓

Coba Lagi

---

## Buku / Inventaris Tidak Tersedia

Member

↓

Klik Pinjam

↓

Tidak ada inventaris (book_inventories) berstatus available

↓

Tampilkan

"Buku sedang tidak tersedia"

---

## Upload Cover Gagal

Upload

↓

Format Salah

↓

Tampilkan Error

↓

Upload Ulang

---

# Permission Flow

## Guest

* Melihat katalog
* Mencari buku
* Registrasi

---

## Member

* Login
* Pinjam Buku (mengajukan peminjaman judul)
* Lihat Riwayat
* Edit Profil

---

## Staff

* CRUD Buku
* CRUD Inventaris Buku (eksemplar)
* CRUD Sumber Buku
* CRUD Kategori
* CRUD Penulis
* CRUD Rak
* CRUD Peminjaman
* Pencarian berdasarkan Kode Inventaris
* Export Data Buku (Excel/PDF)

---

## Admin

Semua hak Staff

*

- Kelola User
- Kelola Role
- Pengaturan
- Audit Log

---

# Notification Flow

## Borrow Success

Borrow

↓

Berhasil

↓

Toast

"Buku berhasil dipinjam"

---

## Return Success

Return

↓

Berhasil

↓

Toast

"Buku berhasil dikembalikan"

---

## Fine Created

Return

↓

Terlambat

↓

Fine dibuat

↓

Tampilkan nominal denda

---

# Audit Log Flow

User melakukan aksi

↓

Catat

* User ID
* Modul
* Aksi
* Waktu
* IP Address
* User Agent

↓

Simpan ke audit_logs

---

# Future Flow

Reservasi Buku

Member

↓

Buku Tidak Tersedia

↓

Reservasi

↓

Menunggu

↓

Buku Kembali

↓

Notifikasi

↓

Pinjam

---

AI Recommendation

Member

↓

Riwayat Pinjam

↓

Analisis

↓

Rekomendasi Buku

↓

Tampilkan di Dashboard

---

# End-to-End Flow

```text
Guest
   │
   ▼
Register
   │
   ▼
Login
   │
   ▼
Browse Books
   │
   ▼
Book Detail
   │
   ▼
Borrow Book
   │
   ▼
Borrowing Record
   │
   ▼
Return Book
   │
   ▼
Fine (if overdue)
   │
   ▼
History
```
