# Members API

## Purpose

Dokumen ini mendefinisikan seluruh Server Actions, Business Rules, Validation, Authorization, dan API yang berkaitan dengan manajemen **Member (Anggota Perpustakaan)** pada aplikasi TBM Semesta Alam.

Member merupakan pengguna yang memiliki hak untuk meminjam buku sesuai kebijakan perpustakaan.

Dokumen ini menjadi acuan implementasi untuk:

- Server Actions
- Route Handlers (jika diperlukan)
- Validation
- Authorization
- AI Coding Assistant

---

# Module Overview

Entity:

```
Member
```

Digunakan untuk:

- Registrasi anggota perpustakaan.
- Mengelola data anggota.
- Mengelola status keanggotaan.
- Melakukan peminjaman buku.
- Melihat riwayat peminjaman.
- Melihat denda.

---

# Authorization

| Action | Guest | Member | Staff | Admin |
|----------|:----:|:------:|:-----:|:-----:|
| Register | ✅ | ❌ | ❌ | ❌ |
| View Own Profile | ❌ | ✅ | ❌ | ❌ |
| Update Own Profile | ❌ | ✅ | ❌ | ❌ |
| View Members | ❌ | ❌ | ✅ | ✅ |
| Search Members | ❌ | ❌ | ✅ | ✅ |
| Create Member | ❌ | ❌ | ✅ | ✅ |
| Update Member | ❌ | ❌ | ✅ | ✅ |
| Delete Member | ❌ | ❌ | ❌ | ✅ |
| Restore Member | ❌ | ❌ | ❌ | ✅ |
| Export Members | ❌ | ❌ | ✅ | ✅ |

---

# Entity

Member

```
id
memberCode
userId
fullName
gender
birthPlace
birthDate
phone
email
address
photoUrl
membershipStatus
joinedAt
expiredAt
notes
createdAt
updatedAt
deletedAt
```

---

# Relationships

```
User
   │
   └───────1 Member

Member
   │
   ├───────< Borrowing
   │
   └───────< Fine
```

One Member

↓

Many Borrowings

↓

Many Fines

---

# Membership Status

```
active

inactive

expired

blocked
```

---

# Server Actions

## createMember()

### Purpose

Menambahkan anggota baru.

### Permission

- Staff
- Admin

### Input

```ts
{
  memberCode: string
  fullName: string
  gender: "male" | "female"
  birthPlace?: string
  birthDate?: Date
  phone?: string
  email?: string
  address?: string
  photoUrl?: string
  expiredAt?: Date
  notes?: string
}
```

### Returns

```ts
{
  success: true,
  data: Member
}
```

---

## registerMember()

Registrasi anggota baru melalui halaman publik.

Permission

Guest

---

## getMembers()

Mengambil seluruh anggota.

Permission

Staff

Admin

Features

- Pagination
- Search
- Sorting
- Filtering

---

## getMemberById()

Mengambil detail anggota.

---

## getMyProfile()

Mengambil profil anggota yang sedang login.

Permission

Member

---

## updateMember()

Mengubah data anggota.

Permission

Staff

Admin

---

## updateMyProfile()

Mengubah profil sendiri.

Permission

Member

---

## deleteMember()

Soft Delete.

Permission

Admin

---

## restoreMember()

Restore anggota.

Permission

Admin

---

## searchMembers()

Parameter

```
q
```

Pencarian berdasarkan

- Member Code
- Nama
- Email
- Nomor Telepon

---

## exportMembers()

Format

- Excel
- PDF

Permission

Staff

Admin

---

# Route Handlers

```
GET

/api/members

GET

/api/members/:id

POST

/api/members

PATCH

/api/members/:id

DELETE

/api/members/:id

POST

/api/members/:id/restore

GET

/api/members/profile

PATCH

/api/members/profile

POST

/api/members/export
```

---

# Validation Rules

## Member Code

- Required
- Unique
- Maksimal 30 karakter

Contoh

```
AGT-000001
```

---

## Full Name

- Required
- Minimal 3 karakter
- Maksimal 150 karakter

---

## Gender

Pilihan

```
male

female
```

---

## Phone

Opsional.

Harus berupa nomor telepon yang valid.

---

## Email

Opsional.

Harus berupa email yang valid.

Jika diisi harus unik.

---

## Birth Date

Opsional.

Tidak boleh melebihi tanggal hari ini.

---

## Address

Opsional.

Maksimal

```
500 karakter
```

---

## Photo

Opsional.

Harus berupa URL yang valid.

---

## Membership Expiration

Jika diisi,

harus lebih besar dari tanggal bergabung.

---

# Search

Staff

Admin

Berdasarkan

- Member Code
- Nama
- Email
- Nomor Telepon

---

# Sorting

```
memberCode

fullName

joinedAt

expiredAt

createdAt
```

---

# Filtering

```
membershipStatus

gender

joinedAt
```

---

# Pagination

```
page

limit
```

---

# Business Rules

- Member Code harus unik.
- Email harus unik jika diisi.
- Soft Delete digunakan.
- Anggota dengan status **blocked** tidak dapat melakukan peminjaman.
- Anggota dengan status **expired** tidak dapat melakukan peminjaman baru.
- Anggota yang masih memiliki buku yang belum dikembalikan tidak dapat dihapus.
- Penghapusan menggunakan `deletedAt`.
- Riwayat peminjaman tetap dipertahankan meskipun anggota dihapus (soft delete).
- Profil anggota hanya dapat diubah oleh pemilik akun atau Staff/Admin sesuai hak akses.

---

# Error Codes

| Code | Description |
|------|-------------|
| MEMBER_NOT_FOUND | Anggota tidak ditemukan |
| MEMBER_ALREADY_EXISTS | Anggota sudah terdaftar |
| MEMBER_CODE_EXISTS | Kode anggota sudah digunakan |
| MEMBER_INACTIVE | Anggota tidak aktif |
| MEMBER_EXPIRED | Masa keanggotaan telah berakhir |
| MEMBER_BLOCKED | Anggota diblokir |
| MEMBER_HAS_ACTIVE_BORROWING | Masih memiliki peminjaman aktif |
| INVALID_MEMBER_CODE | Kode anggota tidak valid |
| INVALID_PHONE | Nomor telepon tidak valid |
| INVALID_EMAIL | Email tidak valid |
| PERMISSION_DENIED | Tidak memiliki izin |

---

# Response Format

Success

```ts
{
  success: true,
  data: {}
}
```

Error

```ts
{
  success: false,
  code: "MEMBER_NOT_FOUND",
  message: "Member not found."
}
```

---

# Database Tables

Menggunakan tabel

```
users

members

borrowings

fines
```

Relasi

```
users.id
    │
    └──── members.user_id

members.id
    │
    ├──── borrowings.member_id
    │
    └──── fines.member_id
```

---

# Index Recommendation

```
member_code

full_name

email

membership_status

joined_at

expired_at
```

---

# Audit Log

Catat aktivitas berikut:

- Register Member
- Create Member
- Update Member
- Update Own Profile
- Delete Member
- Restore Member
- Change Membership Status

---

# Related Documentation

- docs/DATABASE.md
- docs/SCHEMA.md
- docs/VALIDATION.md
- docs/PERMISSIONS.md
- docs/ERRORS.md
- docs/AUTH.md
- docs/api/borrowings.md

---

# Definition of Done

Implementasi Members API dianggap selesai apabila:

- CRUD Member tersedia.
- Registrasi anggota tersedia.
- Update profil sendiri tersedia.
- Soft Delete berfungsi.
- Validasi menggunakan Zod.
- Authorization mengikuti `PERMISSIONS.md`.
- Response mengikuti standar `ERRORS.md`.
- Search, Pagination, Sorting, Filtering, dan Export berfungsi.
- Riwayat peminjaman tetap terjaga.
- Seluruh implementasi konsisten dengan dokumentasi proyek.