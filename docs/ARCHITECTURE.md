# ARCHITECTURE.md

# System Architecture

## Project

TBM Semesta Alam

---

# Purpose

Dokumen ini menjelaskan prinsip arsitektur yang digunakan dalam proyek. Struktur implementasi (folder, modul, dan file) dapat berkembang selama pengembangan, tetapi harus tetap mengikuti prinsip-prinsip yang dijelaskan di bawah.

---

# Architecture Style

* Full Stack Web Application
* Monorepo (Single Next.js Project)
* Feature-Oriented Development
* Modular Architecture
* Server-First Approach
* Component-Based UI

---

# Technology Stack

## Frontend

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion

## Backend

* Next.js Route Handlers
* Next.js Server Actions

## Database

* PostgreSQL (Supabase)

## ORM

* Drizzle ORM

## Authentication

* Better Auth

## Storage

* Supabase Storage

## Validation

* Zod

## Forms

* React Hook Form

---

# Architectural Principles

## Single Responsibility

Setiap modul hanya memiliki satu tanggung jawab utama.

Contoh:

* Modul buku hanya menangani fitur buku.
* Modul anggota hanya menangani fitur anggota.

---

## Feature-Oriented

Kode dikelompokkan berdasarkan fitur, bukan berdasarkan jenis file semata.

Contoh fitur:

* Books
* Book Inventories
* Book Sources
* Members
* Borrowings
* Categories
* Authors
* Reports
* Settings

---

## Reusable Components

Komponen yang dapat digunakan kembali harus dipisahkan dari komponen yang hanya digunakan oleh satu fitur.

---

## Separation of Concerns

Pisahkan:

* UI
* Business Logic
* Database Access
* Validation
* Authentication

---

## Server First

Gunakan Server Components sebagai default.

Gunakan Client Components hanya jika diperlukan.

Misalnya:

* Form interaktif
* Modal
* Dropdown
* Drag & Drop
* Animasi

---

## Type Safety

Semua data harus memiliki tipe TypeScript yang jelas.

Hindari penggunaan `any`.

---

## Validation

Seluruh input pengguna harus divalidasi menggunakan Zod sebelum diproses.

---

## Database Access

Seluruh akses database dilakukan melalui Drizzle ORM.

Hindari query SQL mentah kecuali benar-benar diperlukan.

---

## Authentication

Semua autentikasi menggunakan Better Auth.

Role dan permission harus diperiksa di sisi server.

---

## Authorization

Hak akses ditentukan berdasarkan role.

Role yang digunakan:

* Guest
* Member
* Staff
* Admin

---

# Component Guidelines

Komponen harus:

* Kecil
* Fokus pada satu fungsi
* Mudah diuji
* Mudah digunakan ulang

---

# Styling Guidelines

* Gunakan Tailwind CSS.
* Gunakan komponen shadcn/ui sebagai dasar.
* Hindari CSS yang tidak diperlukan.
* Konsisten dalam penggunaan spacing, typography, dan warna.

---

# State Management

Gunakan pendekatan berikut secara berurutan:

1. React State (`useState`)
2. React Context (jika diperlukan)
3. Server Actions
4. TanStack Query (hanya jika memang membutuhkan sinkronisasi data kompleks)

---

# Data Fetching

Prioritas:

1. Server Components
2. Server Actions
3. Route Handlers
4. Client Fetch (hanya jika diperlukan)

---

# Error Handling

Setiap operasi harus memiliki:

* Validasi input
* Penanganan error
* Pesan yang jelas
* Logging jika diperlukan

---

# Logging

Aktivitas penting dicatat ke `activity_logs`, seperti:

* Login
* Logout
* Tambah data
* Ubah data
* Hapus data
* Peminjaman
* Pengembalian

---

# Security

* Validasi semua input
* Password di-hash
* Session aman
* Role-based access
* CSRF protection (jika diperlukan)
* XSS prevention
* Rate limiting pada endpoint sensitif

---

# File Upload

Upload file hanya melalui Supabase Storage.

File yang diizinkan:

* JPG
* JPEG
* PNG
* WebP

Ukuran maksimum mengikuti `STORAGE.md`.

---

# Performance

Prioritaskan:

* Server Rendering
* Image Optimization
* Lazy Loading
* Pagination
* Caching bila diperlukan

---

# Accessibility

Semua antarmuka harus:

* Dapat dioperasikan dengan keyboard
* Memiliki label yang jelas
* Memiliki kontras warna yang baik
* Mendukung pembaca layar

---

# Testing Strategy

Minimal meliputi:

* Validasi form
* Business logic
* Permission
* API / Server Actions
* Integrasi database

---

# Documentation Rules

Perubahan pada fitur utama harus memperbarui dokumen terkait, seperti:

* PRD.md
* DATABASE.md
* SCHEMA.md
* FLOW.md
* ROUTES.md
* UI_UX.md
* AUTH.md
* API.md

---

# Architecture Evolution

Struktur folder, pembagian modul, dan organisasi kode dapat berubah selama pengembangan untuk meningkatkan kualitas aplikasi.

Perubahan tersebut diperbolehkan selama tetap mengikuti prinsip-prinsip yang dijelaskan dalam dokumen ini.

Dokumen ini menjadi acuan arsitektur tingkat tinggi, bukan representasi pasti dari struktur file proyek.
