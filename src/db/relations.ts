import { relations } from 'drizzle-orm';
import {
  auditLogs,
  authors,
  bookInventories,
  bookSources,
  borrowings,
  borrowingDetails,
  books,
  categories,
  fines,
  members,
  publishers,
  returns,
  roles,
  shelves,
  users,
} from './schema';

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  member: one(members, {
    fields: [users.id],
    references: [members.userId],
  }),
  auditLogs: many(auditLogs),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  borrowings: many(borrowings),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  books: many(books),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
  books: many(books),
}));

export const publishersRelations = relations(publishers, ({ many }) => ({
  books: many(books),
}));

export const shelvesRelations = relations(shelves, ({ many }) => ({
  inventories: many(bookInventories),
}));

export const bookSourcesRelations = relations(bookSources, ({ many }) => ({
  inventories: many(bookInventories),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  author: one(authors, {
    fields: [books.authorId],
    references: [authors.id],
  }),
  publisher: one(publishers, {
    fields: [books.publisherId],
    references: [publishers.id],
  }),
  category: one(categories, {
    fields: [books.categoryId],
    references: [categories.id],
  }),
  inventories: many(bookInventories),
}));

export const bookInventoriesRelations = relations(bookInventories, ({ one, many }) => ({
  book: one(books, {
    fields: [bookInventories.bookId],
    references: [books.id],
  }),
  source: one(bookSources, {
    fields: [bookInventories.sourceId],
    references: [bookSources.id],
  }),
  shelf: one(shelves, {
    fields: [bookInventories.shelfId],
    references: [shelves.id],
  }),
  borrowingDetails: many(borrowingDetails),
}));

export const borrowingsRelations = relations(borrowings, ({ one, many }) => ({
  member: one(members, {
    fields: [borrowings.memberId],
    references: [members.id],
  }),
  details: many(borrowingDetails),
  returns: many(returns),
  fine: one(fines, {
    fields: [borrowings.id],
    references: [fines.borrowingId],
  }),
}));

export const borrowingDetailsRelations = relations(borrowingDetails, ({ one }) => ({
  borrowing: one(borrowings, {
    fields: [borrowingDetails.borrowingId],
    references: [borrowings.id],
  }),
  inventory: one(bookInventories, {
    fields: [borrowingDetails.bookInventoryId],
    references: [bookInventories.id],
  }),
}));

export const returnsRelations = relations(returns, ({ one }) => ({
  borrowing: one(borrowings, {
    fields: [returns.borrowingId],
    references: [borrowings.id],
  }),
}));

export const finesRelations = relations(fines, ({ one }) => ({
  borrowing: one(borrowings, {
    fields: [fines.borrowingId],
    references: [borrowings.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
