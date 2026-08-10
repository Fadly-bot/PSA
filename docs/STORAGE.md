# STORAGE.md

# File Storage Specification

## Project

TBM Semesta Alam

---

# Purpose

Dokumen ini mendefinisikan aturan penyimpanan file yang digunakan oleh aplikasi, termasuk struktur bucket, validasi file, keamanan, penamaan, serta proses upload dan penghapusan.

Semua proses upload harus mengikuti standar pada dokumen ini.

---

# Storage Provider

* Supabase Storage

---

# Storage Principles

* Semua file disimpan di Supabase Storage.
* Database hanya menyimpan URL atau path file.
* Hindari menyimpan file dalam database.
* Gunakan struktur folder yang konsisten.
* Gunakan nama file yang unik untuk menghindari konflik.

---

# Buckets

## Public Bucket

Digunakan untuk file yang boleh diakses publik.

Bucket:

```text
book-covers
```

Isi:

* Cover Buku

## Setup Bucket (Wajib Sekali)

Bucket `book-covers` **harus ada** di Supabase Storage sebelum upload cover bisa bekerja.

Jika bucket belum ada, upload akan gagal dengan error:

```text
COVER_UPLOAD_FAILED: Gagal mengunggah cover.
```

(root cause: `storage.buckets` ber-RLS tanpa policy → Storage API menolak semua INSERT dengan `new row violates row-level security policy`).

Jalankan setup satu kali terhadap database target (local/preview/production):

```bash
node --env-file-if-exists=.env.local --import tsx scripts/setup-storage.ts
```

Script bersifat **idempotent** (aman dijalankan ulang) dan melakukan:

1. Membuat bucket publik `book-covers` (limit 5 MB, MIME JPG/JPEG/PNG/WebP).
2. Policy `storage.buckets`: read publik + kelola oleh service role.
3. Policy `storage.objects`: read publik + tulis oleh role `anon` (role yang dipakai Storage API di project ini), `service_role`, dan `authenticated` — semua dibatasi ke bucket `book-covers`.

Catatan: `createBucket()` via SDK tidak digunakan di sini karena policy RLS bucket di project ini menolak INSERT dari API; pembuatan via SQL (owner role) adalah cara yang andal.

---

## Private Bucket (Future)

Bucket:

```text
private
```

Digunakan untuk:

* Backup
* Dokumen internal
* File sensitif

---

# Folder Structure

```text
book-covers/
```

Contoh

```text
book-covers/
├── 6e9d9c8d-atomic-habits.webp
├── 4f2a1c5e-clean-code.jpg
├── 1d3b8f0a-laskar-pelangi.png
```

---

# Database Mapping

Tabel:

```text
books
```

Kolom:

```text
cover_image
```

Isi kolom berupa:

* Public URL, atau
* Storage path (direkomendasikan)

---

# Supported File Types

Diizinkan:

* JPG
* JPEG
* PNG
* WebP

Tidak diizinkan:

* GIF
* SVG
* PDF
* ZIP
* EXE

---

# Maximum File Size

Maksimal:

```text
5 MB
```

---

# Image Resolution

Rekomendasi minimum:

```text
400 x 600 px
```

Rekomendasi ideal:

```text
800 x 1200 px
```

Rasio yang disarankan:

```text
2 : 3
```

---

# File Naming

Gunakan format:

```text
<uuid>-<slug>.<extension>
```

Contoh

```text
3f8d2c1b-clean-code.webp
```

Hindari:

```text
cover1.jpg
gambarbaru.png
foto.png
```

---

# Upload Flow

Staff / Admin

↓

Pilih gambar

↓

Validasi format

↓

Validasi ukuran

↓

Generate nama file

↓

Upload ke Supabase Storage

↓

Dapatkan path

↓

Simpan ke database

↓

Berhasil

---

# Update Cover Flow

Staff / Admin

↓

Upload cover baru

↓

Validasi

↓

Upload file baru

↓

Update kolom

↓

Hapus file lama (opsional)

↓

Selesai

---

# Delete Cover Flow

Saat buku dihapus:

* Soft delete buku.
* Cover tetap disimpan.

Saat buku dihapus permanen:

* Hapus file dari Storage.
* Hapus data database.

---

# Validation Rules

Sebelum upload:

* File harus berupa gambar.
* Ukuran ≤ 5 MB.
* MIME type harus valid.
* Nama file dibuat otomatis.

---

# Image Optimization

Gunakan:

* `next/image`

Aktifkan:

* Lazy Loading
* Responsive Image
* Optimized Image

---

# Default Cover

Jika buku belum memiliki cover, gunakan gambar default.

Lokasi:

```text
/public/images/default-book-cover.webp
```

---

# Access Control

## Public Bucket

Boleh diakses:

* Guest
* Member
* Staff
* Admin

Upload:

* Staff
* Admin

Delete:

* Admin

---

# Security Rules

* Validasi MIME type di server.
* Validasi ukuran file.
* Jangan percaya ekstensi file saja.
* Jangan menyimpan nama file asli pengguna.
* Gunakan nama file yang dihasilkan sistem.

---

# Metadata (Optional)

Jika diperlukan, simpan metadata:

* Width
* Height
* File Size
* MIME Type

---

# Future Upload Types

## User Avatar

Bucket:

```text
avatars
```

Format:

```text
<user-id>.webp
```

---

## Library Logo

Bucket:

```text
settings
```

---

## Announcement Images

Bucket:

```text
announcements
```

---

## Report Attachments

Bucket:

```text
reports
```

---

# Cleanup Strategy

Hapus file yang:

* Tidak lagi digunakan.
* Gagal tersimpan di database.
* Melebihi batas retensi (jika diterapkan).

Lakukan proses cleanup secara berkala.

---

# Error Handling

Jika upload gagal:

* Tampilkan pesan yang jelas.
* Jangan menyimpan data buku.
* Bersihkan file sementara bila ada.

---

# Performance

* Gunakan format WebP jika memungkinkan.
* Hindari ukuran file besar.
* Gunakan lazy loading.
* Optimalkan gambar sebelum ditampilkan.

---

# Accessibility

Setiap cover buku harus memiliki:

* Alt text menggunakan judul buku.
* Placeholder saat gambar dimuat.
* Fallback jika gambar gagal dimuat.

---

# Best Practices

* Simpan path atau URL di database, bukan file.
* Gunakan nama file unik.
* Hindari overwrite file lama.
* Validasi upload di server.
* Gunakan gambar default jika tidak ada cover.
* Optimalkan gambar sebelum ditampilkan.
* Bersihkan file yang tidak lagi digunakan.
