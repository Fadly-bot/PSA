# API Documentation

## Purpose

Folder ini berisi dokumentasi seluruh **Server Actions** dan **Route Handlers** yang digunakan oleh aplikasi **TBM Semesta Alam**.

Dokumen pada folder ini menjadi acuan implementasi komunikasi antara frontend, backend, database, dan layanan eksternal.

---

# API Philosophy

Aplikasi menggunakan pendekatan **Server-First Architecture**.

Prioritas implementasi:

1. Server Actions
2. Route Handlers (hanya jika diperlukan)

Sebagian besar operasi CRUD menggunakan **Next.js Server Actions**.

Route Handlers (`app/api/...`) hanya digunakan jika diperlukan untuk:

* Webhook
* OAuth Callback
* Integrasi pihak ketiga
* Endpoint publik
* File download
* API eksternal

---

# Technology Stack

Framework

* Next.js App Router

Backend

* Server Actions
* Route Handlers

Database

* PostgreSQL (Supabase)

ORM

* Drizzle ORM

Authentication

* Better Auth

Validation

* Zod

---

# Documentation Structure

```text
docs/
└── api/
    ├── README.md
    ├── Authentication API.md
    ├── Books API.md
    ├── Categories API.md
    ├── Authors API.md
    ├── Publishers API.md
    ├── Shelves API.md
    ├── Members API.md
    ├── Book Inventories API.md
    ├── Book Sources API.md
    ├── Borrowings API.md
    ├── Returns API.md
    ├── Fines API.md
    ├── Dashboard API.md
    ├── Reports API.md
    ├── Users API.md
    ├── Settings API.md
    └── Audit Logs API.md
```

---

# Module Overview

| Module                        | Description                                              |
| ----------------------------- | -------------------------------------------------------- |
| Authentication API.md         | Login, logout, register, session, password               |
| Books API.md                  | CRUD buku dan cover buku                                 |
| Book Inventories API.md       | CRUD inventaris fisik buku                               |
| Book Sources API.md           | CRUD sumber pengadaan inventaris                         |
| Categories API.md             | CRUD kategori                                            |
| Authors API.md                | CRUD penulis                                             |
| Publishers API.md             | CRUD penerbit                                            |
| Shelves API.md                | CRUD rak                                                 |
| Members API.md                | CRUD anggota                                             |
| Borrowings API.md             | Proses peminjaman berdasarkan BookInventory              |
| Returns API.md                | Proses pengembalian dan denda                             |
| Fines API.md                  | Manajemen denda                                          |
| Dashboard API.md              | Statistik dan dashboard                                   |
| Reports API.md                | Laporan dan ekspor data                                   |
| Users API.md                  | Manajemen user dan role                                   |
| Settings API.md               | Pengaturan aplikasi                                      |
| Audit Logs API.md             | Audit trail sistem                                       |

---

# Standard Documentation Format

Setiap file dokumentasi API harus memuat:

* Tujuan modul
* Daftar Server Actions
* Daftar Route Handlers (jika ada)
* Parameter
* Validasi
* Authentication
* Authorization
* Business Rules
* Response
* Error Handling
* Logging
* Contoh penggunaan

---

# Server Action Naming

Gunakan pola berikut:

```text
createBook
updateBook
deleteBook
borrowBook
returnBook
createMember
updateMember
deleteMember
```

Nama fungsi harus:

* Menggunakan camelCase.
* Diawali dengan kata kerja.
* Menjelaskan satu aksi.

---

# Route Handler Naming

Gunakan hanya jika diperlukan.

Contoh:

```text
POST   /api/webhooks
GET    /api/reports/export
POST   /api/uploads
GET    /api/health
```

---

# Validation

Semua request harus divalidasi menggunakan Zod.

Validasi dilakukan:

* Sebelum Server Action diproses.
* Sebelum Route Handler diproses.

Jangan mempercayai data dari client.

---

# Authentication

Gunakan Better Auth.

Semua operasi privat harus:

* Memastikan pengguna telah login.
* Memastikan session valid.

---

# Authorization

Permission diperiksa di server.

Frontend tidak boleh menjadi satu-satunya mekanisme pembatasan akses.

---

# Error Handling

Semua modul harus:

* Mengembalikan error yang konsisten.
* Tidak membocorkan informasi sensitif.
* Menggunakan pesan yang mudah dipahami.

---

# Logging

Catat aktivitas penting seperti:

* Login
* Logout
* Tambah data
* Edit data
* Hapus data
* Peminjaman
* Pengembalian

---

# Response Standard

Semua Server Actions dan Route Handlers harus menggunakan format respons yang konsisten.

Contoh sukses:

```ts
{
  success: true,
  message: "Operation completed successfully.",
  data: { ... }
}
```

Contoh gagal:

```ts
{
  success: false,
  message: "Validation failed.",
  errors: { ... }
}
```

---

# Best Practices

* Gunakan Server Actions sebagai pilihan utama.
* Gunakan Route Handlers hanya jika diperlukan.
* Hindari duplikasi business logic.
* Validasi seluruh input.
* Periksa session dan role di server.
* Gunakan transaksi database untuk operasi multi-tabel.
* Ikuti seluruh aturan pada `docs/CODING_STANDARDS.md`.

---

# Related Documentation

Dokumen ini berkaitan dengan:

* `docs/PRD.md`
* `docs/DATABASE.md`
* `docs/SCHEMA.md`
* `docs/FLOW.md`
* `docs/ROUTES.md`
* `docs/AUTH.md`
* `docs/VALIDATION.md`
* `docs/ARCHITECTURE.md`
* `docs/CODING_STANDARDS.md`

---

# Definition of Done

Dokumentasi modul API dianggap selesai jika:

* Seluruh Server Actions telah didokumentasikan.
* Route Handlers yang digunakan telah dijelaskan.
* Parameter dan validasi lengkap.
* Authentication dan Authorization dijelaskan.
* Business Rules terdokumentasi.
* Error Handling konsisten.
* Contoh penggunaan tersedia bila diperlukan.
