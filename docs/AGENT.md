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

# Documentation Dependency Order

Dokumentasi memiliki urutan dependency berikut.

Urutan ini adalah **urutan dependency dan pengerjaan**, bukan urutan nama file pada VS Code Explorer.

AI Coding Agent wajib memahami dokumen berdasarkan dependency berikut sebelum melakukan perubahan atau implementasi.

## Phase 1 — Business Requirements

1. `PRD.md`

PRD merupakan sumber utama untuk kebutuhan bisnis dan functional requirements.

---

## Phase 2 — Data Architecture

2. `DATABASE.md`
3. `SCHEMA.md`

`DATABASE.md` mendefinisikan ERD, tabel, relasi, constraint, dan struktur database secara konseptual.

`SCHEMA.md` menerjemahkan struktur tersebut ke dalam Drizzle Schema.

`SCHEMA.md` tidak boleh bertentangan dengan `DATABASE.md`.

---

## Phase 3 — Application Flow

4. `FLOW.md`
5. `ROUTES.md`
6. `UI_UX.md`

`FLOW.md` mendefinisikan alur bisnis dan proses aplikasi.

`ROUTES.md` mendefinisikan halaman, routing, dan navigasi.

`UI_UX.md` mendefinisikan struktur halaman, layout, komponen, dan interaksi pengguna.

Ketiga dokumen harus konsisten dengan PRD, DATABASE, dan SCHEMA.

---

## Phase 4 — API & Validation

7. `docs/api/*.md`
8. `VALIDATION.md`
9. `PERMISSIONS.md`
10. `ERROR_CODES.md`

Dokumen API harus mengikuti:

- `PRD.md`
- `DATABASE.md`
- `SCHEMA.md`
- `FLOW.md`
- `ROUTES.md`
- `UI_UX.md`

`VALIDATION.md` mendefinisikan aturan validasi input.

`PERMISSIONS.md` mendefinisikan authorization dan role access.

`ERROR_CODES.md` mendefinisikan error code dan error handling yang digunakan aplikasi.

Tidak boleh membuat API yang bertentangan dengan dokumen sebelumnya.

---

## Phase 5 — Application Architecture

11. `ARCHITECTURE.md`
12. `AUTH.md`
13. `STORAGE.md`
14. `PROJECT_CONVENTIONS.md`
15. `NAMING_CONVENTION.md`
16. `CODING_STANDARDS.md`

Dokumen pada phase ini mendefinisikan bagaimana sistem diimplementasikan.

Arsitektur utama aplikasi tidak boleh diubah hanya untuk memenuhi kebutuhan satu fitur tanpa keputusan arsitektur yang terdokumentasi.

---

## Phase 6 — Quality & Operations

17. `TESTING.md`
18. `DEPLOYMENT.md`
19. `CHANGELOG.md`

`TESTING.md` harus mencerminkan behavior yang didefinisikan oleh seluruh dokumentasi sebelumnya.

`DEPLOYMENT.md` mendefinisikan deployment dan operational requirements.

`CHANGELOG.md` mencatat perubahan dokumentasi, requirement, dan implementasi.

---

Referensi struktur file dokumentasi:

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
├── ARCHITECTURE.md
├── AUTH.md
├── STORAGE.md
├── VALIDATION.md
├── PERMISSIONS.md
├── ERROR_CODES.md
├── CODING_STANDARDS.md
├── NAMING_CONVENTION.md
├── PROJECT_CONVENTIONS.md
├── TESTING.md
├── DEPLOYMENT.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── api/
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

# Implementation Rule

Sebelum menulis kode:

1. Baca `AGENT.md`.
2. Identifikasi requirement yang akan diimplementasikan.
3. Tentukan dokumen dependency yang relevan.
4. Pastikan tidak terdapat konflik antar-dokumen.
5. Jika dokumentasi sudah konsisten, lanjutkan implementasi.
6. Jika dokumentasi belum konsisten, perbarui dokumentasi terlebih dahulu.
7. Setelah implementasi, jalankan testing yang relekan.
8. Perbarui `CHANGELOG.md` jika perubahan merupakan perubahan fitur, requirement, schema, API, atau behavior yang signifikan.

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

# Documentation Consistency Rules

AI Coding Agent wajib mengikuti aturan berikut:

1. Jangan menganggap urutan file pada VS Code Explorer sebagai urutan dependency.
2. Gunakan `Documentation Dependency Order` sebagai urutan membaca dan memahami dokumentasi.
3. Jangan mengimplementasikan fitur yang bertentangan dengan `PRD.md`.
4. Jangan mengubah database tanpa memastikan `DATABASE.md` dan `SCHEMA.md` tetap konsisten.
5. Jangan mengubah business flow tanpa memeriksa `FLOW.md`.
6. Jangan menambahkan route tanpa memperbarui `ROUTES.md` jika route tersebut merupakan bagian dari arsitektur aplikasi.
7. Jangan menambahkan Server Action/API tanpa memastikan dokumentasi API terkait diperbarui.
8. Jangan membuat validation rule yang bertentangan dengan `VALIDATION.md`.
9. Jangan membuat permission rule yang bertentangan dengan `PERMISSIONS.md`.
10. Gunakan error code yang telah didefinisikan di `ERROR_CODES.md`.
11. Ikuti `ARCHITECTURE.md` sebelum membuat struktur kode baru.
12. Ikuti `AUTH.md` untuk seluruh fitur yang berkaitan dengan authentication dan authorization.
13. Ikuti `STORAGE.md` untuk seluruh file upload dan storage.
14. Ikuti `PROJECT_CONVENTIONS.md`, `NAMING_CONVENTION.md`, dan `CODING_STANDARDS.md` saat menulis kode.
15. Jika requirement baru menyebabkan beberapa dokumen tidak konsisten, perbarui dokumentasi yang terdampak terlebih dahulu sebelum melakukan implementasi.
16. Jangan membuat implementasi kode jika dokumentasi yang menjadi dependency masih ambigu atau saling bertentangan.
17. Setelah perubahan selesai, lakukan consistency check terhadap seluruh dokumen yang terdampak.
18. Jangan membuat file dokumentasi baru jika dokumen yang relevan sudah tersedia.
19. Jangan menghapus dokumentasi yang masih relevan.
20. Jangan mengubah arsitektur utama aplikasi tanpa alasan yang jelas dan dokumentasi keputusan arsitektur.

---

# Change Propagation Rule

Jika sebuah requirement berubah, AI Coding Agent harus menelusuri dependency berikut:

`PRD`
→ `DATABASE`
→ `SCHEMA`
→ `FLOW`
→ `ROUTES`
→ `UI_UX`
→ `API`
→ `VALIDATION`
→ `PERMISSIONS`
→ `ERROR_CODES`
→ `ARCHITECTURE`
→ `TESTING`
→ `DEPLOYMENT`
→ `CHANGELOG`

Tidak semua dokumen wajib berubah untuk setiap requirement.

Hanya dokumen yang terdampak yang perlu diperbarui, tetapi consistency check harus dilakukan terhadap seluruh dependency yang relekan.

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
