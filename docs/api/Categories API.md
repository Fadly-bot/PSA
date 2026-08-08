# Categories API

## 1. Purpose

Dokumen ini mendefinisikan API dan Server Actions untuk modul **Categories** pada aplikasi TBM Semesta Alam.

Modul Categories digunakan untuk mengelola kategori buku yang berfungsi untuk:

- Mengelompokkan buku.
- Membantu pencarian buku.
- Membantu filtering buku.
- Menampilkan statistik buku berdasarkan kategori.
- Menjadi referensi pada data `Book`.
- Digunakan pada laporan buku.
- Digunakan pada dashboard analytics.

Kategori bersifat dinamis sehingga Admin dan Petugas dapat mengelola kategori sesuai kebutuhan perpustakaan.

---

# 2. Scope

Modul ini mencakup:

- Create Category
- Read Category
- Update Category
- Soft Delete Category
- Restore Category
- Search Category
- Filter Category
- Sort Category
- Pagination
- Category Book Count
- Category Usage Check
- Category Integration dengan Books
- Authorization
- Validation
- Audit Logging

Modul ini **tidak** menangani:

- Pengelolaan buku.
- Pengelolaan penulis.
- Pengelolaan penerbit.
- Pengelolaan inventaris.
- Pengelolaan peminjaman.

Modul tersebut memiliki API masing-masing.

---

# 3. Architecture

Alur utama:

```text
UI
 ↓
Server Action
 ↓
Validation
 ↓
Authorization
 ↓
Service Layer
 ↓
Drizzle ORM
 ↓
PostgreSQL / Supabase