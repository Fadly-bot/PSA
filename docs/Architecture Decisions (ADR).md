# Architecture Decisions (ADR)

## Purpose

Dokumen ini berisi seluruh keputusan arsitektur yang telah disepakati untuk proyek Sistem Informasi TBM Semesta Alam.

Tujuan:

- Menjelaskan alasan di balik setiap keputusan teknis.
- Menjadi referensi utama bagi seluruh developer.
- Mencegah perubahan arsitektur tanpa pertimbangan.
- Membantu AI Coding Assistant memahami keputusan proyek.

> Semua perubahan yang memengaruhi arsitektur wajib didokumentasikan pada file ini sebelum diimplementasikan.

---

# ADR-001 — Inventory-Based Borrowing

## Status

Accepted

## Date

2026-08-07

## Context

Sebelumnya sistem menggunakan model:

```
Book
 ↓
Stock
 ↓
Borrow
```

Model tersebut tidak dapat membedakan setiap eksemplar fisik buku.

## Decision

Menggunakan model:

```
Book
 ↓
BookInventory
 ↓
Borrow
```

## Consequences

### Positif

- Setiap buku fisik memiliki identitas unik.
- Peminjaman lebih akurat.
- Kondisi setiap buku dapat dilacak.
- Lokasi rak setiap eksemplar dapat berbeda.
- Riwayat peminjaman lebih lengkap.

### Negatif

- Struktur database lebih kompleks.
- CRUD inventaris bertambah.

---

# ADR-002 — Book Hanya Menyimpan Metadata

## Status

Accepted

## Context

Sebelumnya tabel Book menyimpan:

- Stock
- Available Stock
- Shelf

Hal ini menyebabkan duplikasi data.

## Decision

Book hanya menyimpan informasi bibliografi:

- ISBN
- Judul
- Penulis
- Penerbit
- Tahun Terbit
- Deskripsi
- Cover

Seluruh data fisik dipindahkan ke BookInventory.

## Consequences

Jumlah stok dihitung dari BookInventory.

---

# ADR-003 — Dynamic Book Sources

## Status

Accepted

## Context

Sumber pengadaan buku dapat berubah sesuai kebutuhan sekolah.

## Decision

Membuat entity:

BookSource

Data dapat dikelola oleh Admin dan Staff.

Contoh:

- Pembelian
- Hibah
- BOS
- CSR
- Donasi Alumni

## Consequences

Tidak ada lagi enum statis untuk sumber buku.

---

# ADR-004 — Server Actions First

## Status

Accepted

## Context

Next.js App Router mendukung Server Actions.

## Decision

CRUD menggunakan:

Server Actions

Route Handlers hanya digunakan untuk:

- Upload
- Export
- OAuth
- Webhook
- Public API

## Consequences

Lebih sedikit boilerplate API.

---

# ADR-005 — Drizzle ORM

## Status

Accepted

## Context

Membutuhkan ORM yang ringan, type-safe, dan mudah digunakan dengan PostgreSQL.

## Decision

Menggunakan Drizzle ORM.

## Consequences

- Type-safe
- SQL-first
- Migration sederhana

---

# ADR-006 — PostgreSQL

## Status

Accepted

## Decision

Database utama menggunakan PostgreSQL.

## Consequences

- Relasi kuat.
- ACID Transaction.
- Mendukung indexing.

---

# ADR-007 — Better Auth

## Status

Accepted

## Decision

Menggunakan Better Auth sebagai sistem autentikasi.

## Consequences

- Session server-side.
- Integrasi baik dengan Next.js.

---

# ADR-008 — Supabase Storage

## Status

Accepted

## Context

Aplikasi memerlukan penyimpanan cover buku.

## Decision

Menggunakan Supabase Storage.

Bucket:

```
book-covers
```

## Consequences

Cover terpisah dari database.

---

# ADR-009 — Soft Delete

## Status

Accepted

## Decision

Seluruh data utama menggunakan Soft Delete.

Field:

```
deleted_at
```

## Consequences

Data dapat dipulihkan.

---

# ADR-010 — UUID sebagai Primary Key

## Status

Accepted

## Decision

Semua tabel menggunakan UUID sebagai Primary Key.

## Consequences

Lebih aman untuk sinkronisasi data dan integrasi di masa depan.

---

# ADR-011 — Server-side Authorization

## Status

Accepted

## Decision

Seluruh pengecekan permission dilakukan di server.

Frontend hanya mengatur tampilan.

## Consequences

Keamanan lebih baik.

---

# ADR-012 — Validation menggunakan Zod

## Status

Accepted

## Decision

Semua input divalidasi menggunakan Zod sebelum business logic dijalankan.

## Consequences

Validasi konsisten di seluruh aplikasi.

---

# ADR-013 — Audit Logging

## Status

Accepted

## Decision

Semua aktivitas penting dicatat.

Minimal:

- Login
- Logout
- Tambah Buku
- Edit Buku
- Tambah Inventaris
- Peminjaman
- Pengembalian
- Hapus Data

## Consequences

Mempermudah audit dan debugging.

---

# ADR-014 — Export System

## Status

Accepted

## Decision

Seluruh laporan mendukung:

- Excel
- PDF

## Consequences

Tidak perlu implementasi format lain pada versi awal.

---

# ADR-015 — Cover Buku

## Status

Accepted

## Decision

Cover buku bersifat opsional.

Jika tidak ada cover:

- Gunakan placeholder.

## Consequences

Pengguna tetap dapat menambahkan buku tanpa gambar.

---

# ADR-016 — Search Strategy

## Status

Accepted

## Decision

Guest dan Member mencari berdasarkan:

- Judul
- Penulis
- ISBN
- Kategori

Staff dan Admin mendapat tambahan:

- Kode Inventaris

## Consequences

Pencarian sesuai kebutuhan masing-masing role.

---

# ADR-017 — Role-Based Access

## Status

Accepted

## Decision

Role yang digunakan:

- Guest
- Member
- Staff
- Admin

Permission mengikuti `PERMISSIONS.md`.

## Consequences

Seluruh authorization terpusat.

---

# ADR-018 — Single Source of Truth

## Status

Accepted

## Decision

Dokumen berikut menjadi acuan utama:

| Dokumen | Fungsi |
|----------|--------|
| PRD.md | Kebutuhan bisnis |
| DATABASE.md | Struktur database |
| SCHEMA.md | Schema Drizzle |
| ROUTES.md | Routing |
| API.md | Server Actions & API |
| VALIDATION.md | Validasi |
| PERMISSIONS.md | Hak akses |
| ERRORS.md | Kode error |
| NAMING.md | Standar penamaan |
| CONVENTIONS.md | Konvensi implementasi |

Jika terjadi konflik, prioritasnya:

1. DECISIONS.md
2. PRD.md
3. DATABASE.md
4. SCHEMA.md
5. Dokumen lainnya

---

# Rules for AI Coding Assistant

AI wajib:

- Mengikuti seluruh keputusan pada dokumen ini.
- Tidak mengubah arsitektur tanpa pembaruan ADR.
- Tidak membuat entity baru tanpa pembaruan DATABASE.md.
- Tidak mengubah relasi database tanpa ADR baru.
- Tidak mengubah pola autentikasi, otorisasi, atau penyimpanan file tanpa persetujuan.
- Mengusulkan ADR baru jika diperlukan perubahan besar.

---

# Change Process

Setiap perubahan arsitektur harus melalui langkah berikut:

1. Identifikasi kebutuhan perubahan.
2. Tulis ADR baru atau ubah ADR yang relevan.
3. Perbarui dokumentasi terkait (PRD, DATABASE, SCHEMA, dll.).
4. Implementasikan perubahan pada kode.
5. Catat perubahan di CHANGELOG.md.

---

# Related Documentation

- docs/PRD.md
- docs/DATABASE.md
- docs/SCHEMA.md
- docs/ARCHITECTURE.md
- docs/NAMING.md
- docs/CONVENTIONS.md
- docs/PERMISSIONS.md
- docs/ERRORS.md
- docs/CHANGELOG.md

---

# Definition of Done

Dokumen dianggap selesai apabila:

- Semua keputusan arsitektur utama terdokumentasi.
- Setiap keputusan memiliki konteks, keputusan, dan konsekuensi.
- Tidak ada implementasi yang bertentangan dengan ADR.
- AI Coding Assistant menggunakan dokumen ini sebagai acuan utama sebelum menghasilkan kode.