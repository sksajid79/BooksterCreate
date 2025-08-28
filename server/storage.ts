import type { User, InsertUser, Book, InsertBook, Chapter, InsertChapter, BookProgress, InsertBookProgress, Subscription, InsertSubscription } from "@shared/schema";
import { db } from "./db";
import { users, books, chapters, bookProgress, subscriptions } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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
      .where(eq(subscriptions.userId, userId));
    return subscription || undefined;
  }
}

export const storage = new DatabaseStorage();
