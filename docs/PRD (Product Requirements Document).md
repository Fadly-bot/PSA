# PRD (Product Requirements Document)

# TBM Semesta Alam

---

# 1. Informasi Proyek

## Nama Proyek

TBM Semesta Alam

## Deskripsi

Sistem Informasi Perpustakaan berbasis web yang memungkinkan pengelolaan koleksi buku, anggota, peminjaman, pengembalian, denda, laporan, dan administrasi secara digital.

Aplikasi dirancang agar:

* Mudah digunakan
* Cepat
* Responsif
* Aman
* Skalabel
* Cocok digunakan sekolah, kampus, maupun perpustakaan umum.

---

# 2. Tujuan

* Digitalisasi pengelolaan perpustakaan
* Mempermudah pencarian buku
* Mengurangi pencatatan manual
* Mempermudah proses peminjaman
* Menyediakan laporan otomatis
* Menjadi aplikasi modern yang mudah dikembangkan

---

# 3. Target Pengguna

* Pengunjung
* Anggota
* Petugas
* Admin

---

# 4. Aktor

## Pengunjung

Belum memiliki akun atau belum login.

Hak akses:

* Melihat beranda
* Mencari buku
* Filter buku
* Melihat detail buku
* Melihat kategori
* Registrasi akun

---

## Anggota

Hak akses:

* Login
* Logout
* Edit profil
* Ganti password
* Melihat katalog
* Mencari buku
* Mengajukan peminjaman
* Reservasi buku
* Melihat riwayat peminjaman
* Perpanjang peminjaman
* Melihat denda

---

## Petugas

Hak akses:

* Dashboard
* Kelola Buku
* Kelola Inventaris Buku
* Kelola Sumber Buku
* Kelola Kategori
* Kelola Penulis
* Kelola Penerbit
* Kelola Rak
* Kelola Anggota
* Proses Peminjaman (berdasarkan Inventaris Buku)
* Proses Pengembalian
* Kelola Denda
* Pencarian berdasarkan Kode Inventaris
* Export Data Buku (Excel/PDF)
* Cetak Laporan (termasuk Laporan Buku dan Laporan Buku + Peminjaman)

---

## Admin

Memiliki seluruh hak akses Petugas ditambah:

* Kelola User
* Kelola Role
* Kelola Hak Akses
* Pengaturan Sistem
* Backup Database
* Restore Database
* Audit Log

---

# 5. Modul Sistem

## Authentication

Fitur:

* Register
* Login
* Logout
* Lupa Password
* Reset Password
* Ganti Password
* Role Based Access Control

---

## Dashboard

Menampilkan ringkasan:

* Total Buku
* Total Anggota
* Total Peminjaman
* Total Pengembalian
* Buku Terlambat
* Buku Rusak
* Buku Hilang
* Statistik Bulanan
* Grafik Peminjaman

---

## Manajemen Buku

Manajemen Buku menyimpan **informasi bibliografi** (data induk judul buku). Data eksemplar fisik (jumlah stok, lokasi rak, kondisi) tidak lagi disimpan langsung pada judul buku, melainkan dikelola melalui **Inventaris Buku (Book Copies)**.

Fitur:

* Tambah Buku (judul)
* Edit Buku
* Hapus Buku
* Detail Buku
* ISBN
* Barcode ISBN
* Jumlah Halaman
* Tahun Terbit
* Bahasa
* Sinopsis
* Status Aktif / Nonaktif (status kemunculan judul di katalog)
* Menampilkan daftar Inventaris (eksemplar) di bawah detail judul buku
* Jumlah Stok dan Stok Tersedia dihitung otomatis berdasarkan jumlah Inventaris Buku dan statusnya

Satu judul buku hanya ditampilkan satu kali pada daftar buku (Admin/Petugas). Seluruh eksemplar dari judul tersebut ditampilkan sebagai tabel/daftar Inventaris di bawah judul tersebut.

---

## Inventaris Buku (Book Copies)

Setiap judul buku dapat memiliki banyak inventaris (eksemplar fisik/*book copies*). Peminjaman dilakukan berdasarkan inventaris, bukan hanya berdasarkan judul buku.

Fitur:

* Tambah Inventaris Buku
* Edit Inventaris Buku
* Hapus Inventaris Buku
* Kode Inventaris (unik per eksemplar)
* Kondisi Buku (Baik, Rusak Ringan, Rusak Berat)
* Status Inventaris (Tersedia, Dipinjam, Maintenance, Hilang)
* Lokasi Rak
* Sumber Buku (wajib dipilih dari data Sumber Buku yang tersedia)
* Catatan (opsional)

Hak akses:

* Admin dapat menambah, mengubah, dan menghapus Inventaris Buku.
* Petugas dapat menambah, mengubah, dan menghapus Inventaris Buku.

---

## Sumber Buku (Book Source)

Sumber Buku digunakan untuk mencatat asal pengadaan setiap eksemplar buku. Data bersifat dinamis sehingga Admin maupun Petugas dapat menambah kategori sumber baru sesuai kebutuhan.

Contoh data awal:

* Pembelian
* Hibah
* Sumbangan
* Donasi Alumni
* BOS
* CSR

Fitur:

* Tambah Sumber Buku
* Edit Sumber Buku
* Hapus Sumber Buku

Hak akses:

* Admin dapat mengelola Sumber Buku.
* Petugas dapat mengelola Sumber Buku.

Saat menambah Inventaris Buku, pengguna wajib memilih salah satu Sumber Buku yang tersedia.

---

## Manajemen Cover Buku

Fitur:

* Upload cover buku
* Preview cover sebelum disimpan
* Ganti cover buku
* Hapus cover buku
* Menampilkan cover default jika belum ada gambar
* Mendukung format JPG, JPEG, PNG, dan WebP
* Validasi ukuran file maksimal 5 MB
* Kompresi gambar (opsional)
* Optimasi gambar menggunakan Next.js Image
* Lazy loading untuk mempercepat katalog
* Thumbnail pada tabel admin
* Cover ukuran besar pada halaman detail buku

---

## Kategori

* Tambah
* Edit
* Hapus

---

## Penulis

* Tambah
* Edit
* Hapus

---

## Penerbit

* Tambah
* Edit
* Hapus

---

## Rak Buku

* Tambah
* Edit
* Hapus

---

## Anggota

* Tambah
* Edit
* Hapus
* Nonaktifkan

---

## Peminjaman

Peminjaman dilakukan berdasarkan **Inventaris Buku (eksemplar fisik)**, bukan hanya berdasarkan judul buku.

Fitur:

* Pinjam Buku (berdasarkan Inventaris)
* Pengembalian Buku (menentukan inventaris yang dikembalikan)
* Perpanjang Masa Pinjam
* Riwayat Peminjaman
* Status Peminjaman

---

## Denda

Fitur:

* Perhitungan Otomatis
* Riwayat Denda
* Status Pembayaran

---

## Pencarian Buku

Pencarian untuk **Pengunjung** dan **Anggota** berdasarkan:

* Judul
* Penulis
* ISBN
* Kategori

(Pengunjung dan Anggota tidak dapat mencari berdasarkan Kode Inventaris.)

Filter:

* Kategori
* Tahun Terbit
* Bahasa
* Status
* Ketersediaan

**Pencarian untuk Admin dan Petugas** juga mendukung pencarian berdasarkan **Kode Inventaris**, sehingga dapat langsung menemukan inventaris (eksemplar) tertentu.

Sorting:

* Terbaru
* Terlama
* A-Z
* Z-A
* Paling Banyak Dipinjam

---

## Export Data Buku

Admin dan Petugas dapat mengekspor data Buku ke:

* Excel
* PDF

Data minimal yang diekspor:

* Judul
* ISBN
* Penulis
* Penerbit
* Kategori
* Inventaris (Kode Inventaris)
* Sumber Buku
* Rak
* Kondisi
* Status

---

## Laporan

Laporan:

* Buku
* Buku + Peminjaman
* Anggota
* Peminjaman
* Pengembalian
* Denda

Export:

* PDF
* Excel

---

## Profil

* Edit Profil
* Upload Foto
* Ganti Password

---

## Pengaturan

* Logo Perpustakaan
* Nama Perpustakaan
* Alamat
* Email
* Nomor Telepon
* Jam Operasional
* Lama Maksimal Peminjaman
* Maksimal Jumlah Buku
* Besaran Denda per Hari

---

# 6. Fitur Modern

* Responsive Design
* Dark Mode
* Pagination
* Search
* Filter
* Sorting
* Toast Notification
* Loading Skeleton
* Empty State
* Confirmation Dialog
* Audit Log
* Multi Role
* Upload Drag & Drop

---

# 7. Fitur AI (Opsional)

* Smart Search
* Rekomendasi Buku
* Ringkasan Buku
* Chatbot Perpustakaan

---

# 8. Non Functional Requirement

## Performance

* Waktu muat halaman < 2 detik
* Respon API rata-rata < 500 ms

## Security

* Authentication
* Authorization
* Password Hashing
* Input Validation
* Rate Limiting
* CSRF Protection
* XSS Protection

## Accessibility

* Keyboard Navigation
* ARIA Label
* Color Contrast

## Responsive

* Mobile
* Tablet
* Desktop

---

# 9. Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion

## Backend

* Next.js Route Handlers
* Server Actions
* Prisma ORM

## Database

* PostgreSQL

## Authentication

* Better Auth

## Validation

* Zod

## Storage

* Supabase Storage

## Deployment

* Vercel

---

# 10. Storage

## Bucket

book-covers/

Contoh:

* atomic-habits.webp
* clean-code.webp
* laskar-pelangi.jpg

---

# 11. Database Entity

## Users

* id
* name
* email
* password
* role_id
* avatar
* status
* created_at
* updated_at

---

## Roles

* id
* name

---

## Books

* id
* isbn
* title
* slug
* description
* synopsis
* cover_image
* author_id
* publisher_id
* category_id
* publication_year
* language
* pages
* status
* created_at
* updated_at

Book (judul) hanya menyimpan **informasi bibliografi**. Stok, lokasi rak, kondisi, dan sumber dikelola pada entity **BookInventory**.

---

## BookSources (Sumber Buku)

* id
* name
* description
* created_at
* updated_at

Contoh data: Pembelian, Hibah, Sumbangan, Donasi Alumni, BOS, CSR.

---

## BookInventories (Inventaris Buku / Book Copies)

* id
* inventory_code
* book_id
* source_id
* shelf_id
* condition
* status
* notes
* created_at
* updated_at

Setiap eksemplar fisik buku. Menjadi objek utama dalam proses peminjaman.

---

## Categories

* id
* name
* description

---

## Authors

* id
* name
* biography

---

## Publishers

* id
* name
* address

---

## Shelves

* id
* code
* name
* location

---

## Members

* id
* user_id
* member_code
* phone
* address
* status

---

## Borrowings

* id
* member_id
* borrow_date
* due_date
* return_date
* status

---

## Borrowing Details

* id
* borrowing_id
* book_inventory_id

Setiap baris merujuk pada satu Inventaris Buku (eksemplar fisik) yang dipinjam.

---

## Fines

* id
* borrowing_id
* amount
* status

---

## Audit Logs

* id
* user_id
* action
* created_at

---

# 12. Roadmap

## MVP

* Authentication
* Dashboard
* CRUD Buku
* CRUD Kategori
* CRUD Penulis
* CRUD Penerbit
* CRUD Rak
* CRUD Anggota
* Peminjaman
* Pengembalian
* Upload Cover Buku

---

## Version 2

* Denda Otomatis
* Reservasi Buku
* Export PDF
* Export Excel
* Dashboard Statistik
* Audit Log

---

## Version 3

* QR Code Anggota
* Barcode Scanner
* Push Notification
* Progressive Web App (PWA)
* Smart Search AI
* Rekomendasi Buku AI
* Chatbot Perpustakaan

---

# 13. Future Development

* Integrasi RFID
* Integrasi QR Code Self Check-in
* Multi Cabang Perpustakaan
* Dukungan Multi Bahasa
* Integrasi Email Notification
* Integrasi WhatsApp Notification
* Integrasi Google Books API
* Dashboard Analitik Lanjutan
