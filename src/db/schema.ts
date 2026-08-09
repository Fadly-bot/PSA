import { boolean, date, integer, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);
export const bookStatusEnum = pgEnum('book_status', ['active', 'inactive']);
export const inventoryStatusEnum = pgEnum('inventory_status', ['available', 'borrowed', 'maintenance', 'lost']);
export const bookConditionEnum = pgEnum('book_condition', ['good', 'damaged', 'lost']);
export const borrowStatusEnum = pgEnum('borrow_status', ['borrowed', 'returned', 'overdue', 'cancelled']);
export const fineStatusEnum = pgEnum('fine_status', ['unpaid', 'paid']);

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'restrict' }),
  name: varchar('name', { length: 150 }).notNull(),
  email: varchar('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  // Password hashes are stored by Better Auth in `accounts.password`.
  // This column is kept for compatibility and is nullable (Better Auth
  // does not write to it).
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  status: userStatusEnum('status').notNull().default('active'),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'restrict' }),
  memberCode: varchar('member_code').notNull().unique(),
  phone: varchar('phone'),
  address: text('address'),
  birthDate: date('birth_date'),
  joinDate: date('join_date').notNull(),
  status: boolean('status').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const authors = pgTable('authors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  biography: text('biography'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const publishers = pgTable('publishers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  address: text('address'),
  email: varchar('email'),
  phone: varchar('phone'),
  website: text('website'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const shelves = pgTable('shelves', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code').notNull().unique(),
  name: varchar('name').notNull(),
  floor: integer('floor'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bookSources = pgTable('book_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const books = pgTable('books', {
  id: uuid('id').primaryKey().defaultRandom(),
  isbn: varchar('isbn').notNull().unique(),
  title: varchar('title').notNull(),
  slug: varchar('slug').notNull().unique(),
  description: text('description'),
  synopsis: text('synopsis'),
  coverImage: text('cover_image'),
  authorId: uuid('author_id').references(() => authors.id, { onDelete: 'restrict' }),
  publisherId: uuid('publisher_id').references(() => publishers.id, { onDelete: 'restrict' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'restrict' }),
  publicationYear: integer('publication_year'),
  language: varchar('language'),
  pages: integer('pages'),
  status: bookStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const bookInventories = pgTable('book_inventories', {
  id: uuid('id').primaryKey().defaultRandom(),
  inventoryCode: varchar('inventory_code').notNull().unique(),
  bookId: uuid('book_id').notNull().references(() => books.id, { onDelete: 'restrict' }),
  sourceId: uuid('source_id').notNull().references(() => bookSources.id, { onDelete: 'restrict' }),
  shelfId: uuid('shelf_id').references(() => shelves.id, { onDelete: 'restrict' }),
  condition: bookConditionEnum('condition').notNull().default('good'),
  status: inventoryStatusEnum('status').notNull().default('available'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const borrowings = pgTable('borrowings', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => members.id, { onDelete: 'restrict' }),
  borrowCode: varchar('borrow_code').notNull().unique(),
  borrowDate: date('borrow_date').notNull(),
  dueDate: date('due_date').notNull(),
  returnDate: date('return_date'),
  status: borrowStatusEnum('status').notNull().default('borrowed'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const borrowingDetails = pgTable('borrowing_details', {
  id: uuid('id').primaryKey().defaultRandom(),
  borrowingId: uuid('borrowing_id').notNull().references(() => borrowings.id, { onDelete: 'restrict' }),
  bookInventoryId: uuid('book_inventory_id').notNull().references(() => bookInventories.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const returns = pgTable('returns', {
  id: uuid('id').primaryKey().defaultRandom(),
  borrowingId: uuid('borrowing_id').notNull().references(() => borrowings.id, { onDelete: 'restrict' }),
  returnDate: date('return_date').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('returned'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const fines = pgTable('fines', {
  id: uuid('id').primaryKey().defaultRandom(),
  borrowingId: uuid('borrowing_id').notNull().unique().references(() => borrowings.id, { onDelete: 'restrict' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull().default('0'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  status: fineStatusEnum('status').notNull().default('unpaid'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key').notNull().unique(),
  category: varchar('category', { length: 50 }).notNull().default('general'),
  value: text('value'),
  description: text('description'),
  isPublic: boolean('is_public').notNull().default(false),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'restrict' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'restrict' }),
  action: varchar('action').notNull(),
  module: varchar('module').notNull(),
  description: text('description'),
  ipAddress: varchar('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Better Auth — `session` model.
 * Columns are snake_case so they map to Better Auth's default field mapping
 * (id, user_id, token, expires_at, ip_address, user_agent, created_at, updated_at).
 * `generateId: 'uuid'` is configured in `src/server/auth.ts`, so `id` is a UUID.
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Better Auth — `account` model (OAuth providers + email/password credential).
 * No `secret` column: Better Auth 1.6.x stores provider credentials in
 * access/refresh/id_token directly (matches the core account schema).
 */
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Better Auth — `verification` model (email verification + password reset tokens).
 */
export const verifications = pgTable('verifications', {
  id: uuid('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});


