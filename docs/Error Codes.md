# Error Codes

## Purpose

Dokumen ini mendefinisikan seluruh kode error yang digunakan dalam aplikasi TBM Semesta Alam.

Tujuan:

- Menyeragamkan error di seluruh aplikasi.
- Memudahkan debugging.
- Memudahkan frontend menangani error.
- Menjadi acuan AI Coding Assistant saat membuat Server Actions, API, dan Business Logic.

---

# Error Response Format

Semua error harus menggunakan format berikut.

```ts
{
  success: false,
  code: "BOOK_NOT_FOUND",
  message: "Book not found.",
  details: {},
  timestamp: "2026-08-07T12:00:00Z"
}
```

---

# Error Categories

## Validation Errors

Prefix

```
VALIDATION_
```

| Code | Description |
|------|-------------|
| VALIDATION_FAILED | Input tidak valid |
| REQUIRED_FIELD | Field wajib diisi |
| INVALID_FORMAT | Format data tidak valid |
| INVALID_LENGTH | Panjang data tidak valid |
| INVALID_EMAIL | Format email salah |
| INVALID_PHONE | Nomor telepon tidak valid |
| INVALID_DATE | Format tanggal salah |

---

## Authentication Errors

Prefix

```
AUTH_
```

| Code | Description |
|------|-------------|
| AUTH_REQUIRED | Login diperlukan |
| INVALID_CREDENTIALS | Email atau password salah |
| SESSION_EXPIRED | Session telah berakhir |
| ACCOUNT_DISABLED | Akun dinonaktifkan |
| EMAIL_ALREADY_EXISTS | Email sudah digunakan |
| PASSWORD_TOO_WEAK | Password tidak memenuhi aturan |
| INVALID_RESET_TOKEN | Token reset tidak valid |

---

## Authorization Errors

Prefix

```
PERMISSION_
```

| Code | Description |
|------|-------------|
| PERMISSION_DENIED | Tidak memiliki izin |
| ADMIN_ONLY | Hanya Admin |
| STAFF_ONLY | Hanya Staff |
| MEMBER_ONLY | Hanya Member |

---

# User Errors

Prefix

```
USER_
```

| Code | Description |
|------|-------------|
| USER_NOT_FOUND | User tidak ditemukan |
| USER_ALREADY_EXISTS | User sudah ada |
| USER_INACTIVE | User tidak aktif |

---

# Member Errors

Prefix

```
MEMBER_
```

| Code | Description |
|------|-------------|
| MEMBER_NOT_FOUND | Anggota tidak ditemukan |
| MEMBER_INACTIVE | Anggota tidak aktif |
| MEMBER_LIMIT_REACHED | Batas peminjaman tercapai |

---

# Book Errors

Prefix

```
BOOK_
```

| Code | Description |
|------|-------------|
| BOOK_NOT_FOUND | Buku tidak ditemukan |
| BOOK_ALREADY_EXISTS | Buku sudah ada |
| ISBN_ALREADY_EXISTS | ISBN sudah digunakan |
| BOOK_INACTIVE | Buku tidak aktif |

---

# Book Inventory Errors

Prefix

```
INVENTORY_
```

| Code | Description |
|------|-------------|
| INVENTORY_NOT_FOUND | Inventaris tidak ditemukan |
| INVENTORY_CODE_EXISTS | Kode inventaris sudah digunakan |
| INVENTORY_NOT_AVAILABLE | Inventaris tidak tersedia |
| INVENTORY_ALREADY_BORROWED | Inventaris sedang dipinjam |
| INVENTORY_LOST | Inventaris hilang |
| INVENTORY_MAINTENANCE | Inventaris sedang diperbaiki |
| INVALID_BOOK_CONDITION | Kondisi buku tidak valid |

---

# Book Source Errors

Prefix

```
SOURCE_
```

| Code | Description |
|------|-------------|
| SOURCE_NOT_FOUND | Sumber buku tidak ditemukan |
| SOURCE_ALREADY_EXISTS | Nama sumber sudah digunakan |
| SOURCE_IN_USE | Sumber buku sedang digunakan |

---

# Category Errors

Prefix

```
CATEGORY_
```

| Code | Description |
|------|-------------|
| CATEGORY_NOT_FOUND | Kategori tidak ditemukan |
| CATEGORY_ALREADY_EXISTS | Kategori sudah ada |

---

# Author Errors

Prefix

```
AUTHOR_
```

| Code | Description |
|------|-------------|
| AUTHOR_NOT_FOUND | Penulis tidak ditemukan |

---

# Publisher Errors

Prefix

```
PUBLISHER_
```

| Code | Description |
|------|-------------|
| PUBLISHER_NOT_FOUND | Penerbit tidak ditemukan |

---

# Shelf Errors

Prefix

```
SHELF_
```

| Code | Description |
|------|-------------|
| SHELF_NOT_FOUND | Rak tidak ditemukan |
| SHELF_FULL | Rak penuh |

---

# Borrowing Errors

Prefix

```
BORROW_
```

| Code | Description |
|------|-------------|
| BORROW_NOT_FOUND | Data peminjaman tidak ditemukan |
| BORROW_LIMIT_REACHED | Batas peminjaman tercapai |
| BOOK_ALREADY_BORROWED | Buku sudah dipinjam |
| NO_AVAILABLE_INVENTORY | Tidak ada inventaris tersedia |
| MEMBER_HAS_OVERDUE_BOOKS | Masih memiliki pinjaman terlambat |

---

# Return Errors

Prefix

```
RETURN_
```

| Code | Description |
|------|-------------|
| RETURN_NOT_FOUND | Pengembalian tidak ditemukan |
| BOOK_ALREADY_RETURNED | Buku sudah dikembalikan |

---

# Fine Errors

Prefix

```
FINE_
```

| Code | Description |
|------|-------------|
| FINE_NOT_FOUND | Denda tidak ditemukan |
| FINE_ALREADY_PAID | Denda sudah dibayar |

---

# Upload Errors

Prefix

```
UPLOAD_
```

| Code | Description |
|------|-------------|
| FILE_TOO_LARGE | File terlalu besar |
| INVALID_FILE_TYPE | Format file tidak didukung |
| UPLOAD_FAILED | Upload gagal |
| FILE_NOT_FOUND | File tidak ditemukan |

---

# Export Errors

Prefix

```
EXPORT_
```

| Code | Description |
|------|-------------|
| EXPORT_FAILED | Export gagal |
| EMPTY_DATA | Tidak ada data untuk diekspor |

---

# Database Errors

Prefix

```
DATABASE_
```

| Code | Description |
|------|-------------|
| DATABASE_ERROR | Kesalahan database |
| FOREIGN_KEY_ERROR | Foreign key gagal |
| UNIQUE_CONSTRAINT | Data duplikat |
| TRANSACTION_FAILED | Transaksi gagal |

---

# Server Errors

Prefix

```
SERVER_
```

| Code | Description |
|------|-------------|
| INTERNAL_SERVER_ERROR | Kesalahan server |
| SERVICE_UNAVAILABLE | Layanan tidak tersedia |
| UNKNOWN_ERROR | Kesalahan tidak diketahui |

---

# HTTP Status Mapping

| HTTP | Error Category |
|------|----------------|
| 400 | Validation |
| 401 | Authentication |
| 403 | Authorization |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Business Rule |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

# Best Practices

- Selalu gunakan `code` selain `message`.
- Jangan mengembalikan stack trace ke client.
- Gunakan pesan yang mudah dipahami pengguna.
- Simpan detail teknis di log server.
- Jangan membuat kode error baru jika sudah ada yang sesuai.

---

# Related Documentation

- docs/VALIDATION.md
- docs/API.md
- docs/AUTH.md
- docs/CODING_STANDARDS.md

---

# Definition of Done

Dokumen dianggap selesai jika:

- Semua modul memiliki kode error yang terdokumentasi.
- Tidak ada duplikasi kode error.
- Seluruh Server Actions menggunakan format response yang sama.
- Frontend dapat menangani seluruh error berdasarkan `code`.
- AI Coding Assistant menggunakan kode error dari dokumen ini tanpa membuat variasi baru.