# CODING_STANDARDS.md

# Coding Standards

## Project

TBM Semesta Alam

---

# Purpose

Dokumen ini menetapkan standar penulisan kode agar proyek tetap konsisten, mudah dipelihara, mudah dikembangkan, dan menghasilkan kualitas kode yang tinggi.

Semua developer dan AI coding assistant wajib mengikuti standar yang dijelaskan pada dokumen ini.

---

# General Principles

* Tulis kode yang sederhana dan mudah dipahami.
* Utamakan keterbacaan dibanding kode yang terlalu singkat.
* Hindari duplikasi (DRY).
* Gunakan nama yang jelas dan deskriptif.
* Hindari komentar yang menjelaskan hal yang sudah jelas dari kode.
* Selalu lakukan validasi input.
* Gunakan TypeScript secara maksimal.

---

# Language

* TypeScript
* Jangan menggunakan JavaScript biasa.
* Hindari penggunaan `any`.
* Gunakan tipe yang spesifik.

Contoh

Baik

```ts
type Book = {
  id: string
  title: string
}
```

Kurang baik

```ts
const book: any = {}
```

---

# Naming Convention

## Variable

Gunakan:

camelCase

Contoh

```ts
bookTitle
borrowDate
inventoryStatus
availableInventory
```

---

## Function

Gunakan camelCase.

Nama fungsi harus berupa kata kerja.

Contoh

```ts
createBook()

updateBook()

deleteBook()

createBookInventory()

updateBookInventory()

deleteBookInventory()

createBookSource()

updateBookSource()

deleteBookSource()

borrowBook()

returnBook()
```

---

## Boolean

Awali dengan:

* is
* has
* can
* should

Contoh

```ts
isAvailable

hasPermission

canBorrow
```

---

## Constants

Gunakan:

UPPER_SNAKE_CASE

Contoh

```ts
MAX_BORROW_LIMIT

MAX_UPLOAD_SIZE
```

---

## File

Gunakan:

kebab-case

Contoh

```text
book-card.tsx

book-form.tsx

book-table.tsx
```

---

## Folder

Gunakan:

kebab-case

Contoh

```text
book-management

borrow-history
```

---

# React Components

Komponen harus:

* Memiliki satu tanggung jawab.
* Mudah digunakan ulang.
* Tidak terlalu besar.

Jika komponen mulai sulit dipahami, pecah menjadi komponen yang lebih kecil.

---

# Server Component

Gunakan sebagai default.

Client Component hanya jika membutuhkan:

* Event handler
* useState
* useEffect
* Browser API
* Drag & Drop
* Animasi

---

# Props

Gunakan interface atau type.

Contoh

```ts
type BookCardProps = {
  title: string
}
```

---

# State Management

Prioritas:

1. useState
2. useReducer
3. Context
4. Server Actions
5. TanStack Query (jika diperlukan)

Hindari global state tanpa alasan yang jelas.

---

# Forms

Gunakan:

* React Hook Form
* Zod

Semua form harus memiliki:

* Validasi
* Loading
* Error Message
* Success Feedback

---

# Validation

Semua data yang masuk harus divalidasi.

Jangan hanya mengandalkan validasi frontend.

---

# Database

Gunakan:

Drizzle ORM

Hindari SQL mentah kecuali benar-benar diperlukan.

Semua operasi database harus:

* Type-safe
* Menggunakan relasi
* Menggunakan transaction jika melibatkan beberapa tabel

---

# Server Actions

Gunakan untuk:

* Create
* Update
* Delete
* Upload

Nama fungsi:

```ts
createBook

updateBook

deleteBook
```

Satu file hanya menangani satu domain.

---

# API Route Handlers

Gunakan hanya jika:

* Dibutuhkan oleh aplikasi eksternal.
* Membutuhkan endpoint publik.
* Integrasi webhook.
* Integrasi pihak ketiga.

---

# Error Handling

Jangan mengembalikan error mentah ke pengguna.

Gunakan pesan yang mudah dipahami.

Selalu lakukan logging jika diperlukan.

---

# Logging

Catat aktivitas penting:

* Login
* Logout
* Tambah data
* Edit data
* Hapus data
* Peminjaman
* Pengembalian

---

# Authentication

Gunakan Better Auth.

Jangan menyimpan password dalam bentuk teks biasa.

---

# Authorization

Selalu periksa role di server.

Jangan hanya menyembunyikan tombol pada frontend.

---

# Security

* Validasi semua input.
* Gunakan parameterized query melalui ORM.
* Sanitasi input bila diperlukan.
* Jangan mengekspos informasi sensitif.
* Jangan menyimpan secret di source code.

---

# Environment Variables

Gunakan `.env`.

Jangan pernah melakukan commit:

* API Key
* Secret
* Password
* Token

---

# Styling

Gunakan:

* Tailwind CSS
* shadcn/ui

Hindari inline style kecuali benar-benar diperlukan.

---

# Icons

Gunakan:

Lucide React

Gunakan ikon yang konsisten.

---

# Images

Gunakan `next/image`.

Semua cover buku harus melalui optimasi gambar.

---

# Accessibility

Pastikan:

* Label pada input.
* Keyboard navigation.
* Focus indicator.
* ARIA bila diperlukan.

---

# Performance

Utamakan:

* Server Components
* Lazy Loading
* Pagination
* Optimized Images
* Caching bila sesuai

Hindari:

* Fetch data yang sama berulang kali.
* Render komponen yang tidak diperlukan.

---

# Code Organization

* Pisahkan business logic dari UI.
* Hindari fungsi yang terlalu panjang.
* Hindari file yang terlalu besar.
* Pecah kode menjadi modul yang lebih kecil jika mulai kompleks.

---

# Comments

Gunakan komentar hanya jika:

* Menjelaskan alasan bisnis.
* Menjelaskan keputusan teknis yang tidak langsung terlihat.

Hindari komentar yang hanya mengulang isi kode.

---

# Imports

Urutan import:

1. Library eksternal.
2. Internal modules.
3. Components.
4. Types.
5. Styles.

---

# Git Commit

Gunakan Conventional Commits.

Contoh

```text
feat: add book borrowing feature

fix: resolve login validation bug

refactor: simplify dashboard layout

docs: update database documentation

style: improve button spacing

test: add validation tests
```

---

# Pull Request Checklist

Sebelum merge:

* Kode berhasil di-build.
* Tidak ada error TypeScript.
* Tidak ada lint error.
* Validasi berjalan.
* Dokumentasi diperbarui bila diperlukan.

---

# Testing

Minimal mencakup:

* Form validation
* Business logic
* Permission
* Database operation
* Server Action

---

# AI Coding Assistant Rules

AI harus:

* Mengikuti seluruh dokumentasi pada folder `docs/`.
* Tidak membuat struktur baru tanpa alasan yang jelas.
* Menggunakan komponen yang sudah ada jika memungkinkan.
* Menghindari duplikasi kode.
* Memprioritaskan reusable components.
* Mempertahankan konsistensi penamaan dan pola implementasi.

Jika dokumentasi dan implementasi bertentangan, dokumentasi harus diperbarui atau implementasi disesuaikan setelah ada keputusan yang jelas.

---

# Definition of Done

Sebuah fitur dianggap selesai jika:

* Berfungsi sesuai PRD.
* Mengikuti FLOW.
* Menggunakan validasi yang sesuai.
* Memiliki penanganan error.
* Mengikuti standar penamaan.
* Tidak menghasilkan error TypeScript.
* Tidak menghasilkan lint error.
* Responsif.
* Mendukung Dark Mode (jika relevan).
* Dokumentasi terkait telah diperbarui.

---

# Continuous Improvement

Standar ini dapat diperbarui selama pengembangan proyek.

Setiap perubahan harus menjaga konsistensi, keterbacaan, keamanan, dan kemudahan pemeliharaan kode.
