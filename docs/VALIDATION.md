# VALIDATION.md

# Validation Specification

## Project

TBM Semesta Alam

---

# Purpose

Dokumen ini mendefinisikan seluruh aturan validasi data pada aplikasi.

Semua input pengguna wajib divalidasi sebelum diproses.

Validasi harus dilakukan pada:

* Frontend
* Server Action
* Route Handler

Frontend hanya untuk meningkatkan pengalaman pengguna.

Server tetap menjadi sumber validasi utama.

---

# Validation Library

Gunakan:

* Zod

Integrasi:

* React Hook Form
* Server Actions
* Route Handlers

---

# General Rules

Semua field harus:

* Memiliki tipe data yang benar.
* Memiliki batas panjang yang sesuai.
* Dibersihkan (trim) sebelum disimpan.
* Tidak menerima karakter yang tidak valid bila tidak diperlukan.

---

# Book Validation

## ISBN

Tipe

String

Aturan

* Wajib diisi.
* ISBN-10 atau ISBN-13.
* Unik.
* Tanpa spasi di awal dan akhir.

Contoh valid

```text id="g0owjt"
9786020324788
```

---

## Title

Tipe

String

Aturan

* Wajib.
* Minimal 3 karakter.
* Maksimal 255 karakter.

---

## Subtitle

Opsional.

Maksimal:

255 karakter.

---

## Slug

Aturan

* Unik.
* Huruf kecil.
* Kebab-case.
* Dibuat otomatis jika tidak diisi.

---

## Synopsis

Opsional.

Maksimal:

5000 karakter.

---

## Publish Year

Tipe

Number

Aturan

* Tidak boleh lebih besar dari tahun saat ini.
* Tidak boleh kurang dari 1000.

---

## Language

Wajib.

Minimal:

2 karakter.

---

## Pages

Number

Minimal:

1

---

## Stok & Stok Tersedia (dihitung otomatis)

Buku (judul) tidak lagi memiliki kolom `stock` dan `available_stock`.

* Stok total = jumlah `book_inventories` yang belum di-soft delete.
* Stok tersedia = jumlah `book_inventories` berstatus `available`.

Nilai ini dihitung otomatis dan divalidasi pada bagian **Book Inventory Validation**.

---

## Status (Judul Buku di Katalog)

Hanya menerima:

* active
* inactive

---

# Book Inventory Validation

## Kode Inventaris (Inventory Code)

Tipe

String

Aturan

* Wajib diisi.
* Unik.
* Minimal 3 karakter.
* Maksimal 50 karakter.
* Tanpa spasi di awal dan akhir.

## Buku (Book)

* Wajib.
* Harus merujuk pada book yang masih aktif.

## Sumber Buku (Source)

* Wajib diisi.
* Harus merujuk pada Book Source yang valid.

## Rak (Shelf)

* Opsional.
* Jika diisi, harus merujuk pada Shelf yang valid.

## Kondisi (Condition)

Hanya menerima:

* good
* damaged
* lost

## Status (Inventory Status)

Hanya menerima:

* available
* borrowed
* maintenance
* lost

## Catatan (Notes)

Opsional.

Maksimal:

500 karakter.

---

# Book Source Validation

## Nama

* Wajib.
* Unik.
* Minimal 2 karakter.
* Maksimal 100 karakter.

## Deskripsi

Opsional.

Maksimal:

500 karakter.

---

# Category Validation

Nama

* Wajib.
* Unik.
* Minimal 2 karakter.
* Maksimal 100 karakter.

Slug

* Unik.
* Dibuat otomatis.

---

# Author Validation

Nama

* Wajib.
* Minimal 3 karakter.
* Maksimal 150 karakter.

Biography

Opsional.

Maksimal:

3000 karakter.

---

# Publisher Validation

Nama

* Wajib.
* Unik.
* Maksimal 150 karakter.

Alamat

Opsional.

Maksimal:

500 karakter.

---

# Shelf Validation

Kode Rak

* Wajib.
* Unik.
* Maksimal 20 karakter.

Nama Rak

* Wajib.
* Maksimal 100 karakter.

Lokasi

Opsional.

---

# Member Validation

Nama

* Wajib.
* Minimal 3 karakter.
* Maksimal 150 karakter.

Email

* Wajib.
* Format email valid.
* Unik.

Nomor Telepon

Opsional.

Jika diisi:

* Hanya angka.
* Panjang 10–15 digit.

Alamat

Opsional.

Maksimal:

500 karakter.

Status

Hanya menerima:

* Active
* Inactive
* Suspended

---

# User Validation

Nama

* Wajib.

Email

* Wajib.
* Format valid.
* Unik.

Role

Hanya menerima:

* Member
* Staff
* Admin

Password

Minimal:

8 karakter.

Harus mengandung:

* Huruf besar.
* Huruf kecil.
* Angka.

Disarankan:

* Karakter khusus.

---

# Borrow Validation

Member

Harus:

* Aktif.
* Tidak diblokir.

Buku / Inventaris

Harus:

* Memiliki minimal satu Inventaris (BookInventory) berstatus `available`.

Tanggal Pinjam

Tidak boleh kosong.

Tanggal Jatuh Tempo

Harus lebih besar dari tanggal pinjam.

---

# Return Validation

Borrowing

Harus:

* Masih aktif.
* Belum dikembalikan.

Tanggal Pengembalian

Tidak boleh lebih kecil dari tanggal pinjam.

---

# Fine Validation

Nominal

Minimal:

0

Status

Hanya menerima:

* Paid
* Unpaid

---

# Cover Upload Validation

Format

* JPG
* JPEG
* PNG
* WebP

Ukuran

Maksimal:

5 MB

Harus berupa gambar yang valid.

---

# Search Validation

Keyword

Maksimal:

100 karakter.

Kode Inventaris

Pencarian berdasarkan Kode Inventaris hanya untuk Admin dan Petugas.

Format Kode Inventaris

Kebab-case / alfanumerik, tanpa spasi.

Filter

Harus berasal dari daftar yang tersedia.

Sorting

Hanya menerima nilai yang telah ditentukan.

---

# Pagination Validation

Page

Minimal:

1

Limit

Minimal:

1

Maksimal:

100

---

# Route Parameter Validation

ID

Harus berupa UUID.

Slug

Kebab-case.

---

# Date Validation

Tanggal tidak boleh:

* Tidak valid.
* Berformat salah.

Jika membutuhkan rentang tanggal:

Tanggal akhir harus lebih besar atau sama dengan tanggal awal.

---

# Trim Rules

Field teks harus:

* Trim kiri.
* Trim kanan.

Hindari penyimpanan spasi yang tidak diperlukan.

---

# Duplicate Validation

Pastikan data berikut unik:

* ISBN
* Email
* Category Name
* Publisher Name
* Shelf Code
* Book Source Name
* Inventory Code
* Slug

---

# Business Rules Validation

Member tidak boleh meminjam jika:

* Status bukan Active.
* Melebihi batas maksimal peminjaman.
* Memiliki peminjaman yang melewati batas (jika kebijakan perpustakaan menerapkan pembatasan).

---

Buku tidak dapat dipinjam jika:

* Tidak ada Inventaris (BookInventory) berstatus `available`.
* Tidak ada eksemplar berstatus `available` untuk judul tersebut.

Peminjaman harus mengacu pada satu Inventaris (BookInventory) yang berstatus `available`.

Satu Inventaris tidak boleh dipinjam lebih dari satu kali secara bersamaan.

---

Pengembalian tidak dapat diproses jika:

* Transaksi sudah selesai.
* Data peminjaman tidak ditemukan.

---

# Error Messages

Gunakan pesan yang jelas.

Contoh:

ISBN

```text id="8c5vc4"
ISBN wajib diisi.
```

Email

```text id="fxlxj0"
Format email tidak valid.
```

Password

```text id="y2r8h0"
Password minimal 8 karakter.
```

Upload

```text id="5c0k0n"
Ukuran file maksimal 5 MB.
```

Stock

```text id="1gljlwm"
Tidak ada eksemplar (inventaris) yang tersedia untuk judul ini.
```

Kode Inventaris

```text id="1gljlwm2"
Kode inventaris sudah digunakan.
```

Sumber Buku

```text id="gljlwms"
Sumber buku wajib dipilih.
```

---

# Client Validation

Frontend harus:

* Menampilkan error secara langsung.
* Menonaktifkan tombol submit saat data tidak valid.
* Menampilkan loading saat proses berlangsung.

---

# Server Validation

Server wajib:

* Memvalidasi ulang seluruh input.
* Tidak mempercayai data dari client.
* Mengembalikan error yang aman.

---

# Database Validation

Gunakan:

* Primary Key
* Foreign Key
* Unique Constraint
* Check Constraint
* Default Value

Sebagai lapisan validasi tambahan.

---

# Logging Validation Error

Error penting dapat dicatat untuk analisis, tanpa menyimpan data sensitif seperti password.

---

# Future Validation

Jika fitur baru ditambahkan, aturan validasi harus diperbarui sebelum implementasi dimulai.

---

# Definition of Done

Validasi dianggap selesai jika:

* Seluruh input divalidasi menggunakan Zod.
* Frontend dan server memiliki aturan yang konsisten.
* Semua error ditampilkan dengan jelas.
* Tidak ada data tidak valid yang dapat disimpan ke database.
* Constraint database mendukung aturan validasi yang telah ditetapkan.
