# Settings API

## Purpose

Dokumen ini mendefinisikan seluruh Server Actions, Business Rules, Authorization, Validation, dan API yang berkaitan dengan **System Settings** pada aplikasi TBM Semesta Alam.

Modul Settings digunakan untuk mengelola konfigurasi aplikasi tanpa perlu mengubah kode program. Seluruh konfigurasi disimpan di database sehingga dapat diubah melalui Dashboard Admin.

Dokumen ini menjadi acuan implementasi untuk:

- System Configuration
- Library Configuration
- Borrowing Rules
- Fine Configuration
- Appearance
- Notification Settings
- AI Coding Assistant

---

# Module Overview

Entity utama

```
Setting
```

Seluruh konfigurasi dikelompokkan berdasarkan kategori.

```
General

Library

Borrowing

Fine

Notification

Security

Appearance

Backup
```

---

# Authorization

| Action | Guest | Member | Staff | Admin |
|----------|:----:|:------:|:-----:|:-----:|
| View Settings | ❌ | ❌ | ❌ | ✅ |
| Update Settings | ❌ | ❌ | ❌ | ✅ |
| Reset Settings | ❌ | ❌ | ❌ | ✅ |
| Export Settings | ❌ | ❌ | ❌ | ✅ |
| Import Settings | ❌ | ❌ | ❌ | ✅ |

---

# Entity

Setting

```
id
key
category
value
description
isPublic
createdBy
updatedBy
createdAt
updatedAt
```

---

# Categories

## General

```
Application Name

Application Logo

Application Description

Timezone

Language

Date Format
```

---

## Library

```
Library Name

Library Address

Library Email

Library Phone

Library Website

Library Logo
```

---

## Borrowing

```
Maximum Borrow Books

Borrow Duration (Days)

Maximum Extension

Maximum Renew Count

Allow Reservation

Allow Guest Search
```

---

## Fine

```
Fine Enabled

Late Fine Per Day

Lost Book Fine

Damaged Book Fine

Currency
```

---

## Notification

```
Email Reminder

Due Date Reminder

Late Reminder

Welcome Email

System Notification
```

---

## Security

```
Session Timeout

Maximum Login Attempts

Password Minimum Length

Require Strong Password

Enable Two Factor Authentication
```

---

## Appearance

```
Theme

Primary Color

Sidebar Style

Dashboard Layout

Default Pagination
```

---

## Backup

```
Auto Backup

Backup Interval

Retention Days
```

---

# Relationships

```
User

↓

Setting

(Activity Log)
```

---

# Server Actions

## getSettings()

Mengambil seluruh konfigurasi aplikasi.

---

## getSetting()

Mengambil satu konfigurasi.

Input

```ts
{
    key: string
}
```

---

## updateSetting()

Mengubah satu konfigurasi.

Permission

Admin

Input

```ts
{
    key: string
    value: unknown
}
```

---

## updateSettings()

Mengubah banyak konfigurasi sekaligus.

Permission

Admin

---

## resetSettings()

Mengembalikan konfigurasi ke default.

Permission

Admin

---

## exportSettings()

Export konfigurasi.

Format

- JSON
- Excel

---

## importSettings()

Import konfigurasi.

Format

```
JSON
```

---

# Route Handlers

```
GET

/api/settings

GET

/api/settings/:key

PATCH

/api/settings

POST

/api/settings/reset

POST

/api/settings/export

POST

/api/settings/import
```

---

# Validation Rules

## Key

- Required
- Tidak boleh kosong
- Harus unik

---

## Category

Harus salah satu

```
general

library

borrowing

fine

notification

security

appearance

backup
```

---

## Borrow Duration

- Integer
- Minimal 1 hari

---

## Maximum Borrow Books

- Integer
- Minimal 1

---

## Fine Per Day

- Decimal
- Tidak boleh negatif

---

## Currency

Menggunakan format ISO.

Contoh

```
IDR
USD
```

---

## Email

Harus valid.

---

## Theme

```
light

dark

system
```

---

# Business Rules

- Hanya Admin yang dapat mengubah konfigurasi.
- Perubahan konfigurasi berlaku untuk seluruh sistem.
- Pengaturan peminjaman langsung memengaruhi modul Borrowings.
- Pengaturan denda langsung memengaruhi modul Fines.
- Pengaturan tampilan memengaruhi Dashboard.
- Import Settings akan memvalidasi seluruh data sebelum disimpan.
- Reset Settings akan mengembalikan nilai default aplikasi.

---

# Search

Admin

Berdasarkan

```
Key

Category

Description
```

---

# Sorting

```
Category

Key

Updated At
```

---

# Filtering

```
Category

isPublic
```

---

# Export

Format

- JSON
- Excel

---

# Error Codes

| Code | Description |
|------|-------------|
| SETTING_NOT_FOUND | Konfigurasi tidak ditemukan |
| INVALID_SETTING_KEY | Key tidak valid |
| INVALID_SETTING_VALUE | Nilai konfigurasi tidak valid |
| INVALID_CATEGORY | Kategori tidak valid |
| IMPORT_FAILED | Gagal mengimpor konfigurasi |
| EXPORT_FAILED | Gagal mengekspor konfigurasi |
| RESET_FAILED | Gagal mereset konfigurasi |
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
    code: "INVALID_SETTING_VALUE",
    message: "Invalid setting value."
}
```

---

# Database Tables

```
settings

users

activity_logs
```

---

# Index Recommendation

```
key

category

is_public
```

---

# Activity Log

Catat aktivitas berikut:

- View Settings
- Update Setting
- Reset Settings
- Import Settings
- Export Settings

---

# Security Guidelines

- Hanya Admin yang memiliki akses.
- Seluruh perubahan dicatat pada Activity Log.
- Konfigurasi sensitif tidak boleh dikirim ke frontend.
- Import hanya menerima file yang telah divalidasi.
- Perubahan konfigurasi harus menggunakan Database Transaction.

---

# Related Documentation

- docs/PRD.md
- docs/FLOW.md
- docs/VALIDATION.md
- docs/PERMISSIONS.md
- docs/ERRORS.md
- docs/AUTH.md
- docs/api/auth.md
- docs/api/dashboard.md
- docs/api/borrowings.md
- docs/api/fines.md

---

# Definition of Done

Implementasi Settings API dianggap selesai apabila:

- Seluruh konfigurasi dapat dikelola melalui Dashboard Admin.
- Pengaturan dikelompokkan berdasarkan kategori.
- Borrowing, Fine, Notification, dan Security mengikuti konfigurasi sistem.
- Import dan Export konfigurasi berfungsi.
- Validasi menggunakan Zod.
- Authorization mengikuti `PERMISSIONS.md`.
- Response mengikuti `ERRORS.md`.
- Activity Log tercatat.
- Database Transaction digunakan saat memperbarui banyak konfigurasi.
- Seluruh implementasi konsisten dengan dokumentasi proyek.