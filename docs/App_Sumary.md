# Ringkasan Aplikasi TBM Semesta Alam

## 📖 Gambaran Umum

Aplikasi **TBM Semesta Alam** adalah sistem informasi perpustakaan berbasis web yang dirancang untuk mendigitalkan pengelolaan perpustakaan. Aplikasi ini memiliki **4 aktor** dengan hak akses berbeda: Pengunjung, Anggota, Petugas, dan Admin. Dibangun dengan teknologi modern untuk memastikan kinerja cepat, responsif, dan aman.

---

## 🎯 Tujuan Aplikasi

- Digitalisasi pengelolaan perpustakaan
- Memudahkan pencarian dan peminjaman buku
- Mengurangi pencatatan manual
- Menyediakan laporan otomatis
- Mendukung operasional perpustakaan sekolah/kampus/umum

---

## 👥 Alur & Fitur per Aktor

### 1. PENGUNJUNG (Guest) - Belum Login

**Akses Publik:**

| Fitur | Deskripsi |
|-------|-----------|
| 🏠 **Beranda** | Melihat tampilan awal perpustakaan |
| 🔍 **Cari Buku** | Mencari buku berdasarkan judul, penulis, ISBN, kategori (bukan kode inventaris) |
| 📚 **Detail Buku** | Melihat informasi lengkap buku (sinopsis, stok, lokasi rak, dll) |
| 🏷️ **Kategori** | Melihat daftar kategori buku |
| ℹ️ **Info Perpustakaan** | Melihat informasi profil perpustakaan |
| 📝 **Registrasi** | Mendaftar menjadi anggota perpustakaan |

**Flow Pengunjung:**
```
Beranda → Cari Buku → Lihat Detail Buku → Registrasi (jika ingin jadi anggota)
```

---

### 2. ANGGOTA - Sudah Login

**Akses setelah Login:**

| Fitur | Deskripsi |
|-------|-----------|
| 🔑 **Login/Logout** | Masuk dan keluar sistem |
| 👤 **Profil** | Melihat dan mengubah profil anggota |
| 🔐 **Ganti Password** | Mengubah password akun |
| 🔍 **Cari Buku** | Mencari buku di katalog |
| 📖 **Ajukan Peminjaman** | Meminjam buku yang tersedia |
| 📌 **Reservasi Buku** | Memesan buku yang sedang dipinjam orang lain |
| 📋 **Status Peminjaman** | Melihat status peminjaman aktif |
| 📜 **Riwayat Peminjaman** | Melihat riwayat peminjaman sebelumnya |
| ⏰ **Perpanjang Masa Pinjam** | Memperpanjang masa peminjaman sebelum jatuh tempo |
| 💰 **Lihat Denda** | Melihat denda yang harus dibayar (jika ada) |

**Flow Anggota:**
```
Login → Cari Buku → Ajukan Peminjaman → (Reservasi jika buku tidak tersedia)
     → Pantau Status Peminjaman → Perpanjang (jika perlu)
     → Lihat Denda (jika terlambat)
     → Logout
```

---

### 3. PETUGAS - Login Khusus Petugas

**Akses Manajemen Perpustakaan:**

| Fitur | Deskripsi |
|-------|-----------|
| 🔑 **Login/Logout** | Masuk dan keluar sistem |
| 📊 **Dashboard** | Melihat ringkasan data perpustakaan |
| 📚 **CRUD Buku** | Tambah, edit, hapus, dan lihat detail buku (judul) |
| 📦 **CRUD Inventaris Buku** | Kelola eksemplar fisik (kode inventaris, kondisi, status, rak, sumber buku) |
| 🔗 **CRUD Sumber Buku** | Kelola sumber pengadaan buku (pembelian, hibah, sumbangan, dll) |
| 🏷️ **CRUD Kategori** | Kelola kategori buku |
| ✍️ **CRUD Penulis** | Kelola data penulis |
| 📰 **CRUD Penerbit** | Kelola data penerbit |
| 🗄️ **CRUD Rak** | Kelola lokasi rak buku |
| 👥 **CRUD Anggota** | Kelola data anggota (tambah, edit, nonaktifkan) |
| 📤 **Proses Peminjaman** | Memvalidasi & menyetujui peminjaman berdasarkan inventaris |
| 📥 **Proses Pengembalian** | Memproses pengembalian buku |
| 💰 **Kelola Denda** | Mengelola denda keterlambatan |
| 🔍 **Cari Kode Inventaris** | Menemukan eksemplar tertentu berdasarkan kode inventaris |
| 📤 **Export Buku** | Export data buku ke Excel/PDF |
| 📄 **Laporan** | Mencetak laporan (termasuk Laporan Buku & Buku + Peminjaman) |

**Flow Petugas:**
```
Login → Dashboard (monitoring)
     → Kelola Buku/Inventaris/Sumber Buku/Kategori/Penulis/Penerbit/Rak (master data)
     → Proses Peminjaman (validasi anggota & ketersediaan inventaris)
     → Proses Pengembalian + Denda (jika terlambat)
     → Cari Kode Inventaris / Export Buku
     → Cetak Laporan
     → Logout
```

---

### 4. ADMIN - Super User

**Hak Akses Penuh (termasuk semua fitur Petugas +):**

| Fitur | Deskripsi |
|-------|-----------|
| 👥 **CRUD User** | Kelola semua user sistem |
| 🔑 **CRUD Role** | Kelola role/ peran |
| 🛡️ **Hak Akses** | Mengatur izin akses per role |
| 📦 **CRUD Inventaris & Sumber Buku** | Kelola eksemplar fisik dan sumber pengadaan |
| ⚙️ **Pengaturan Aplikasi** | Konfigurasi sistem (lama pinjam, denda, info perpus) |
| 💾 **Backup Database** | Backup data |
| 🔄 **Restore Database** | Restore data dari backup |
| 📋 **Audit Log** | Melihat log aktivitas user |
| 🔔 **Kelola Notifikasi** | Mengatur notifikasi sistem |

**Flow Admin:**
```
Login → Dashboard (monitoring penuh)
     → Kelola User & Role (manajemen akses)
     → Pengaturan Sistem
     → Backup/Restore Database (pemeliharaan)
     → Audit Log (monitoring keamanan)
     → Logout
```

---

## 🔄 Alur Sistem Utama

### Alur Peminjaman Buku
```
1. Anggota mencari buku via katalog (judul/penulis/ISBN/kategori)
2. Anggota mengajukan peminjaman
3. Petugas memvalidasi:
   - Status anggota (aktif?)
   - Kuota pinjam (maksimal)
   - Ada inventaris (eksemplar fisik) yang tersedia?
4. Petugas memilih Inventaris (BookInventory) berstatus "Tersedia"
5. Sistem mencatat peminjaman → status Inventaris menjadi "Dipinjam"
6. Anggota dapat perpanjang sebelum jatuh tempo
7. Anggota mengembalikan buku
8. Petugas proses pengembalian → status Inventaris kembali "Tersedia"
9. Jika terlambat → sistem hitung denda otomatis
10. Anggota bayar denda (jika ada)
```

### Alur Pendaftaran Anggota
```
1. Pengunjung klik "Registrasi"
2. Isi form pendaftaran (nama, email, password, dll)
3. Sistem kirim verifikasi (opsional)
4. Akun terdaftar sebagai "Anggota"
5. Anggota dapat login dan mulai meminjam
```

---

## ⚙️ Teknologi yang Digunakan

### Frontend
- **Next.js** + **React** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (komponen UI)
- **React Hook Form** + **Zod** (form & validasi)
- **TanStack Table** (tabel data)
- **Framer Motion** (animasi)
- **Lucide React** (ikon)

### Backend & Database
- **Next.js Route Handlers** + **Server Actions**
- **Drizzle ORM** + **Drizzle Kit** (migration)
- **Supabase PostgreSQL** (database)
- **Better Auth** (authentication)
- **Supabase Storage** (penyimpanan file/cover)
- **Zod** (validasi)
- **PDF Generator** + **ExcelJS** (laporan)

### Deployment
- **Vercel**

---

## 🗂️ Modul Sistem

| Modul | Deskripsi |
|-------|-----------|
| **Authentication** | Login, register, lupa password, RBAC |
| **Dashboard** | Ringkasan statistik & grafik |
| **Manajemen Buku** | CRUD buku (judul/bibliografi) + cover |
| **Manajemen Inventaris Buku** | CRUD eksemplar fisik (kode inventaris, kondisi, status, rak, sumber) |
| **Manajemen Sumber Buku** | CRUD sumber pengadaan buku (dinamis) |
| **Manajemen Kategori** | CRUD kategori |
| **Manajemen Penulis** | CRUD penulis |
| **Manajemen Penerbit** | CRUD penerbit |
| **Manajemen Rak** | CRUD lokasi rak |
| **Manajemen Anggota** | CRUD anggota |
| **Peminjaman** | Proses pinjam, kembali, perpanjang (berbasis inventaris) |
| **Denda** | Perhitungan & pembayaran denda |
| **Laporan** | Export PDF/Excel (Peminjaman, Buku, Buku + Peminjaman) |
| **Pengaturan** | Konfigurasi sistem |
| **Audit Log** | Riwayat aktivitas |

---

## 📋 Fitur Modern yang Didukung

- ✅ Responsive Design (Mobile, Tablet, Desktop)
- ✅ Dark Mode
- ✅ Pencarian, Filter, Sorting
- ✅ Pagination
- ✅ Toast Notification
- ✅ Loading Skeleton
- ✅ Empty State
- ✅ Confirmation Dialog
- ✅ Upload Drag & Drop
- ✅ Role Based Access Control (RBAC)

---

## 🚀 Roadmap Pengembangan

### MVP (Saat Ini)
- Authentication (Login, Register, Logout, RBAC)
- Dashboard
- CRUD Buku, Inventaris Buku, Sumber Buku, Kategori, Penulis, Penerbit, Rak
- CRUD Anggota
- Peminjaman & Pengembalian (berbasis inventaris)
- Upload Cover Buku
- Pencarian berdasarkan Kode Inventaris
- Export Data Buku (Excel/PDF)
- Laporan Buku & Laporan Buku + Peminjaman

### Version 2
- Denda Otomatis
- Reservasi Buku
- Export PDF & Excel
- Dashboard Statistik Lengkap
- Audit Log

### Version 3
- QR Code Anggota
- Barcode Scanner
- Push Notification
- PWA
- Smart Search AI
- Rekomendasi Buku AI
- Chatbot Perpustakaan

---

**Aplikasi ini siap digunakan untuk kebutuhan KKN dengan mencakup seluruh fitur yang dibutuhkan perpustakaan digital modern!** 🚀📚