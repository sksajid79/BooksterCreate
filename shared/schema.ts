import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const books = pgTable("books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Step 1: Method
  creationMethod: text("creation_method"), // 'ai-generated', 'outline-based', etc.
  
  // Step 2: Details
  title: text("title"),
  subtitle: text("subtitle"),
  author: text("author"),
  description: text("description"),
  targetAudience: text("target_audience"),
  toneStyle: text("tone_style"),
  mission: text("mission"),
  language: text("language").default("English (EN)"),
  htmlDescription: text("html_description"),
  keywords: jsonb("keywords").$type<string[]>().default([]),
  
  // Step 4: Template
  selectedTemplate: text("selected_template").default("original"),
  
  // Step 5: Cover
  coverImageUrl: text("cover_image_url"),
  
  // Progress tracking
  currentStep: integer("current_step").default(1).notNull(),
  status: text("status").default("draft").notNull(), // draft, generating, completed, published
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chapters = pgTable("chapters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: varchar("book_id").references(() => books.id, { onDelete: "cascade" }).notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isExpanded: boolean("is_expanded").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookProgress = pgTable("book_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: varchar("book_id").references(() => books.id, { onDelete: "cascade" }).notNull(),
  stepName: text("step_name").notNull(), // 'method', 'details', 'chapters', 'template', 'cover', 'export'
  stepData: jsonb("step_data").$type<Record<string, any>>(),
  completedAt: timestamp("completed_at"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  plan: text("plan").notNull(), // lite, pro, agency
  credits: integer("credits").default(0).notNull(),
  isActive: text("is_active").default("true").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  books: many(books),
  subscriptions: many(subscriptions),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  user: one(users, {
    fields: [books.userId],
    references: [users.id],
  }),
  chapters: many(chapters),
  progress: many(bookProgress),
}));

export const chaptersRelations = relations(chapters, ({ one }) => ({
  book: one(books, {
    fields: [chapters.bookId],
    references: [books.id],
  }),
}));

export const bookProgressRelations = relations(bookProgress, ({ one }) => ({
  book: one(books, {
    fields: [bookProgress.bookId],
    references: [books.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookProgressSchema = createInsertSchema(bookProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type BookProgress = typeof bookProgress.$inferSelect;
export type InsertBookProgress = z.infer<typeof insertBookProgressSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
