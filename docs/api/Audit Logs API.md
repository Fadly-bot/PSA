# Audit Logs API

## Purpose

Dokumen ini mendefinisikan seluruh Server Actions, Business Rules, Authorization, Validation, dan API yang berkaitan dengan **Audit Logs** pada aplikasi TBM Semesta Alam.

Audit Log digunakan untuk mencatat seluruh aktivitas penting yang terjadi di dalam sistem sebagai bagian dari **keamanan, pelacakan aktivitas (traceability), debugging, dan kepatuhan (audit trail)**.

Berbeda dengan sistem operasional biasa, Audit Log bersifat **immutable (tidak dapat diubah)** dan hanya dapat dilihat oleh Administrator.

Dokumen ini menjadi acuan implementasi untuk:

- Security Audit
- System Monitoring
- Compliance
- Incident Investigation
- AI Coding Assistant

---

# Module Overview

Entity utama

```
AuditLog
```

Audit Log mencatat seluruh aktivitas penting seperti:

- Login
- Logout
- CRUD Data
- Borrow Book
- Return Book
- Fine Payment
- Role Change
- Permission Change
- Settings Update
- Import
- Export
- Failed Login
- System Error

---

# Authorization

| Action | Guest | Member | Staff | Admin |
|----------|:----:|:------:|:-----:|:-----:|
| View Audit Logs | ❌ | ❌ | ❌ | ✅ |
| Search Audit Logs | ❌ | ❌ | ❌ | ✅ |
| Export Audit Logs | ❌ | ❌ | ❌ | ✅ |
| Delete Audit Logs | ❌ | ❌ | ❌ | ❌ |
| Update Audit Logs | ❌ | ❌ | ❌ | ❌ |

Audit Log **tidak boleh diubah maupun dihapus**.

---

# Module Overview Flow

```
User Action

↓

Server Action

↓

Database Transaction

↓

Create Audit Log

↓

Commit
```

---

# Entity

AuditLog

```
id

userId

action

module

entity

entityId

description

oldValue

newValue

ipAddress

userAgent

requestMethod

requestPath

status

createdAt
```

---

# Relationships

```
User

↓

AuditLog
```

Satu User

↓

Memiliki banyak Audit Logs

---

# Action Types

```
LOGIN

LOGOUT

CREATE

UPDATE

DELETE

RESTORE

BORROW

RETURN

PAY_FINE

WAIVE_FINE

EXPORT

IMPORT

CHANGE_ROLE

UPDATE_SETTING

FAILED_LOGIN

SYSTEM_ERROR
```

---

# Modules

```
AUTH

BOOKS

BOOK_INVENTORIES

BOOK_SOURCES

MEMBERS

BORROWINGS

RETURNS

FINES

REPORTS

SETTINGS

USERS

DASHBOARD
```

---

# Log Status

```
SUCCESS

FAILED
```

---

# Server Actions

## getAuditLogs()

Mengambil seluruh Audit Log.

Features

- Pagination
- Search
- Sorting
- Filtering

---

## getAuditLogById()

Mengambil detail Audit Log.

---

## searchAuditLogs()

Parameter

```
q
```

Mencari berdasarkan

- User
- Module
- Action
- Entity
- Entity ID

---

## exportAuditLogs()

Format

- Excel
- PDF
- JSON

---

# Internal Helper

## createAuditLog()

Digunakan oleh seluruh Server Actions.

Input

```ts
{
  userId: string
  action: string
  module: string
  entity: string
  entityId: string
  description: string
  oldValue?: object
  newValue?: object
  ipAddress?: string
  userAgent?: string
  requestMethod?: string
  requestPath?: string
  status: "SUCCESS" | "FAILED"
}
```

Tidak dipanggil langsung dari UI.

---

# Route Handlers

```
GET

/api/audit-logs

GET

/api/audit-logs/:id

POST

/api/audit-logs/export
```

Tidak tersedia endpoint

```
POST

PATCH

DELETE
```

karena Audit Log tidak boleh dimodifikasi.

---

# Validation Rules

## User

Harus merupakan User yang valid.

---

## Action

Harus salah satu

```
LOGIN

LOGOUT

CREATE

UPDATE

DELETE

RESTORE

BORROW

RETURN

PAY_FINE

WAIVE_FINE

EXPORT

IMPORT

CHANGE_ROLE

UPDATE_SETTING

FAILED_LOGIN

SYSTEM_ERROR
```

---

## Module

Harus salah satu

```
AUTH

BOOKS

BOOK_INVENTORIES

BOOK_SOURCES

MEMBERS

BORROWINGS

RETURNS

FINES

REPORTS

SETTINGS

USERS

DASHBOARD
```

---

## Status

```
SUCCESS

FAILED
```

---

# Business Rules

- Audit Log dibuat otomatis.
- Audit Log tidak boleh diedit.
- Audit Log tidak boleh dihapus.
- Audit Log hanya dapat dibaca oleh Admin.
- Seluruh transaksi penting wajib membuat Audit Log.
- Audit Log tetap dibuat walaupun transaksi gagal.
- oldValue dan newValue disimpan dalam format JSON.
- Data sensitif seperti password, token, dan secret tidak boleh disimpan.

---

# Search

Admin

Berdasarkan

```
User Name

Email

Module

Action

Entity

Entity ID
```

---

# Sorting

```
Created At

Action

Module

Status
```

---

# Filtering

```
Module

Action

Status

User

Date Range
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
- JSON

Kolom

```
Date

User

Module

Action

Entity

Entity ID

Description

Status

IP Address
```

---

# Error Codes

| Code | Description |
|------|-------------|
| AUDIT_LOG_NOT_FOUND | Audit Log tidak ditemukan |
| INVALID_ACTION | Action tidak valid |
| INVALID_MODULE | Module tidak valid |
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
  code: "PERMISSION_DENIED",
  message: "You do not have permission to access audit logs."
}
```

---

# Database Tables

```
audit_logs

users
```

---

# Index Recommendation

```
user_id

module

action

status

entity

entity_id

created_at
```

---

# Activity Coverage

Audit Log harus dibuat untuk aktivitas berikut:

## Authentication

- Login
- Logout
- Failed Login
- Password Change

## Books

- Create Book
- Update Book
- Delete Book

## Book Inventories

- Create Inventory
- Update Inventory
- Delete Inventory
- Restore Inventory

## Book Sources

- Create Source
- Update Source
- Delete Source

## Members

- Register Member
- Update Member
- Delete Member

## Borrowings

- Borrow Book
- Cancel Borrowing
- Extend Borrowing

## Returns

- Return Book

## Fines

- Generate Fine
- Pay Fine
- Waive Fine

## Reports

- Export PDF
- Export Excel

## Settings

- Update Setting
- Reset Setting

## Users

- Create User
- Change Role
- Delete User

---

# Performance Guidelines

- Gunakan index pada kolom pencarian.
- Simpan oldValue dan newValue sebagai JSONB (PostgreSQL).
- Gunakan pagination untuk dataset besar.
- Audit Log tidak boleh di-soft delete.
- Gunakan partitioning bila jumlah log sangat besar.

---

# Security Guidelines

- Password tidak boleh dicatat.
- Token JWT tidak boleh dicatat.
- Refresh Token tidak boleh dicatat.
- Secret Key tidak boleh dicatat.
- Gunakan masking untuk data sensitif bila diperlukan.
- Audit Log hanya dapat diakses oleh Admin.

---

# Related Documentation

- docs/PRD.md
- docs/DATABASE.md
- docs/SCHEMA.md
- docs/FLOW.md
- docs/PERMISSIONS.md
- docs/ERRORS.md
- docs/AUTH.md
- docs/api/auth.md
- docs/api/users.md
- docs/api/settings.md
- docs/api/borrowings.md
- docs/api/returns.md
- docs/api/fines.md

---

# Definition of Done

Implementasi Audit Logs API dianggap selesai apabila:

- Audit Log dibuat otomatis pada seluruh transaksi penting.
- Audit Log bersifat immutable (tidak dapat diubah atau dihapus).
- Hanya Admin yang dapat mengakses Audit Log.
- Seluruh informasi penting (action, module, entity, user, status, timestamp) tercatat.
- oldValue dan newValue disimpan untuk operasi perubahan data.
- Data sensitif tidak pernah dicatat.
- Search, Filtering, Sorting, Pagination, dan Export berfungsi.
- Response mengikuti `ERRORS.md`.
- Authorization mengikuti `PERMISSIONS.md`.
- Seluruh implementasi konsisten dengan dokumentasi proyek.