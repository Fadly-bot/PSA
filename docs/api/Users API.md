# Users API

## Purpose

Dokumen ini mendefinisikan seluruh Server Actions, Business Rules, Authorization, Validation, dan API yang berkaitan dengan **User Management** pada aplikasi TBM Semesta Alam.

Modul Users digunakan untuk mengelola akun yang dapat mengakses sistem, termasuk:

- Administrator
- Staff / Petugas
- Member (Anggota)

Autentikasi menggunakan **Supabase Auth**, sedangkan data profil disimpan pada tabel `users`.

Dokumen ini menjadi acuan implementasi untuk:

- User Management
- Authentication Integration
- Role Management
- Server Actions
- AI Coding Assistant

---

# Module Overview

Entity utama

```
User
Role
Permission
```

User digunakan untuk:

- Login
- Mengelola akun
- Mengelola role
- Menentukan hak akses
- Audit Activity

---

# User Roles

```
Admin

Staff

Member
```

---

# Authorization

| Action | Guest | Member | Staff | Admin |
|----------|:----:|:------:|:-----:|:-----:|
| View Own Profile | ❌ | ✅ | ✅ | ✅ |
| Update Own Profile | ❌ | ✅ | ✅ | ✅ |
| Change Password | ❌ | ✅ | ✅ | ✅ |
| View Users | ❌ | ❌ | ❌ | ✅ |
| Search Users | ❌ | ❌ | ❌ | ✅ |
| Create User | ❌ | ❌ | ❌ | ✅ |
| Update User | ❌ | ❌ | ❌ | ✅ |
| Delete User | ❌ | ❌ | ❌ | ✅ |
| Restore User | ❌ | ❌ | ❌ | ✅ |
| Change Role | ❌ | ❌ | ❌ | ✅ |
| Export Users | ❌ | ❌ | ❌ | ✅ |

---

# Entity

User

```
id
authId
fullName
email
phone
avatarUrl
role
isActive
lastLoginAt
createdAt
updatedAt
deletedAt
```

---

# Relationships

```
User
   │
   ├──────── Borrowing (Staff)
   │
   ├──────── Return (Staff)
   │
   ├──────── Activity Log
   │
   └──────── Audit Log
```

---

# Server Actions

## createUser()

### Purpose

Membuat akun baru.

### Permission

Admin

### Input

```ts
{
    fullName: string
    email: string
    phone?: string
    role: "admin" | "staff" | "member"
    password: string
}
```

### Process

- Validasi data.
- Membuat akun Supabase Auth.
- Membuat data User.
- Mengirim email aktivasi (opsional).

---

## getUsers()

Mengambil seluruh user.

Features

- Pagination
- Search
- Sorting
- Filtering

---

## getUserById()

Mengambil detail user.

---

## updateUser()

Mengubah data user.

Permission

Admin

---

## updateProfile()

Mengubah profil sendiri.

Permission

- Admin
- Staff
- Member

---

## changePassword()

Mengubah password.

Menggunakan Supabase Auth.

---

## changeRole()

Mengubah role user.

Permission

Admin

Input

```ts
{
    userId: string
    role: "admin" | "staff" | "member"
}
```

---

## deactivateUser()

Menonaktifkan akun.

Permission

Admin

---

## activateUser()

Mengaktifkan kembali akun.

Permission

Admin

---

## deleteUser()

Soft Delete.

Permission

Admin

---

## restoreUser()

Mengembalikan user.

Permission

Admin

---

## searchUsers()

Parameter

```
q
```

Mencari berdasarkan

- Name
- Email
- Phone
- Role

---

## exportUsers()

Format

- Excel
- PDF

---

# Route Handlers

```
GET

/api/users

GET

/api/users/:id

POST

/api/users

PATCH

/api/users/:id

DELETE

/api/users/:id

POST

/api/users/:id/restore

POST

/api/users/:id/change-role

POST

/api/users/change-password

POST

/api/users/export
```

---

# Validation Rules

## Full Name

- Required
- Minimal 3 karakter
- Maksimal 100 karakter

---

## Email

- Required
- Valid Email
- Unique

---

## Phone

- Optional
- Format nomor telepon Indonesia

---

## Password

- Minimal 8 karakter
- Mengandung huruf besar
- Mengandung huruf kecil
- Mengandung angka
- Mengandung simbol

---

## Role

Harus salah satu

```
admin

staff

member
```

---

# Business Rules

- Email harus unik.
- Password disimpan oleh Supabase Auth.
- User yang di-soft delete tidak dapat login.
- Admin tidak dapat menghapus akun sendiri.
- Minimal harus ada satu Admin aktif di sistem.
- Role hanya dapat diubah oleh Admin.
- Member tidak dapat mengakses Dashboard Admin maupun Staff.
- Staff tidak dapat mengubah role pengguna lain.
- Avatar bersifat opsional.
- Soft Delete digunakan.

---

# Search

Admin

Berdasarkan

- Name
- Email
- Phone
- Role

---

# Sorting

```
fullName

email

role

createdAt

lastLoginAt
```

---

# Filtering

```
role

isActive

createdAt
```

---

# Pagination

```
page

limit
```

---

# Export

Format

- Excel
- PDF

Kolom

- Name
- Email
- Phone
- Role
- Status
- Last Login
- Created At

---

# Error Codes

| Code | Description |
|------|-------------|
| USER_NOT_FOUND | User tidak ditemukan |
| EMAIL_ALREADY_EXISTS | Email sudah digunakan |
| INVALID_ROLE | Role tidak valid |
| USER_ALREADY_INACTIVE | User sudah nonaktif |
| USER_ALREADY_ACTIVE | User sudah aktif |
| CANNOT_DELETE_SELF | Tidak dapat menghapus akun sendiri |
| LAST_ADMIN_PROTECTED | Minimal harus ada satu Admin aktif |
| PASSWORD_TOO_WEAK | Password tidak memenuhi syarat |
| EXPORT_FAILED | Gagal membuat laporan |
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
    code: "EMAIL_ALREADY_EXISTS",
    message: "Email already exists."
}
```

---

# Database Tables

```
users

activity_logs

audit_logs

borrowings

returns
```

---

# Index Recommendation

```
email

role

is_active

last_login_at
```

---

# Activity Log

Catat aktivitas berikut:

- Login
- Logout
- Create User
- Update User
- Delete User
- Restore User
- Change Password
- Change Role
- Update Profile

---

# Security Guidelines

- Authentication menggunakan Supabase Auth.
- Authorization menggunakan Role-Based Access Control (RBAC).
- Password tidak pernah disimpan di database aplikasi.
- Gunakan Row Level Security (RLS) untuk melindungi data pengguna.
- Validasi seluruh input menggunakan Zod.
- Seluruh endpoint harus memverifikasi sesi login.

---

# Related Documentation

- docs/AUTH.md
- docs/PERMISSIONS.md
- docs/ERRORS.md
- docs/VALIDATION.md
- docs/DATABASE.md
- docs/SCHEMA.md
- docs/api/auth.md
- docs/api/members.md
- docs/api/dashboard.md

---

# Definition of Done

Implementasi Users API dianggap selesai apabila:

- CRUD User tersedia.
- Integrasi dengan Supabase Auth berjalan.
- Role Management berfungsi.
- Profile Management tersedia.
- Password dapat diubah dengan aman.
- Soft Delete diterapkan.
- Authorization mengikuti `PERMISSIONS.md`.
- Response mengikuti `ERRORS.md`.
- Search, Pagination, Sorting, Filtering, dan Export berfungsi.
- Activity Log tercatat.
- Seluruh implementasi konsisten dengan dokumentasi proyek.