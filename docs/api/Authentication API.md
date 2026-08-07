# Authentication API

## Purpose

Dokumen ini menjelaskan seluruh **Server Actions** dan **Route Handlers** yang berkaitan dengan autentikasi pengguna.

Aturan bisnis autentikasi dijelaskan pada `docs/AUTH.md`.

---

# Module Overview

Modul Authentication menangani:

* Register
* Login
* Logout
* Session
* Forgot Password
* Reset Password
* Change Password
* Current User

---

# Authentication Provider

* Better Auth

---

# Database

* PostgreSQL
* Drizzle ORM

---

# Server Actions

---

## register()

### Purpose

Mendaftarkan akun Member baru.

### Parameters

| Field    | Type   | Required |
| -------- | ------ | -------- |
| name     | string | ✅        |
| email    | string | ✅        |
| password | string | ✅        |

### Validation

* Nama minimal 3 karakter.
* Email harus valid.
* Email harus unik.
* Password mengikuti `VALIDATION.md`.

### Success

* Membuat akun Better Auth.
* Membuat data Member.
* Login otomatis (opsional).

### Authorization

Guest

---

## login()

### Purpose

Login menggunakan email dan password.

### Parameters

| Field    | Type   | Required |
| -------- | ------ | -------- |
| email    | string | ✅        |
| password | string | ✅        |

### Validation

* Email valid.
* Password tidak kosong.

### Success

* Membuat session.
* Redirect ke dashboard sesuai role.

### Authorization

Guest

---

## logout()

### Purpose

Menghapus session aktif.

### Parameters

Tidak ada.

### Success

* Session dihapus.
* Redirect ke halaman utama.

### Authorization

Member

Staff

Admin

---

## getCurrentUser()

### Purpose

Mengambil data pengguna yang sedang login.

### Parameters

Tidak ada.

### Response

* User
* Role
* Session

---

## updateProfile()

### Purpose

Memperbarui profil pengguna.

### Parameters

| Field   | Type   |
| ------- | ------ |
| name    | string |
| phone   | string |
| address | string |

### Authorization

Member

Staff

Admin

---

## changePassword()

### Purpose

Mengubah password.

### Parameters

| Field           | Type   |
| --------------- | ------ |
| currentPassword | string |
| newPassword     | string |

### Validation

* Password lama benar.
* Password baru memenuhi aturan.

---

## forgotPassword()

### Purpose

Mengirim email reset password.

### Parameters

| Field | Type   |
| ----- | ------ |
| email | string |

---

## resetPassword()

### Purpose

Mengatur ulang password menggunakan token.

### Parameters

| Field    | Type   |
| -------- | ------ |
| token    | string |
| password | string |

---

# Route Handlers

Sebagian besar autentikasi ditangani Better Auth.

Route Handler hanya digunakan bila diperlukan.

Contoh:

```text id="lmghh3"
GET /api/auth/session
```

Mengambil session aktif.

---

```text id="g1o9im"
POST /api/auth/logout
```

Logout melalui endpoint.

---

```text id="zg59ej"
POST /api/auth/forgot-password
```

Mengirim email reset.

---

```text id="y2fc5u"
POST /api/auth/reset-password
```

Reset password.

---

# Authentication

Semua endpoint privat harus:

* Memastikan session valid.
* Menggunakan Better Auth.

---

# Authorization

Role yang didukung:

* Guest
* Member
* Staff
* Admin

Permission mengikuti `docs/AUTH.md`.

---

# Business Rules

Register:

* Email unik.
* Role default Member.
* Status Active.

Login:

* Akun harus Active.

Password:

* Minimal 8 karakter.
* Mengandung huruf besar, huruf kecil, dan angka.

---

# Validation

Gunakan:

* Zod

Semua request harus divalidasi sebelum diproses.

---

# Response Format

## Success

```ts id="9h2w4m"
{
  success: true,
  message: "Login successful.",
  data: {
    user: {}
  }
}
```

---

## Error

```ts id="pk9l1y"
{
  success: false,
  message: "Invalid email or password."
}
```

---

# Error Codes

| Code                 | Description                    |
| -------------------- | ------------------------------ |
| INVALID_CREDENTIALS  | Email atau password salah      |
| EMAIL_ALREADY_EXISTS | Email sudah digunakan          |
| ACCOUNT_INACTIVE     | Akun tidak aktif               |
| SESSION_EXPIRED      | Session telah berakhir         |
| PASSWORD_TOO_WEAK    | Password tidak memenuhi aturan |
| INVALID_RESET_TOKEN  | Token reset tidak valid        |

---

# Logging

Catat aktivitas:

* Register
* Login
* Logout
* Ganti Password
* Reset Password

---

# Security

* Hash password menggunakan Better Auth.
* Jangan mengembalikan password ke client.
* Jangan mengekspos informasi sensitif.
* Selalu validasi session.
* Periksa role di server.

---

# Related Documentation

* `docs/AUTH.md`
* `docs/VALIDATION.md`
* `docs/DATABASE.md`
* `docs/SCHEMA.md`
* `docs/CODING_STANDARDS.md`

---

# Definition of Done

Modul Authentication dianggap selesai jika:

* Register berfungsi.
* Login berfungsi.
* Logout berfungsi.
* Session berjalan dengan benar.
* Forgot Password berfungsi.
* Reset Password berfungsi.
* Change Password berfungsi.
* Validasi berjalan.
* Permission berjalan.
* Logging aktif.
* Error ditangani dengan benar.
