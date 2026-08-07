# DEPLOYMENT.md

# Deployment Specification

## Project

TBM Semesta Alam

---

# Purpose

Dokumen ini menjelaskan proses deployment aplikasi dari lingkungan development hingga production.

Deployment harus dilakukan dengan cara yang aman, konsisten, dan dapat direproduksi.

---

# Deployment Architecture

```text
Developer
      │
      ▼
Git Repository
      │
      ▼
GitHub
      │
      ▼
Vercel
      │
      ▼
Production
      │
      ▼
Supabase PostgreSQL
      │
      ▼
Supabase Storage
```

---

# Technology

Frontend

* Next.js 16

Backend

* Next.js Server Actions
* Route Handlers

Database

* Supabase PostgreSQL

ORM

* Drizzle ORM

Authentication

* Better Auth

Storage

* Supabase Storage

Hosting

* Vercel

Repository

* GitHub

---

# Environment

## Development

Digunakan untuk:

* Pengembangan
* Testing
* Debugging

Database

Development Database

---

## Staging (Optional)

Digunakan untuk:

* QA
* UAT
* Verifikasi sebelum production

Database

Staging Database

---

## Production

Digunakan oleh pengguna akhir.

Database

Production Database

---

# Environment Variables

Semua konfigurasi sensitif harus disimpan pada Environment Variables.

Contoh:

```text
DATABASE_URL
DIRECT_URL

BETTER_AUTH_SECRET
BETTER_AUTH_URL

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

NODE_ENV
```

Jangan pernah melakukan commit file:

```text
.env
.env.local
.env.production
```

---

# Git Branch Strategy

Gunakan:

```text
main
```

Production branch.

```text
develop
```

Development branch.

Feature branch

```text
feature/book-management
```

```text
feature/authentication
```

Bug Fix

```text
fix/login-validation
```

---

# Deployment Flow

Developer

↓

Commit

↓

Push GitHub

↓

Vercel Build

↓

Install Dependencies

↓

Type Check

↓

Lint

↓

Build Next.js

↓

Deploy

↓

Production

---

# Database Migration

Migration dilakukan menggunakan Drizzle.

Flow:

```text
Update Schema

↓

Generate Migration

↓

Review SQL

↓

Apply Migration

↓

Deploy Application
```

Migration harus:

* Ditinjau sebelum dijalankan.
* Tidak menghapus data tanpa persetujuan.
* Dapat diulang dengan aman.

---

# Storage Deployment

Pastikan bucket berikut telah dibuat:

```text
book-covers
```

Future:

```text
avatars
```

```text
reports
```

---

# Better Auth Configuration

Pastikan:

* Secret tersedia.
* URL production benar.
* Session aktif.
* Cookie menggunakan HTTPS pada production.

---

# Build Checklist

Sebelum deployment:

* TypeScript tanpa error.
* ESLint tanpa error.
* Build berhasil.
* Migration selesai.
* Environment Variables lengkap.
* Dokumentasi diperbarui.

---

# Production Checklist

Pastikan:

* HTTPS aktif.
* Database production aktif.
* Storage aktif.
* Better Auth aktif.
* Role berjalan.
* Upload cover berhasil.
* Login berhasil.
* Logout berhasil.

---

# Smoke Test

Setelah deployment:

Login

↓

Dashboard

↓

Tambah Buku

↓

Edit Buku

↓

Upload Cover

↓

Pinjam Buku

↓

Kembalikan Buku

↓

Logout

Semua langkah harus berhasil.

---

# Rollback Strategy

Jika deployment gagal:

* Rollback ke deployment sebelumnya melalui Vercel.
* Jangan menjalankan migration yang bersifat destruktif tanpa rencana rollback.
* Periksa log deployment sebelum melakukan deploy ulang.

---

# Monitoring

Pantau:

* Build Failure
* Runtime Error
* Authentication Error
* Database Error
* Storage Error

Gunakan:

* Vercel Logs
* Supabase Logs

---

# Performance

Target:

* Build berhasil tanpa warning kritis.
* Halaman cepat dimuat.
* Gambar menggunakan optimasi.
* Pagination digunakan pada data besar.

---

# Security Checklist

Pastikan:

* HTTPS aktif.
* Secret tidak bocor.
* Service Role Key tidak digunakan di frontend.
* Environment Variables tidak tampil di repository.
* Session menggunakan cookie yang aman.

---

# Backup Strategy

Database

* Backup berkala sesuai kebijakan Supabase.

Storage

* Backup file penting jika diperlukan.

Migration

* Simpan seluruh file migration di repository.

---

# Recovery Plan

Jika database bermasalah:

1. Hentikan deployment baru.
2. Identifikasi penyebab.
3. Pulihkan dari backup bila diperlukan.
4. Jalankan verifikasi data.
5. Lakukan smoke test.

---

# Versioning

Gunakan Semantic Versioning.

Contoh:

```text
v1.0.0
v1.1.0
v1.2.3
v2.0.0
```

---

# Release Process

1. Semua fitur selesai.
2. Semua test utama lulus.
3. Dokumentasi diperbarui.
4. Migration ditinjau.
5. Merge ke `main`.
6. Deploy ke production.
7. Lakukan smoke test.
8. Tandai release dengan Git tag.

---

# Post Deployment

Setelah deployment:

* Periksa log aplikasi.
* Verifikasi login.
* Verifikasi upload cover.
* Verifikasi CRUD buku.
* Verifikasi peminjaman.
* Verifikasi pengembalian.
* Verifikasi dashboard.

---

# Incident Response

Jika ditemukan masalah:

Critical

* Rollback segera.

High

* Perbaikan secepat mungkin.

Medium

* Jadwalkan patch.

Low

* Masukkan ke backlog.

---

# Definition of Done

Deployment dianggap berhasil jika:

* Build sukses.
* Deployment sukses.
* Migration berhasil.
* Environment Variables lengkap.
* Login berfungsi.
* CRUD berjalan.
* Upload cover berhasil.
* Dashboard dapat diakses.
* Tidak ada error kritis pada log.
* Smoke test selesai tanpa kegagalan.
