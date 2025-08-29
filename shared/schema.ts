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
  role: text("role").default("free").notNull(), // admin, free, subscribed
  credits: integer("credits").default(1).notNull(), // free: 1, subscribed: 10 per month
  creditsResetDate: timestamp("credits_reset_date"),
  isActive: boolean("is_active").default(true).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  status: text("status").default("active").notNull(), // active, cancelled, expired
  priceId: text("price_id"), // Stripe price ID
  subscriptionId: text("subscription_id"), // External subscription ID
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions table for authentication
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Admin configurations for AI prompts
export const adminConfigs = pgTable("admin_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  configKey: text("config_key").notNull().unique(),
  configValue: jsonb("config_value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Credit usage tracking
export const creditUsage = pgTable("credit_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // generate_chapters, export_book, etc.
  creditsUsed: integer("credits_used").default(1).notNull(),
  bookId: varchar("book_id").references(() => books.id),
  metadata: jsonb("metadata"), // Additional context
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

export const creditUsageRelations = relations(creditUsage, ({ one }) => ({
  user: one(users, {
    fields: [creditUsage.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [creditUsage.bookId],
    references: [books.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
  updatedAt: true,
});

export const insertAdminConfigSchema = createInsertSchema(adminConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCreditUsageSchema = createInsertSchema(creditUsage).omit({
  id: true,
  createdAt: true,
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const signupSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "free", "subscribed"]).optional(),
  credits: z.number().int().min(0).optional(),
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
export type AdminConfig = typeof adminConfigs.$inferSelect;
export type InsertAdminConfig = z.infer<typeof insertAdminConfigSchema>;
export type CreditUsage = typeof creditUsage.$inferSelect;
export type InsertCreditUsage = z.infer<typeof insertCreditUsageSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
