# TESTING.md

# Testing Specification

## Project

TBM Semesta Alam

---

# Purpose

Dokumen ini mendefinisikan strategi pengujian agar seluruh fitur aplikasi bekerja dengan benar, aman, dan konsisten sebelum dirilis ke production.

Pengujian dilakukan pada:

* Frontend
* Backend
* Database
* Authentication
* Authorization
* Business Logic
* Storage

---

# Testing Goals

Setiap fitur harus:

* Berfungsi sesuai PRD.
* Mengikuti FLOW.md.
* Memenuhi VALIDATION.md.
* Mengikuti AUTH.md.
* Tidak merusak fitur lain.
* Tidak menghasilkan error TypeScript.
* Tidak menghasilkan lint error.

---

# Testing Scope

## Functional Testing

Memastikan seluruh fitur berjalan sesuai kebutuhan.

---

## Integration Testing

Memastikan komunikasi antar modul berjalan dengan benar.

---

## Database Testing

Memastikan data tersimpan, diperbarui, dan dihapus dengan benar.

---

## Authentication Testing

Memastikan login, logout, session, dan permission bekerja sesuai aturan.

---

## Authorization Testing

Memastikan setiap role hanya dapat mengakses fitur yang diizinkan.

---

## Validation Testing

Memastikan seluruh validasi frontend dan server berjalan konsisten.

---

## Storage Testing

Memastikan upload, update, dan penghapusan cover buku berjalan dengan benar.

---

## Performance Testing

Memastikan aplikasi tetap responsif dengan jumlah data yang besar.

---

## Accessibility Testing

Memastikan aplikasi dapat digunakan dengan keyboard dan screen reader.

---

# Test Environment

Framework:

* Next.js

Database:

* Supabase PostgreSQL

Storage:

* Supabase Storage

Authentication:

* Better Auth

Browser minimum:

* Chrome
* Edge
* Firefox
* Safari

---

# Functional Test Cases

## Authentication

### Register

Harus berhasil jika:

* Email valid.
* Email belum digunakan.
* Password memenuhi aturan.

Harus gagal jika:

* Email sudah digunakan.
* Password tidak valid.

---

### Login

Harus berhasil jika:

* Email benar.
* Password benar.

Harus gagal jika:

* Password salah.
* Email tidak ditemukan.
* Akun tidak aktif.

---

### Logout

Harus:

* Menghapus session.
* Mengarahkan ke halaman utama.

---

# Book Testing

## Tambah Buku

Berhasil jika:

* Semua field valid.
* Cover valid.

Gagal jika:

* ISBN duplikat.
* Judul kosong.
* Cover tidak valid.

---

## Edit Buku

Pastikan:

* Data berubah.
* Cover diperbarui jika diganti.
* Data lain tidak berubah.

---

## Hapus Buku

Pastikan:

* Soft delete berjalan.
* Data tidak tampil di katalog.
* Relasi tetap aman.

---

# Book Inventory Testing

## Tambah Inventaris

Berhasil jika:

* Kode Inventaris unik.
* Buku valid.
* Sumber Buku dipilih (wajib).

Gagal jika:

* Kode Inventaris duplikat.
* Sumber Buku kosong.
* Buku tidak valid.

Pastikan:

* Status default = available.
* Kondisi default = good.

---

## Edit / Hapus Inventaris

Pastikan:

* Perubahan tersimpan.
* Eksemplar dengan peminjaman aktif tidak dapat dihapus.
* Soft delete berjalan.

---

# Book Source Testing

* Tambah sumber buku.
* Edit sumber buku.
* Hapus sumber buku.
* Nama sumber buku harus unik.
* Sumber buku yang masih digunakan oleh inventaris tidak dapat dihapus.

---

# Category Testing

* Tambah kategori.
* Edit kategori.
* Hapus kategori.
* Nama kategori harus unik.

---

# Author Testing

* Tambah.
* Edit.
* Hapus.

---

# Publisher Testing

* Tambah.
* Edit.
* Hapus.

---

# Shelf Testing

* Tambah.
* Edit.
* Hapus.

---

# Member Testing

* Tambah anggota.
* Edit anggota.
* Suspend anggota.
* Aktivasi kembali anggota.

---

# Borrowing Testing

Pastikan:

* Peminjaman mengacu pada satu Inventaris (BookInventory).
* `book_inventories.status` berubah menjadi `borrowed`.
* `book_inventories` yang dipinjam tidak dapat dipinjam kembali bersamaan.

Tidak boleh berhasil jika:

* Tidak ada Inventaris (BookInventory) berstatus `available`.
* Member tidak aktif.
* Batas peminjaman terlampaui.

---

# Return Testing

Pastikan:

* Status borrowing berubah menjadi Returned.
* `book_inventories.status` kembali menjadi `available`.

Jika terlambat:

* Fine dibuat.

---

# Fine Testing

Pastikan:

* Nominal benar.
* Status dapat berubah menjadi Paid.

---

# Search Testing

Pastikan:

* Keyword bekerja.
* Filter bekerja.
* Sorting bekerja.
* Pagination benar.
* Pencarian Kode Inventaris bekerja untuk Admin/Petugas.

---

# Upload Testing

Pastikan:

* JPG berhasil.
* PNG berhasil.
* WEBP berhasil.

Harus gagal jika:

* PDF.
* EXE.
* File > 5 MB.

---

# Authorization Testing

## Guest

Tidak boleh membuka:

```text id="2vgscj"
/dashboard
```

---

## Member

Tidak boleh:

* CRUD Buku.
* CRUD User.

---

## Staff

Tidak boleh:

* Mengelola Admin.
* Mengubah Settings.

---

## Admin

Harus dapat mengakses seluruh fitur.

---

# Database Testing

Pastikan:

* Primary Key benar.
* Foreign Key benar.
* Cascade sesuai desain.
* Unique Constraint berjalan.
* Check Constraint berjalan.

---

# Server Action Testing

Pastikan setiap Server Action:

* Memvalidasi input.
* Memeriksa session.
* Memeriksa role.
* Mengembalikan response yang benar.
* Menangani error.

---

# Route Handler Testing

Jika digunakan:

* Status HTTP benar.
* JSON valid.
* Authorization benar.

---

# Validation Testing

Seluruh aturan pada VALIDATION.md harus diuji.

Contoh:

* ISBN kosong.
* Email tidak valid.
* Password pendek.
* Kode Inventaris duplikat.
* Sumber Buku tidak dipilih (saat menambah inventaris).
* Tidak ada Inventaris berstatus `available` saat peminjaman.

---

# UI Testing

Pastikan:

* Loading muncul.
* Toast muncul.
* Error tampil.
* Empty State tampil.
* Dialog bekerja.

---

# Responsive Testing

Uji pada:

* Mobile
* Tablet
* Desktop

Pastikan:

* Layout tidak rusak.
* Sidebar responsif.
* Tabel tetap dapat digunakan.

---

# Accessibility Testing

Pastikan:

* Seluruh input memiliki label.
* Fokus keyboard terlihat.
* Navigasi menggunakan keyboard berfungsi.
* Kontras warna memadai.

---

# Performance Testing

Target:

* Halaman utama cepat dimuat.
* Dashboard tetap responsif.
* Pagination digunakan pada data besar.
* Gambar menggunakan optimasi.

---

# Regression Testing

Setiap fitur baru tidak boleh merusak:

* Login
* Dashboard
* CRUD Buku
* Peminjaman
* Pengembalian

---

# Bug Reporting

Setiap bug minimal mencatat:

* Judul
* Langkah reproduksi
* Hasil yang diharapkan
* Hasil aktual
* Screenshot (jika ada)
* Tingkat prioritas

---

# Severity Levels

Critical

* Tidak dapat login.
* Database rusak.
* Data hilang.

High

* CRUD gagal.
* Peminjaman gagal.

Medium

* Filter tidak bekerja.
* Pagination salah.

Low

* Typo.
* Alignment UI.
* Ikon tidak tampil.

---

# Release Checklist

Sebelum release:

* Build berhasil.
* Tidak ada error TypeScript.
* Tidak ada lint error.
* Semua test case utama lulus.
* Dokumentasi diperbarui.
* Migration database telah diuji.

---

# Definition of Done

Sebuah fitur dianggap selesai jika:

* Sesuai PRD.
* Mengikuti FLOW.
* Validasi berjalan.
* Permission berjalan.
* UI responsif.
* Error ditangani.
* Tidak ada error TypeScript.
* Tidak ada lint error.
* Tidak ada bug kritis.
* Dokumentasi terkait telah diperbarui.
