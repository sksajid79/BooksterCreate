import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChapters, regenerateChapter } from "./anthropic.js";
import { exportToPDF, exportToHTML, exportToMarkdown, exportToEPUB, exportToDOCX } from "./exportGenerator.js";
import { insertBookSchema, insertChapterSchema, insertBookProgressSchema, loginSchema, signupSchema, Chapter } from "@shared/schema";
import { z } from "zod";
import { authenticateToken, requireAdmin, requireCredits, generateToken, type AuthRequest } from "./auth";
import { db, testDatabaseConnection } from "./db";
import { users } from "@shared/schema";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enhanced health check endpoint for deployment verification
  app.get("/api/health", async (req, res) => {
    const startTime = Date.now();
    const healthCheck: {
      status: "ok" | "degraded" | "error";
      timestamp: string;
      uptime: number;
      environment: string;
      database: {
        status: "unknown" | "healthy" | "unhealthy" | "error";
        responseTime: number;
      };
      services: {
        server: string;
      };
      responseTime?: number;
      error?: string;
    } = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: {
        status: "unknown",
        responseTime: 0
      },
      services: {
        server: "healthy"
      }
    };

    try {
      // Test database connection
      const dbStartTime = Date.now();
      const isDbHealthy = await testDatabaseConnection();
      const dbResponseTime = Date.now() - dbStartTime;
      
      healthCheck.database = {
        status: isDbHealthy ? "healthy" : "unhealthy",
        responseTime: dbResponseTime
      };

      if (!isDbHealthy) {
        healthCheck.status = "degraded";
        return res.status(503).json(healthCheck);
      }

      // Add response time to overall health check
      healthCheck.responseTime = Date.now() - startTime;
      
      res.json(healthCheck);
    } catch (error) {
      console.error("Health check failed:", error);
      
      healthCheck.status = "error";
      healthCheck.database.status = "error";
      healthCheck.error = error instanceof Error ? error.message : "Unknown error";
      
      res.status(503).json(healthCheck);
    }
  });

  // Simple health check endpoint for basic deployment verification
  app.get("/api/ping", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      message: "Server is running"
    });
  });

  // Health check endpoint with more details for monitoring
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0",
      services: {
        database: "connected",
        anthropic: process.env.ANTHROPIC_API_KEY ? "configured" : "not_configured"
      }
    });
  });

  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password } = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }
      
      // Create new user
      const user = await storage.createUser({
        username,
        email,
        password,
        role: "free",
        credits: 1,
      });
      
      const token = generateToken(user.id);
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Signup failed",
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const validPassword = await storage.validatePassword(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      if (!user.isActive) {
        return res.status(401).json({ error: "Account is deactivated" });
      }
      
      const token = generateToken(user.id);
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Login failed",
      });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Get fresh user data
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user data" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, (req: AuthRequest, res) => {
    // For JWT, logout is handled client-side by removing the token
    res.json({ message: "Logged out successfully" });
  });

  // Admin routes
  app.get("/api/admin/configs", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const configs = await storage.getAllAdminConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Admin configs fetch error:", error);
      res.status(500).json({ error: "Failed to fetch admin configurations" });
    }
  });

  app.post("/api/admin/configs", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const configData = req.body;
      const config = await storage.setAdminConfig(configData);
      res.json(config);
    } catch (error) {
      console.error("Admin config save error:", error);
      res.status(500).json({ error: "Failed to save admin configuration" });
    }
  });

  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      // Get all users for admin management
      const usersList = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        credits: users.credits,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }).from(users);
      res.json(usersList);
    } catch (error) {
      console.error("Admin users fetch error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Admin user update error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.post("/api/admin/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { username, email, password, role = "free", credits = 1 } = signupSchema.extend({
        role: z.string().optional(),
        credits: z.number().optional(),
      }).parse(req.body);
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }
      
      // Create new user
      const user = await storage.createUser({
        username,
        email,
        password,
        role,
        credits,
      });
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Admin user creation error:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Failed to create user",
      });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      // Prevent admin from deleting themselves
      if (req.user?.id === id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Delete the user
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(500).json({ error: "Failed to delete user" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Admin user deletion error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Book CRUD operations
  app.post("/api/books", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const bookData = insertBookSchema.parse(req.body);
      
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Check credits (admin users have unlimited)
      if (req.user.role !== "admin" && req.user.credits < 1) {
        return res.status(402).json({ 
          error: "Insufficient credits",
          required: 1,
          available: req.user.credits,
        });
      }
      
      // Deduct credit before creating book (unless admin)
      if (req.user.role !== "admin") {
        const creditDeducted = await storage.deductCredits(req.user.id, 1, "create_book");
        if (!creditDeducted) {
          return res.status(402).json({ error: "Failed to deduct credits" });
        }
      }
      
      const book = await storage.createBook({
        ...bookData,
        userId: req.user.id
      });
      
      res.json(book);
    } catch (error) {
      console.error('Book creation error:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to create book" 
      });
    }
  });

  app.get("/api/books/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const book = await storage.getBook(req.params.id);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      // Check if user owns this book or is admin
      if (book.userId !== req.user?.id && req.user?.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get chapters and progress as well
      const [chapters, progress] = await Promise.all([
        storage.getBookChapters(book.id),
        storage.getBookProgress(book.id)
      ]);
      
      res.json({ ...book, chapters, progress });
    } catch (error) {
      console.error('Book fetch error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch book" 
      });
    }
  });

  app.put("/api/books/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Check if user owns this book or is admin
      const existingBook = await storage.getBook(req.params.id);
      if (!existingBook) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      if (existingBook.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updates = req.body;
      const book = await storage.updateBook(req.params.id, updates);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      console.error('Book update error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update book" 
      });
    }
  });

  app.get("/api/users/:userId/books", async (req, res) => {
    try {
      const books = await storage.getUserBooks(req.params.userId);
      res.json(books);
    } catch (error) {
      console.error('User books fetch error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch user books" 
      });
    }
  });

  // Progress tracking
  app.post("/api/books/:bookId/progress", async (req, res) => {
    try {
      const progressData = insertBookProgressSchema.parse({
        ...req.body,
        bookId: req.params.bookId
      });
      const progress = await storage.saveProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error('Progress save error:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to save progress" 
      });
    }
  });

  app.get("/api/books/:bookId/progress", async (req, res) => {
    try {
      const progress = await storage.getBookProgress(req.params.bookId);
      res.json(progress);
    } catch (error) {
      console.error('Progress fetch error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch progress" 
      });
    }
  });

  // Chapter operations
  app.post("/api/books/:bookId/chapters", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Check if user owns the book or is admin
      const book = await storage.getBook(req.params.bookId);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
      }
      
      if (book.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const chapterData = insertChapterSchema.parse({
        ...req.body,
        bookId: req.params.bookId
      });
      const chapter = await storage.createChapter(chapterData);
      res.json(chapter);
    } catch (error) {
      console.error('Chapter creation error:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to create chapter" 
      });
    }
  });

  app.put("/api/chapters/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Get chapter to verify ownership through book
      const chapter = await storage.updateChapter(req.params.id, {});
      if (!chapter) {
        return res.status(404).json({ error: "Chapter not found" });
      }
      
      // Check if user owns the book containing this chapter
      const book = await storage.getBook(chapter.bookId);
      if (!book || (book.userId !== req.user.id && req.user.role !== "admin")) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updates = req.body;
      const updatedChapter = await storage.updateChapter(req.params.id, updates);
      res.json(updatedChapter);
    } catch (error) {
      console.error('Chapter update error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update chapter" 
      });
    }
  });

  app.delete("/api/chapters/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Get chapter to verify ownership through book
      const chapter = await storage.updateChapter(req.params.id, {});
      if (!chapter) {
        return res.status(404).json({ error: "Chapter not found" });
      }
      
      // Check if user owns the book containing this chapter
      const book = await storage.getBook(chapter.bookId);
      if (!book || (book.userId !== req.user.id && req.user.role !== "admin")) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const deleted = await storage.deleteChapter(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Chapter not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Chapter deletion error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to delete chapter" 
      });
    }
  });

  // Generate chapters for a book
  app.post("/api/chapters/generate", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check credits for AI generation (costs 1 credit)
      if (req.user.role !== "admin" && req.user.credits < 1) {
        return res.status(402).json({ 
          error: "Insufficient credits for AI generation",
          required: 1,
          available: req.user.credits,
        });
      }

      const bookDetails = req.body;
      
      if (!bookDetails.title || !bookDetails.description) {
        return res.status(400).json({ 
          error: "Book title and description are required" 
        });
      }

      const chapters = await generateChapters(bookDetails);
      
      // Deduct credit after successful generation (unless admin)
      if (req.user.role !== "admin") {
        await storage.deductCredits(req.user.id, 1, "generate_chapters", bookDetails.bookId);
      }
      
      res.json({ chapters });
    } catch (error) {
      console.error('Chapter generation error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate chapters" 
      });
    }
  });

  // Regenerate a specific chapter
  app.post("/api/chapters/regenerate", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check credits for regeneration (costs 1 credit)
      if (req.user.role !== "admin" && req.user.credits < 1) {
        return res.status(402).json({ 
          error: "Insufficient credits for chapter regeneration",
          required: 1,
          available: req.user.credits,
        });
      }

      const { chapterTitle, bookDetails } = req.body;
      
      if (!chapterTitle || !bookDetails) {
        return res.status(400).json({ 
          error: "Chapter title and book details are required" 
        });
      }

      const content = await regenerateChapter(chapterTitle, bookDetails);
      
      // Deduct credit after successful regeneration (unless admin)
      if (req.user.role !== "admin") {
        await storage.deductCredits(req.user.id, 1, "regenerate_chapter", bookDetails.bookId);
      }
      
      res.json({ content });
    } catch (error) {
      console.error('Chapter regeneration error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to regenerate chapter" 
      });
    }
  });

  // Export book in different formats
  app.post("/api/export/:format", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { format } = req.params;
      const bookData = req.body;
      
      if (!bookData.title || !bookData.chapters || bookData.chapters.length === 0) {
        return res.status(400).json({ 
          error: "Book title and chapters are required for export" 
        });
      }

      // Validate format
      const validFormats = ['pdf', 'epub', 'docx', 'markdown', 'html'];
      if (!validFormats.includes(format.toLowerCase())) {
        return res.status(400).json({ 
          error: "Invalid export format. Supported formats: PDF, EPUB, DOCX, Markdown, HTML" 
        });
      }

      const exportOptions = {
        includeCover: true,
        includeTableOfContents: true,
        includePageNumbers: true
      };

      let fileName: string;
      
      // Generate the actual file based on format
      switch (format.toLowerCase()) {
        case 'pdf':
          fileName = await exportToPDF(bookData, exportOptions);
          break;
        case 'html':
          fileName = await exportToHTML(bookData, exportOptions);
          break;
        case 'markdown':
          fileName = await exportToMarkdown(bookData);
          break;
        case 'epub':
          fileName = await exportToEPUB(bookData, exportOptions);
          break;
        case 'docx':
          fileName = await exportToDOCX(bookData, exportOptions);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      const downloadUrl = `/api/download/${fileName}`;
      
      res.json({ 
        success: true,
        downloadUrl,
        fileName,
        format: format.toUpperCase(),
        message: `${format.toUpperCase()} export completed successfully`
      });
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to export book" 
      });
    }
  });

  // Download exported files
  // Flipbook preview route
  app.post("/flipbook-preview", async (req, res) => {
    try {
      const bookData = JSON.parse(req.body.bookData);
      
      if (!bookData || !bookData.title || !bookData.chapters) {
        return res.status(400).send('<h1>Error: Invalid book data</h1>');
      }

      // Generate HTML content for flipbook preview
      const htmlContent = `
<!DOCTYPE html>
<html lang="${bookData.language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flipbook Preview - ${bookData.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .flipbook-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .flipbook-header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .flipbook-title {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .flipbook-author {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        .flipbook-content {
            padding: 40px;
        }
        .cover-section {
            text-align: center;
            margin-bottom: 40px;
        }
        .cover-image {
            max-width: 300px;
            max-height: 400px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            margin-bottom: 20px;
        }
        .chapter {
            margin-bottom: 40px;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 12px;
            border-left: 4px solid #4facfe;
        }
        .chapter-title {
            font-size: 1.8rem;
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 20px;
        }
        .chapter-content {
            line-height: 1.7;
            color: #4a5568;
        }
        .chapter-content p {
            margin-bottom: 16px;
        }
        .flipbook-note {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
            color: #1565c0;
        }
    </style>
</head>
<body>
    <div class="flipbook-container">
        <div class="flipbook-header">
            <h1 class="flipbook-title">${bookData.title}</h1>
            ${bookData.subtitle ? `<p class="flipbook-subtitle">${bookData.subtitle}</p>` : ''}
            <p class="flipbook-author">by ${bookData.author}</p>
        </div>
        
        <div class="flipbook-content">
            <div class="flipbook-note">
                📖 Interactive Flipbook Preview - This shows how your book will look to readers
            </div>
            
            ${bookData.coverImageUrl ? `
            <div class="cover-section">
                <img src="${bookData.coverImageUrl}" alt="Book Cover" class="cover-image">
                <p><strong>Description:</strong> ${bookData.description}</p>
            </div>
            ` : ''}
            
            ${bookData.chapters.map((chapter: Chapter, index: number) => `
                <div class="chapter">
                    <h2 class="chapter-title">Chapter ${index + 1}: ${chapter.title}</h2>
                    <div class="chapter-content">
                        ${chapter.content ? chapter.content.split('\\n\\n').map((p: string) => `<p>${p.trim()}</p>`).join('') : '<p><em>Chapter content will appear here...</em></p>'}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

      res.send(htmlContent);
    } catch (error) {
      console.error('Flipbook preview error:', error);
      res.status(500).send('<h1>Error: Failed to generate flipbook preview</h1>');
    }
  });

  app.get("/api/download/:fileName", async (req, res) => {
    try {
      const { fileName } = req.params;
      const filePath = path.join(process.cwd(), 'exports', fileName);
      
      // Set appropriate headers for download
      const ext = path.extname(fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.html':
          contentType = 'text/html';
          break;
        case '.md':
          contentType = 'text/markdown';
          break;
        case '.epub':
          contentType = 'application/epub+zip';
          break;
        case '.rtf':
        case '.docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      res.download(filePath, fileName, (error) => {
        if (error) {
          console.error('Download error:', error);
          if (!res.headersSent) {
            res.status(404).json({ error: 'File not found' });
          }
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to download file" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
