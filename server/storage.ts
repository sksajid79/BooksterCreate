import type { User, InsertUser, Book, InsertBook, Chapter, InsertChapter, BookProgress, InsertBookProgress, Subscription, InsertSubscription, AdminConfig, InsertAdminConfig, CreditUsage, InsertCreditUsage, UpdateUserData } from "@shared/schema";
import { db } from "./db";
import { users, books, chapters, bookProgress, subscriptions, adminConfigs, creditUsage } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: UpdateUserData): Promise<User | undefined>;
  validatePassword(password: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;

  // Book methods
  createBook(book: InsertBook): Promise<Book>;
  getBook(id: string): Promise<Book | undefined>;
  getUserBooks(userId: string): Promise<Book[]>;
  updateBook(id: string, updates: Partial<Book>): Promise<Book | undefined>;
  deleteBook(id: string): Promise<boolean>;

  // Chapter methods
  createChapter(chapter: InsertChapter): Promise<Chapter>;
  getBookChapters(bookId: string): Promise<Chapter[]>;
  updateChapter(id: string, updates: Partial<Chapter>): Promise<Chapter | undefined>;
  deleteChapter(id: string): Promise<boolean>;

  // Progress methods
  saveProgress(progress: InsertBookProgress): Promise<BookProgress>;
  getBookProgress(bookId: string): Promise<BookProgress[]>;
  updateProgress(bookId: string, stepName: string, updates: Partial<BookProgress>): Promise<BookProgress | undefined>;

  // Subscription methods
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  updateSubscription(userId: string, updates: Partial<Subscription>): Promise<Subscription | undefined>;

  // Admin config methods
  getAdminConfig(key: string): Promise<AdminConfig | undefined>;
  setAdminConfig(config: InsertAdminConfig): Promise<AdminConfig>;
  getAllAdminConfigs(): Promise<AdminConfig[]>;

  // Credit usage methods
  logCreditUsage(usage: InsertCreditUsage): Promise<CreditUsage>;
  getUserCreditUsage(userId: string): Promise<CreditUsage[]>;
  deductCredits(userId: string, amount: number, action: string, bookId?: string): Promise<boolean>;
  resetMonthlyCredits(userId: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = await this.hashPassword(insertUser.password);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
        creditsResetDate: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: UpdateUserData): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Book methods
  async createBook(insertBook: InsertBook): Promise<Book> {
    const [book] = await db
      .insert(books)
      .values(insertBook as any)
      .returning();
    return book;
  }

  async getBook(id: string): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book || undefined;
  }

  async getUserBooks(userId: string): Promise<Book[]> {
    return await db.select().from(books).where(eq(books.userId, userId));
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<Book | undefined> {
    const [book] = await db
      .update(books)
      .set(updates)
      .where(eq(books.id, id))
      .returning();
    return book || undefined;
  }

  async deleteBook(id: string): Promise<boolean> {
    const result = await db.delete(books).where(eq(books.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Chapter methods
  async createChapter(insertChapter: InsertChapter): Promise<Chapter> {
    const [chapter] = await db
      .insert(chapters)
      .values(insertChapter)
      .returning();
    return chapter;
  }

  async getBookChapters(bookId: string): Promise<Chapter[]> {
    return await db
      .select()
      .from(chapters)
      .where(eq(chapters.bookId, bookId))
      .orderBy(chapters.chapterNumber);
  }

  async updateChapter(id: string, updates: Partial<Chapter>): Promise<Chapter | undefined> {
    const [chapter] = await db
      .update(chapters)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(chapters.id, id))
      .returning();
    return chapter || undefined;
  }

  async deleteChapter(id: string): Promise<boolean> {
    const result = await db.delete(chapters).where(eq(chapters.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Progress methods
  async saveProgress(insertProgress: InsertBookProgress): Promise<BookProgress> {
    // First try to update existing progress for this step
    const [existing] = await db
      .select()
      .from(bookProgress)
      .where(
        and(
          eq(bookProgress.bookId, insertProgress.bookId),
          eq(bookProgress.stepName, insertProgress.stepName)
        )
      );

    if (existing) {
      const [progress] = await db
        .update(bookProgress)
        .set({
          ...insertProgress,
          updatedAt: new Date(),
        })
        .where(eq(bookProgress.id, existing.id))
        .returning();
      return progress;
    } else {
      const [progress] = await db
        .insert(bookProgress)
        .values({
          ...insertProgress,
          updatedAt: new Date(),
        })
        .returning();
      return progress;
    }
  }

  async getBookProgress(bookId: string): Promise<BookProgress[]> {
    return await db
      .select()
      .from(bookProgress)
      .where(eq(bookProgress.bookId, bookId))
      .orderBy(bookProgress.createdAt);
  }

  async updateProgress(bookId: string, stepName: string, updates: Partial<BookProgress>): Promise<BookProgress | undefined> {
    const [progress] = await db
      .update(bookProgress)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bookProgress.bookId, bookId),
          eq(bookProgress.stepName, stepName)
        )
      )
      .returning();
    return progress || undefined;
  }

  // Subscription methods
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
    return subscription || undefined;
  }

  async updateSubscription(userId: string, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId))
      .returning();
    return subscription || undefined;
  }

  // Admin config methods
  async getAdminConfig(key: string): Promise<AdminConfig | undefined> {
    const [config] = await db
      .select()
      .from(adminConfigs)
      .where(eq(adminConfigs.configKey, key));
    return config || undefined;
  }

  async setAdminConfig(insertConfig: InsertAdminConfig): Promise<AdminConfig> {
    // Try to update existing config first
    const existing = await this.getAdminConfig(insertConfig.configKey);
    
    if (existing) {
      const [config] = await db
        .update(adminConfigs)
        .set({
          ...insertConfig,
          updatedAt: new Date(),
        })
        .where(eq(adminConfigs.configKey, insertConfig.configKey))
        .returning();
      return config;
    } else {
      const [config] = await db
        .insert(adminConfigs)
        .values(insertConfig)
        .returning();
      return config;
    }
  }

  async getAllAdminConfigs(): Promise<AdminConfig[]> {
    return await db.select().from(adminConfigs).orderBy(adminConfigs.configKey);
  }

  // Credit usage methods
  async logCreditUsage(insertUsage: InsertCreditUsage): Promise<CreditUsage> {
    const [usage] = await db
      .insert(creditUsage)
      .values(insertUsage)
      .returning();
    return usage;
  }

  async getUserCreditUsage(userId: string): Promise<CreditUsage[]> {
    return await db
      .select()
      .from(creditUsage)
      .where(eq(creditUsage.userId, userId))
      .orderBy(desc(creditUsage.createdAt));
  }

  async deductCredits(userId: string, amount: number, action: string, bookId?: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user || user.credits < amount) {
      return false;
    }

    // Deduct credits from user
    await db
      .update(users)
      .set({ 
        credits: user.credits - amount,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Log the usage
    await this.logCreditUsage({
      userId,
      action,
      creditsUsed: amount,
      bookId,
      metadata: { remainingCredits: user.credits - amount },
    });

    return true;
  }

  async resetMonthlyCredits(userId: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    let newCredits = 1; // Default for free users
    if (user.role === "subscribed") {
      newCredits = 10; // Monthly credits for subscribed users
    } else if (user.role === "admin") {
      newCredits = 999; // Unlimited credits for admin
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        credits: newCredits,
        creditsResetDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser || undefined;
  }
}

export const storage = new DatabaseStorage();
