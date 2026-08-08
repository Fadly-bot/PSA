# AUTH.md

# Authentication & Authorization Specification

## Project

TBM Semesta Alam

---

# Purpose

Dokumen ini mendefinisikan sistem autentikasi (Authentication) dan otorisasi (Authorization) yang digunakan pada aplikasi.

Semua fitur yang memerlukan login wajib mengikuti aturan pada dokumen ini.

---

# Authentication Provider

Gunakan:

* Better Auth

Database:

* Supabase PostgreSQL

ORM:

* Drizzle ORM

---

# Authentication Strategy

Metode login utama:

* Email
* Password

Future Support:

* Google OAuth
* GitHub OAuth
* Microsoft OAuth

---

# User Roles

Aplikasi memiliki empat role utama.

## Guest

Belum login.

Hak akses:

* Melihat katalog buku
* Mencari buku
* Melihat detail buku
* Registrasi
* Login

Tidak dapat:

* Meminjam buku
* Mengakses dashboard

---

## Member

Pengguna perpustakaan.

Hak akses:

* Login
* Logout
* Melihat dashboard pribadi
* Melihat riwayat peminjaman
* Melihat denda
* Mengubah profil
* Mengubah password
* Meminjam buku

---

## Staff

Petugas perpustakaan.

Hak akses Member

*

- CRUD Buku
- CRUD Penulis
- CRUD Kategori
- CRUD Rak
- CRUD Penerbit
- Kelola Anggota
- Kelola Peminjaman
- Kelola Pengembalian
- Kelola Denda

Tidak dapat:

* Mengelola Admin
* Mengubah pengaturan sistem

---

## Admin

Hak akses penuh.

Dapat:

* Semua hak Staff
* Kelola User
* Kelola Role
* Kelola Pengaturan
* Kelola Laporan
* Melihat Audit Log
* Menghapus data permanen

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

Hash password

↓

Buat akun Better Auth

↓

Buat data Member

↓

Login otomatis

↓

Dashboard

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

Verifikasi password

↓

Buat Session

↓

Redirect sesuai role

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

# Session Management

Gunakan session dari Better Auth.

Session harus:

* Aman
* HttpOnly
* Secure (Production)
* Memiliki masa berlaku

---

# Route Protection

## Public Routes

```text id="e9gk0q"
/
```

```text id="8j7cgh"
/books
```

```text id="of9x2q"
/books/[slug]
```

```text id="09bgdi"
/about
```

```text id="1sjgqt"
/contact
```

```text id="1vlb5i"
/login
```

```text id="nibvuh"
/register
```

---

## Protected Routes

```text id="1txd9s"
/dashboard/*
```

Semua route dashboard memerlukan session yang valid.

---

# Permission Matrix

| Fitur             | Guest | Member | Staff | Admin |
| ----------------- | :---: | :----: | :---: | :---: |
| Lihat Buku        |   ✅   |    ✅   |   ✅   |   ✅   |
| Cari Buku         |   ✅   |    ✅   |   ✅   |   ✅   |
| Detail Buku       |   ✅   |    ✅   |   ✅   |   ✅   |
| Pinjam Buku       |   ❌   |    ✅   |   ✅   |   ✅   |
| Riwayat Pinjam    |   ❌   |    ✅   |   ✅   |   ✅   |
| CRUD Buku         |   ❌   |    ❌   |   ✅   |   ✅   |
| CRUD Kategori     |   ❌   |    ❌   |   ✅   |   ✅   |
| CRUD Penulis      |   ❌   |    ❌   |   ✅   |   ✅   |
| CRUD Rak          |   ❌   |    ❌   |   ✅   |   ✅   |
| CRUD Penerbit     |   ❌   |    ❌   |   ✅   |   ✅   |
| Kelola User       |   ❌   |    ❌   |   ❌   |   ✅   |
| Audit Log         |   ❌   |    ❌   |   ❌   |   ✅   |
| Pengaturan Sistem |   ❌   |    ❌   |   ❌   |   ✅   |

---

# Password Policy

Minimal:

* 8 karakter

Harus mengandung:

* Huruf besar
* Huruf kecil
* Angka

Disarankan:

* Karakter khusus

---

# Registration Rules

Email harus:

* Valid
* Unik

Password harus memenuhi Password Policy.

Role default:

```text id="8hgrm8"
Member
```

Status default:

```text id="qkl68n"
Active
```

---

# Email Verification

Versi awal:

* Tidak wajib.

Future:

* Email verification sebelum login.

---

# Forgot Password

Flow

User

↓

Input Email

↓

Kirim Email Reset

↓

Klik Link

↓

Input Password Baru

↓

Update Password

↓

Login

---

# Change Password

User

↓

Input Password Lama

↓

Input Password Baru

↓

Konfirmasi

↓

Validasi

↓

Update

↓

Session tetap aktif (atau logout semua sesi sesuai konfigurasi)

---

# Middleware

Middleware memeriksa:

* Session
* Login
* Role

Jika belum login:

↓

Redirect

```text id="ulnzvj"
/login
```

Jika role tidak sesuai:

↓

403 Forbidden

---

# Authorization Rules

Semua permission harus dicek di server.

Frontend hanya digunakan untuk meningkatkan pengalaman pengguna, bukan sebagai mekanisme keamanan.

---

# Server Actions

Semua Server Action yang memodifikasi data harus:

* Memastikan user sudah login.
* Memastikan role memiliki izin.
* Memvalidasi input.
* Menangani error dengan aman.

---

# API Protection

Semua endpoint privat harus:

* Memeriksa session.
* Memeriksa role.
* Memvalidasi request.

---

# Session Expiration

Jika session habis:

↓

Redirect Login

↓

Tampilkan pesan:

"Sesi Anda telah berakhir. Silakan login kembali."

---

# Login Attempt

Future Enhancement

Batasi percobaan login.

Contoh:

* Maksimal 5 percobaan.
* Blokir sementara selama 15 menit.

---

# Audit Log

Catat aktivitas berikut:

* Login
* Logout
* Register
* Ganti Password
* Tambah Buku
* Edit Buku
* Hapus Buku
* Tambah User
* Hapus User
* Pengembalian Buku

---

# User Status

Status akun:

* Active
* Inactive
* Suspended

Hanya akun dengan status **Active** yang dapat login.

---

# Security Best Practices

* Gunakan HTTPS pada production.
* Simpan session dengan aman.
* Jangan menyimpan password dalam bentuk teks biasa.
* Validasi semua input.
* Jangan mengekspos data sensitif.
* Selalu periksa permission di server.

---

# Error Messages

Contoh:

Login gagal

```text id="3glh8q"
Email atau password salah.
```

Akses ditolak

```text id="o0ekes"
Anda tidak memiliki izin untuk mengakses halaman ini.
```

Session habis

```text id="mwyfwl"
Sesi Anda telah berakhir. Silakan login kembali.
```

---

# Future Authentication Features

* Google OAuth
* GitHub OAuth
* Microsoft OAuth
* Multi-Factor Authentication (MFA)
* Magic Link Login
* Session Management Dashboard
* Device Management
* Login History

---

# Definition of Done

Sistem autentikasi dianggap selesai jika:

* Login berfungsi.
* Logout berfungsi.
* Registrasi berfungsi.
* Session tersimpan dengan aman.
* Middleware melindungi route privat.
* Permission berjalan sesuai role.
* Server Action memvalidasi session dan role.
* Error ditangani dengan baik.
* Aktivitas penting tercatat pada audit log.
