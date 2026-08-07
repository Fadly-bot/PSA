# Naming Convention

## Purpose

Dokumen ini mendefinisikan standar penamaan yang digunakan pada seluruh proyek TBM Semesta Alam.

Tujuan utama:

- Menjaga konsistensi penamaan.
- Mengurangi duplikasi nama.
- Membantu AI Coding Assistant menghasilkan kode yang konsisten.
- Mempermudah maintenance proyek.

Seluruh implementasi harus mengikuti dokumen ini.

---

# General Rules

Gunakan Bahasa Inggris.

Gunakan nama yang jelas.

Hindari singkatan yang tidak umum.

Contoh:

✅ bookInventory

❌ bkInv

---

# File Naming

Semua file menggunakan:

kebab-case

Contoh

```
book-inventory-form.tsx

book-card.tsx

member-table.tsx

borrow-form.tsx
```

---

# Folder Naming

Gunakan:

kebab-case

```
components/

books/

book-inventories/

book-sources/

borrowings/

reports/
```

---

# Database Tables

Gunakan:

snake_case

Plural

| Table | Description |
|--------|-------------|
| users | Users |
| roles | Roles |
| members | Members |
| books | Book metadata |
| book_inventories | Physical book copies |
| book_sources | Acquisition sources |
| categories | Categories |
| authors | Authors |
| publishers | Publishers |
| shelves | Shelves |
| borrowings | Borrowing headers |
| borrowing_details | Borrowing items |
| returns | Return headers |
| return_details | Return items |
| fines | Fines |
| activity_logs | Activity logs |

---

# Database Columns

Gunakan:

snake_case

Contoh

```
book_id

source_id

inventory_code

created_at

updated_at

deleted_at
```

---

# Primary Key

Seluruh tabel menggunakan

```
id
```

---

# Foreign Key

Gunakan format

```
table_id
```

Contoh

```
book_id

author_id

category_id

member_id

publisher_id

shelf_id

source_id
```

---

# Enum Naming

Gunakan:

PascalCase

Nama Enum

```
BookStatus

InventoryStatus

BookCondition

BorrowStatus

UserRole
```

---

# Enum Values

Gunakan:

snake_case

Contoh

```
available

borrowed

maintenance

lost

good

light_damage

heavy_damage
```

---

# Drizzle Schema

Gunakan:

camelCase

Contoh

```
bookInventories

bookSources

borrowingDetails
```

---

# Model Naming

Gunakan:

PascalCase

```
Book

BookInventory

BookSource

Category

Author

Publisher

Shelf

Borrowing

BorrowingDetail

Member

User
```

---

# Variable Naming

Gunakan:

camelCase

Contoh

```
book

books

bookInventory

bookInventories

bookSource

bookSources

member

members
```

---

# Constant Naming

Gunakan:

UPPER_SNAKE_CASE

```
MAX_FILE_SIZE

DEFAULT_PAGE_SIZE

MAX_BORROW_LIMIT

DEFAULT_LANGUAGE
```

---

# Function Naming

Gunakan:

camelCase

Diawali kata kerja.

Contoh

```
createBook

updateBook

deleteBook

restoreBook

createBookInventory

updateBookInventory

deleteBookInventory

createBookSource

updateBookSource

deleteBookSource

borrowBook

returnBook

calculateFine

exportBooks

exportBorrowings
```

---

# Server Action Naming

Gunakan pola

```
create<Entity>

update<Entity>

delete<Entity>

restore<Entity>

get<Entity>

get<EntityPlural>

search<Entity>

export<Entity>
```

Contoh

```
createBook()

getBooks()

searchBooks()

createBookInventory()

searchBookInventory()

exportBooks()
```

---

# React Component Naming

Gunakan:

PascalCase

```
BookCard

BookTable

BookForm

BookInventoryTable

BookInventoryForm

BookSourceForm

MemberTable

BorrowTable

DashboardCard
```

---

# React Hooks

Gunakan prefix

```
use
```

Contoh

```
useBooks

useMembers

useBorrowings

useDashboard
```

---

# Type Naming

Gunakan:

PascalCase

```
Book

BookForm

BookInventory

BookInventoryForm

BorrowForm

MemberForm
```

---

# Interface Naming

Gunakan

```
interface Book

interface BookInventory

interface Borrowing
```

Jangan menggunakan prefix

```
IBook
```

---

# Zod Schema Naming

Gunakan suffix

```
Schema
```

Contoh

```
bookSchema

bookInventorySchema

memberSchema

borrowSchema
```

---

# Validation File Naming

Gunakan

```
book.validator.ts

member.validator.ts

borrow.validator.ts
```

---

# Service Naming

Gunakan suffix

```
Service
```

Contoh

```
BookService

InventoryService

BorrowService
```

---

# Utility Naming

Gunakan nama yang menjelaskan fungsi.

```
formatDate

generateInventoryCode

slugify

calculateFine
```

---

# API Route Naming

Gunakan:

Plural

```
/api/books

/api/book-inventories

/api/book-sources

/api/members

/api/borrowings
```

---

# URL Slug

Gunakan:

kebab-case

```
atomic-habits

clean-code

rich-dad-poor-dad
```

---

# Storage Bucket

Gunakan:

kebab-case

```
book-covers

profile-images

exports
```

---

# Environment Variable

Gunakan:

UPPER_SNAKE_CASE

```
DATABASE_URL

BETTER_AUTH_SECRET

SUPABASE_URL

SUPABASE_ANON_KEY

NEXT_PUBLIC_APP_URL
```

---

# Git Branch Naming

Gunakan format

```
feature/books

feature/book-inventories

feature/book-sources

feature/borrowings

bugfix/login

hotfix/export
```

---

# Commit Convention

Gunakan Conventional Commits.

```
feat:

fix:

refactor:

docs:

style:

test:

chore:
```

Contoh

```
feat: add book inventory management

fix: inventory search bug

docs: update database documentation

refactor: simplify borrowing flow
```

---

# Reserved Terms

Gunakan istilah berikut secara konsisten.

| Gunakan | Jangan gunakan |
|----------|----------------|
| Book | LibraryBook |
| BookInventory | InventoryBook |
| BookSource | SourceBook |
| Borrowing | Loan |
| Member | Student |
| Shelf | Rack |
| Category | BookCategory |
| Author | Writer |
| Publisher | Publishing |
| CoverImage | Thumbnail |

---

# AI Rules

AI Coding Assistant harus:

- Mengikuti seluruh aturan pada dokumen ini.
- Tidak membuat variasi nama baru.
- Tidak menggunakan sinonim untuk entity yang sudah ditentukan.
- Tidak mengubah nama tabel, field, route, atau komponen tanpa perubahan dokumentasi terlebih dahulu.
- Menggunakan penamaan yang konsisten di seluruh proyek.

---

# Related Documentation

- docs/ARCHITECTURE.md
- docs/DATABASE.md
- docs/SCHEMA.md
- docs/CODING_STANDARDS.md
- docs/API/
- docs/VALIDATION.md

---

# Definition of Done

Standar penamaan dianggap terpenuhi apabila:

- Seluruh tabel mengikuti `snake_case`.
- Seluruh model mengikuti `PascalCase`.
- Seluruh variabel mengikuti `camelCase`.
- Seluruh API menggunakan format yang konsisten.
- Seluruh komponen React mengikuti `PascalCase`.
- Tidak ada dua istilah berbeda untuk entity yang sama.
- AI Coding Assistant dapat menghasilkan kode tanpa inkonsistensi penamaan.