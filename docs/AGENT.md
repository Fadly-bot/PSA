# AGENT.md

# AI Development Guide

## Project

TBM Semesta Alam

---

# Purpose

Dokumen ini merupakan panduan utama bagi AI Coding Assistant dan developer yang berkontribusi pada proyek.

Sebelum menghasilkan, mengubah, atau menghapus kode, AI harus membaca dokumen ini terlebih dahulu.

Dokumen ini menjadi entry point untuk memahami struktur proyek, aturan pengembangan, dan dokumentasi yang harus diikuti.

---

# Primary Objective

Tujuan utama AI adalah:

* Menghasilkan kode yang bersih, konsisten, dan mudah dipelihara.
* Mengikuti seluruh dokumentasi proyek.
* Menghindari duplikasi kode.
* Mengutamakan keamanan, performa, dan aksesibilitas.
* Menjaga konsistensi arsitektur.

---

# Source of Truth

Jika terjadi perbedaan informasi, gunakan urutan prioritas berikut:

1. AGENT.md
2. PRD.md
3. DATABASE.md
4. SCHEMA.md
5. AUTH.md
6. VALIDATION.md
7. API.md
8. ARCHITECTURE.md
9. CODING_STANDARDS.md
10. Dokumen lainnya

---

# Required Reading Order

Sebelum mengerjakan fitur baru, baca dokumen berikut secara berurutan:

```text
docs/
│
├── AGENT.md
├── PRD.md
├── DATABASE.md
├── SCHEMA.md
├── FLOW.md
├── ROUTES.md
├── UI_UX.md
├── AUTH.md
├── STORAGE.md
├── VALIDATION.md
├── API.md
├── ARCHITECTURE.md
├── CODING_STANDARDS.md
├── TESTING.md
├── DEPLOYMENT.md
├── CONTRIBUTING.md
└── CHANGELOG.md
```

---

# Technology Stack

Frontend

* Next.js App Router
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion

Backend

* Next.js Server Actions
* Route Handlers

Database

* PostgreSQL (Supabase)

ORM

* Drizzle ORM

Authentication

* Better Auth

Storage

* Supabase Storage

Validation

* Zod

Forms

* React Hook Form

Deployment

* Vercel

---

# AI Responsibilities

AI harus:

* Mengikuti seluruh dokumentasi.
* Menghasilkan kode yang mudah dibaca.
* Menggunakan TypeScript.
* Menggunakan Server Components sebagai default.
* Menggunakan Client Components hanya bila diperlukan.
* Menghindari penggunaan `any`.
* Menghindari duplikasi kode.
* Memanfaatkan komponen yang sudah ada.
* Menjaga konsistensi penamaan.
* Menambahkan validasi pada setiap input.
* Memastikan role dan permission diperiksa di server.

---

# Before Writing Code

AI harus memastikan:

* Fitur ada di PRD.
* Database mendukung fitur tersebut.
* Schema telah tersedia.
* Route sudah ditentukan.
* UI sudah didefinisikan.
* Validasi telah ditentukan.
* Permission telah ditentukan.

Jika salah satu belum tersedia, hentikan implementasi dan minta dokumentasi dilengkapi.

---

# Development Workflow

Ikuti urutan berikut:

1. Analisis kebutuhan dari PRD.
2. Periksa database.
3. Periksa schema.
4. Periksa flow.
5. Periksa route.
6. Periksa UI.
7. Periksa authentication dan authorization.
8. Periksa validation.
9. Implementasikan kode.
10. Uji fitur.
11. Perbarui dokumentasi jika diperlukan.

---

# Code Generation Rules

Selalu:

* Gunakan reusable components.
* Pisahkan UI dan business logic.
* Gunakan Server Actions untuk operasi CRUD.
* Gunakan Route Handlers hanya jika benar-benar diperlukan.
* Gunakan Drizzle ORM untuk akses database.
* Gunakan Better Auth untuk autentikasi.
* Gunakan Zod untuk validasi.

Jangan:

* Membuat query SQL mentah tanpa alasan kuat.
* Membuat struktur folder baru tanpa kebutuhan yang jelas.
* Mengubah dokumentasi tanpa alasan.
* Menghapus fitur tanpa persetujuan.

---

# Database Rules

* Semua perubahan database harus memiliki migration.
* Perbarui `DATABASE.md` dan `SCHEMA.md` jika ada perubahan struktur.
* Gunakan relasi dan foreign key sesuai desain.

---

# UI Rules

* Gunakan komponen shadcn/ui jika tersedia.
* Gunakan Tailwind CSS.
* Pastikan tampilan responsif.
* Gunakan `next/image` untuk gambar.
* Hindari inline style.

---

# Security Rules

Selalu:

* Validasi input di server.
* Periksa session.
* Periksa role.
* Sanitasi input bila diperlukan.
* Lindungi environment variable.

Jangan:

* Menampilkan data sensitif.
* Menyimpan password dalam bentuk teks biasa.
* Mengirim secret ke frontend.

---

# Documentation Rules

Jika implementasi mengubah perilaku aplikasi, perbarui dokumentasi yang relevan.

Contoh:

* Fitur baru → `PRD.md`
* Perubahan tabel → `DATABASE.md`
* Perubahan schema → `SCHEMA.md`
* Perubahan alur → `FLOW.md`
* Perubahan route → `ROUTES.md`
* Perubahan UI → `UI_UX.md`
* Perubahan autentikasi → `AUTH.md`
* Perubahan validasi → `VALIDATION.md`
* Perubahan API → `API.md`

---

# Testing Rules

Sebelum fitur dianggap selesai:

* Build berhasil.
* Tidak ada error TypeScript.
* Tidak ada lint error.
* Validasi berjalan.
* Permission berjalan.
* Tidak merusak fitur lain.

---

# Performance Rules

Utamakan:

* Server Components.
* Lazy Loading.
* Pagination.
* Optimized Images.
* Caching jika diperlukan.

Hindari:

* Fetch data berulang.
* Render yang tidak perlu.
* Query database yang tidak efisien.

---

# Accessibility Rules

Pastikan:

* Navigasi keyboard berfungsi.
* Label input tersedia.
* Fokus terlihat jelas.
* Alt text tersedia untuk gambar.

---

# Error Handling

Semua error harus:

* Ditangani dengan aman.
* Tidak membocorkan informasi sensitif.
* Menampilkan pesan yang mudah dipahami pengguna.

---

# Refactoring Rules

Refactoring diperbolehkan jika:

* Mengurangi kompleksitas.
* Meningkatkan keterbacaan.
* Tidak mengubah perilaku fitur.
* Tidak merusak kompatibilitas.

---

# Definition of Done

Sebuah tugas dianggap selesai jika:

* Sesuai PRD.
* Mengikuti seluruh dokumentasi.
* Kode bersih dan konsisten.
* Tidak ada error TypeScript.
* Tidak ada lint error.
* Validasi berjalan.
* Permission berjalan.
* Dokumentasi telah diperbarui bila diperlukan.
* Siap untuk proses review.

---

# AI Final Checklist

Sebelum menyelesaikan tugas, AI harus memastikan:

* ☐ Dokumentasi telah dibaca.
* ☐ Fitur sesuai PRD.
* ☐ Database sesuai desain.
* ☐ Schema sesuai implementasi.
* ☐ Route sesuai dokumentasi.
* ☐ UI sesuai spesifikasi.
* ☐ Validasi diterapkan.
* ☐ Authentication dan Authorization diterapkan.
* ☐ Tidak ada duplikasi kode.
* ☐ Build berhasil.
* ☐ TypeScript tanpa error.
* ☐ Lint tanpa error.
* ☐ Dokumentasi diperbarui jika diperlukan.

---

# Final Principle

Jika terdapat keraguan antara menghasilkan kode dengan cepat atau menghasilkan kode yang konsisten dengan dokumentasi, prioritaskan konsistensi terhadap dokumentasi proyek.
