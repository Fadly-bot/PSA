# Permissions

## Purpose

Dokumen ini mendefinisikan seluruh hak akses (Authorization) berdasarkan Role yang digunakan dalam aplikasi TBM Semesta Alam.

Dokumen ini menjadi acuan bagi:

- Server Actions
- Route Handlers
- Middleware
- UI Rendering
- Navigation
- Dashboard
- AI Coding Assistant

Semua implementasi authorization harus mengikuti dokumen ini.

---

# User Roles

Aplikasi memiliki empat role utama.

| Role | Description |
|------|-------------|
| Guest | Pengunjung yang belum login |
| Member | Anggota perpustakaan |
| Staff | Petugas perpustakaan |
| Admin | Administrator sistem |

---

# Permission Matrix

| Feature | Guest | Member | Staff | Admin |
|---------|:----:|:------:|:-----:|:-----:|
| View Home | ✅ | ✅ | ✅ | ✅ |
| Search Books | ✅ | ✅ | ✅ | ✅ |
| View Book Detail | ✅ | ✅ | ✅ | ✅ |
| Login | ✅ | ❌ | ❌ | ❌ |
| Logout | ❌ | ✅ | ✅ | ✅ |
| View Dashboard | ❌ | ✅ | ✅ | ✅ |

---

# Books

| Action | Guest | Member | Staff | Admin |
|---------|:----:|:------:|:-----:|:-----:|
| View Books | ✅ | ✅ | ✅ | ✅ |
| Search Books | ✅ | ✅ | ✅ | ✅ |
| Create Book | ❌ | ❌ | ✅ | ✅ |
| Update Book | ❌ | ❌ | ✅ | ✅ |
| Delete Book | ❌ | ❌ | ❌ | ✅ |
| Restore Book | ❌ | ❌ | ❌ | ✅ |
| Export Books | ❌ | ❌ | ✅ | ✅ |

---

# Book Inventories

| Action | Guest | Member | Staff | Admin |
|---------|:----:|:------:|:-----:|:-----:|
| View Inventory | ❌ | ❌ | ✅ | ✅ |
| Search Inventory Code | ❌ | ❌ | ✅ | ✅ |
| Create Inventory | ❌ | ❌ | ✅ | ✅ |
| Update Inventory | ❌ | ❌ | ✅ | ✅ |
| Delete Inventory | ❌ | ❌ | ❌ | ✅ |
| Restore Inventory | ❌ | ❌ | ❌ | ✅ |

---

# Book Sources

| Action | Guest | Member | Staff | Admin |
|---------|:----:|:------:|:-----:|:-----:|
| View Sources | ❌ | ❌ | ✅ | ✅ |
| Create Source | ❌ | ❌ | ✅ | ✅ |
| Update Source | ❌ | ❌ | ✅ | ✅ |
| Delete Source | ❌ | ❌ | ❌ | ✅ |

---

# Categories

| Action | Guest | Member | Staff | Admin |
|---------|:----:|:------:|:-----:|:-----:|
| View | ✅ | ✅ | ✅ | ✅ |
| Create | ❌ | ❌ | ✅ | ✅ |
| Update | ❌ | ❌ | ✅ | ✅ |
| Delete | ❌ | ❌ | ❌ | ✅ |

---

# Authors

| Action | Guest | Member | Staff | Admin |
|---------|:----:|:------:|:-----:|:-----:|
| View | ✅ | ✅ | ✅ | ✅ |
| Create | ❌ | ❌ | ✅ | ✅ |
| Update | ❌ | ❌ | ✅ | ✅ |
| Delete | ❌ | ❌ | ❌ | ✅ |

---

# Publishers

| Action | Guest | Member | Staff | Admin |
|---------|:----:|:------:|:-----:|:-----:|
| View | ✅ | ✅ | ✅ | ✅ |
| Create | ❌ | ❌ | ✅ | ✅ |
| Update | ❌ | ❌ | ✅ | ✅ |
| Delete | ❌ | ❌ | ❌ | ✅ |

---

# Shelves

| Action | Guest | Member | Staff | Admin |
|---------|:----:|:------:|:-----:|:-----:|
| View | ❌ | ❌ | ✅ | ✅ |
| Create | ❌ | ❌ | ✅ | ✅ |
| Update | ❌ | ❌ | ✅ | ✅ |
| Delete | ❌ | ❌ | ❌ | ✅ |

---

# Members

| Action | Guest | Member | Staff | Admin |
|---------|:----:|:------:|:-----:|:-----:|
| View Members | ❌ | ❌ | ✅ | ✅ |
| Create Member | ❌ | ❌ | ✅ | ✅ |
| Update Member | ❌ | ❌ | ✅ | ✅ |
| Delete Member | ❌ | ❌ | ❌ | ✅ |

---

# Borrowings

| Action | Guest | Member | Staff | Admin |
|---------|:----:|:------:|:-----:|:-----:|
| View Own Borrowings | ❌ | ✅ | ❌ | ❌ |
| View All Borrowings | ❌ | ❌ | ✅ | ✅ |
| Borrow Book | ❌ | ❌ | ✅ | ✅ |
| Return Book | ❌ | ❌ | ✅ | ✅ |
| Extend Borrowing | ❌ | ❌ | ✅ | ✅ |

---

# Fines

| Action | Guest | Member | Staff | Admin |
|---------|:----:|:------:|:-----:|:-----:|
| View Own Fines | ❌ | ✅ | ❌ | ❌ |
| View All Fines | ❌ | ❌ | ✅ | ✅ |
| Create Fine | ❌ | ❌ | ✅ | ✅ |
| Mark Fine as Paid | ❌ | ❌ | ✅ | ✅ |

---

# Reports

| Action | Guest | Member | Staff | Admin |
|---------|:----:|:------:|:-----:|:-----:|
| View Reports | ❌ | ❌ | ✅ | ✅ |
| Export Excel | ❌ | ❌ | ✅ | ✅ |
| Export PDF | ❌ | ❌ | ✅ | ✅ |

---

# Dashboard Widgets

| Widget | Guest | Member | Staff | Admin |
|--------|:----:|:------:|:-----:|:-----:|
| Statistics | ❌ | ❌ | ✅ | ✅ |
| Recent Borrowings | ❌ | ❌ | ✅ | ✅ |
| Inventory Status | ❌ | ❌ | ✅ | ✅ |
| Popular Books | ❌ | ❌ | ✅ | ✅ |

---

# Profile

| Action | Guest | Member | Staff | Admin |
|---------|:----:|:------:|:-----:|:-----:|
| View Profile | ❌ | ✅ | ✅ | ✅ |
| Update Profile | ❌ | ✅ | ✅ | ✅ |
| Change Password | ❌ | ✅ | ✅ | ✅ |

---

# Authorization Rules

- Semua permission diperiksa di server.
- Frontend hanya menyembunyikan UI, bukan sebagai mekanisme keamanan.
- Setiap Server Action wajib memverifikasi session dan role.
- Middleware melindungi seluruh route privat.
- Permission tidak boleh ditentukan berdasarkan input dari client.

---

# Route Protection

| Route | Minimum Role |
|--------|--------------|
| /dashboard | Member |
| /dashboard/books | Staff |
| /dashboard/inventories | Staff |
| /dashboard/book-sources | Staff |
| /dashboard/members | Staff |
| /dashboard/reports | Staff |
| /dashboard/users | Admin |
| /dashboard/settings | Admin |

---

# Permission Constants

Gunakan konstanta berikut agar tidak menggunakan string secara langsung.

```ts
export const PERMISSIONS = {
  BOOK_CREATE: "book:create",
  BOOK_UPDATE: "book:update",
  BOOK_DELETE: "book:delete",

  INVENTORY_CREATE: "inventory:create",
  INVENTORY_UPDATE: "inventory:update",
  INVENTORY_DELETE: "inventory:delete",

  SOURCE_CREATE: "source:create",
  SOURCE_UPDATE: "source:update",
  SOURCE_DELETE: "source:delete",

  MEMBER_CREATE: "member:create",
  MEMBER_UPDATE: "member:update",

  REPORT_EXPORT: "report:export"
}
```

---

# Best Practices

- Selalu cek session sebelum permission.
- Gunakan prinsip Least Privilege (role hanya memiliki akses yang diperlukan).
- Hindari hardcode role di komponen.
- Gunakan helper atau middleware untuk pengecekan permission.
- Semua perubahan permission harus diperbarui di dokumen ini terlebih dahulu.

---

# Related Documentation

- docs/AUTH.md
- docs/PRD.md
- docs/ROUTES.md
- docs/API.md
- docs/ARCHITECTURE.md

---

# Definition of Done

Dokumen dianggap selesai apabila:

- Seluruh role telah didefinisikan.
- Seluruh fitur memiliki permission matrix.
- Semua route memiliki aturan akses.
- Seluruh Server Actions mengacu pada dokumen ini.
- Tidak ada aturan permission yang bertentangan dengan dokumentasi lain.