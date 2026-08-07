# CONTRIBUTING.md

# Contribution Guide

## Project

TBM Semesta Alam

---

# Purpose

Dokumen ini menjelaskan aturan kontribusi untuk seluruh pengembangan proyek.

Semua kontributor, baik developer maupun AI coding assistant, harus mengikuti panduan ini agar kualitas kode, dokumentasi, dan arsitektur tetap konsisten.

---

# Project Philosophy

Setiap perubahan harus:

* Menyelesaikan masalah yang jelas.
* Tidak merusak fitur yang sudah ada.
* Mengikuti seluruh dokumentasi pada folder `docs/`.
* Mengutamakan keterbacaan, keamanan, dan maintainability.

---

# Before Contributing

Sebelum mulai membuat fitur atau memperbaiki bug:

1. Baca `docs/AGENT.md`.
2. Baca `docs/PRD.md`.
3. Baca dokumentasi modul yang berkaitan.
4. Pastikan memahami alur pada `FLOW.md`.
5. Ikuti aturan pada `CODING_STANDARDS.md`.

---

# Development Workflow

```text id="4dq2k6"
Issue

↓

Planning

↓

Implementation

↓

Testing

↓

Documentation Update

↓

Review

↓

Merge
```

---

# Branch Strategy

Production

```text id="mjlwmz"
main
```

Development

```text id="qvzk8m"
develop
```

Feature

```text id="wmscfv"
feature/<feature-name>
```

Bug Fix

```text id="5afizb"
fix/<bug-name>
```

Hotfix

```text id="sfb3oq"
hotfix/<issue-name>
```

---

# Commit Convention

Gunakan Conventional Commits.

Contoh:

```text id="vq6pmf"
feat: add borrowing management

fix: resolve duplicate isbn validation

docs: update storage documentation

refactor: simplify dashboard layout

style: improve button spacing

test: add borrowing validation tests

chore: update dependencies
```

---

# Pull Request Rules

Sebelum membuat Pull Request:

* Branch sudah diperbarui dari `develop`.
* Build berhasil.
* Tidak ada error TypeScript.
* Tidak ada lint error.
* Dokumentasi telah diperbarui bila diperlukan.
* Tidak ada konflik merge.

---

# Code Review Checklist

Reviewer memeriksa:

* Kualitas kode.
* Konsistensi penamaan.
* Validasi.
* Permission.
* Error handling.
* Reusability.
* Keamanan.
* Performa.
* Dokumentasi.

---

# Documentation Rules

Jika perubahan memengaruhi fitur, perbarui dokumen yang relevan, misalnya:

* PRD.md
* DATABASE.md
* SCHEMA.md
* FLOW.md
* ROUTES.md
* UI_UX.md
* AUTH.md
* STORAGE.md
* VALIDATION.md
* API.md

Dokumentasi harus tetap sinkron dengan implementasi.

---

# Coding Rules

Selalu ikuti:

* `ARCHITECTURE.md`
* `CODING_STANDARDS.md`

Jangan membuat pola baru jika sudah tersedia pola yang konsisten.

---

# Database Changes

Jika ada perubahan database:

1. Perbarui `DATABASE.md`.
2. Perbarui `SCHEMA.md`.
3. Buat migration Drizzle.
4. Uji migration pada database development.
5. Pastikan migration aman untuk production.

---

# UI Changes

Jika ada perubahan antarmuka:

* Perbarui `UI_UX.md` jika perubahan bersifat struktural.
* Pastikan desain tetap responsif.
* Gunakan komponen yang sudah ada bila memungkinkan.

---

# Authentication Changes

Jika mengubah login, session, atau permission:

* Perbarui `AUTH.md`.
* Pastikan middleware tetap berfungsi.
* Uji seluruh role.

---

# Validation Changes

Jika menambah atau mengubah aturan validasi:

* Perbarui `VALIDATION.md`.
* Uji validasi di frontend dan server.

---

# Testing Requirements

Sebelum merge:

* Build berhasil.
* TypeScript tanpa error.
* ESLint tanpa error.
* Semua test utama lulus.
* Fitur diuji secara manual.

---

# Security Guidelines

Jangan:

* Menyimpan password dalam bentuk teks biasa.
* Menyimpan secret di repository.
* Menggunakan query SQL mentah tanpa alasan kuat.
* Mengabaikan validasi server.

Selalu:

* Validasi input.
* Periksa permission.
* Gunakan ORM.
* Lindungi data sensitif.

---

# AI Coding Assistant Guidelines

AI coding assistant harus:

* Membaca `AGENT.md` sebelum menghasilkan kode.
* Mengikuti seluruh dokumentasi di folder `docs/`.
* Tidak membuat struktur baru tanpa alasan teknis yang jelas.
* Menghindari duplikasi kode.
* Memanfaatkan komponen yang sudah ada.
* Menjaga konsistensi penamaan dan pola implementasi.

Jika dokumentasi dan implementasi bertentangan, lakukan pembaruan dokumentasi atau implementasi setelah ada keputusan yang jelas.

---

# Bug Report Template

Minimal berisi:

* Judul
* Deskripsi
* Langkah reproduksi
* Hasil yang diharapkan
* Hasil aktual
* Screenshot (jika ada)
* Prioritas

---

# Feature Request Template

Minimal berisi:

* Ringkasan fitur
* Latar belakang
* Tujuan
* Dampak terhadap pengguna
* Modul yang terpengaruh

---

# Issue Labels

Gunakan label yang konsisten, misalnya:

* bug
* feature
* enhancement
* documentation
* refactor
* security
* performance
* testing

---

# Release Requirements

Sebelum release:

* Semua fitur target selesai.
* Semua bug kritis diperbaiki.
* Dokumentasi diperbarui.
* Migration database telah diuji.
* Deployment berhasil.
* Smoke test selesai.

---

# Definition of Done

Kontribusi dianggap selesai jika:

* Mengikuti seluruh dokumentasi proyek.
* Build berhasil.
* Tidak ada error TypeScript.
* Tidak ada lint error.
* Validasi berjalan.
* Permission berjalan.
* Dokumentasi diperbarui.
* Tidak menimbulkan regresi pada fitur lain.
* Siap untuk proses review dan merge.

---

# Continuous Improvement

Panduan ini dapat diperbarui sesuai perkembangan proyek.

Setiap perubahan harus meningkatkan kualitas, konsistensi, dan kemudahan pemeliharaan proyek tanpa mengorbankan standar yang telah ditetapkan.
