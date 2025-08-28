import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChapters, regenerateChapter } from "./anthropic.js";
import { exportToPDF, exportToHTML, exportToMarkdown, exportToEPUB, exportToDOCX } from "./exportGenerator.js";
import { insertBookSchema, insertChapterSchema, insertBookProgressSchema } from "@shared/schema";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Book CRUD operations
  app.post("/api/books", async (req, res) => {
    try {
      const bookData = insertBookSchema.parse(req.body);
      const book = await storage.createBook(bookData);
      res.json(book);
    } catch (error) {
      console.error('Book creation error:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to create book" 
      });
    }
  });

  app.get("/api/books/:id", async (req, res) => {
    try {
      const book = await storage.getBook(req.params.id);
      if (!book) {
        return res.status(404).json({ error: "Book not found" });
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

  app.put("/api/books/:id", async (req, res) => {
    try {
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
  app.post("/api/books/:bookId/chapters", async (req, res) => {
    try {
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

  app.put("/api/chapters/:id", async (req, res) => {
    try {
      const updates = req.body;
      const chapter = await storage.updateChapter(req.params.id, updates);
      if (!chapter) {
        return res.status(404).json({ error: "Chapter not found" });
      }
      res.json(chapter);
    } catch (error) {
      console.error('Chapter update error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update chapter" 
      });
    }
  });

  app.delete("/api/chapters/:id", async (req, res) => {
    try {
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
  app.post("/api/chapters/generate", async (req, res) => {
    try {
      const bookDetails = req.body;
      
      if (!bookDetails.title || !bookDetails.description) {
        return res.status(400).json({ 
          error: "Book title and description are required" 
        });
      }

      const chapters = await generateChapters(bookDetails);
      res.json({ chapters });
    } catch (error) {
      console.error('Chapter generation error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate chapters" 
      });
    }
  });

  // Regenerate a specific chapter
  app.post("/api/chapters/regenerate", async (req, res) => {
    try {
      const { chapterTitle, bookDetails } = req.body;
      
      if (!chapterTitle || !bookDetails) {
        return res.status(400).json({ 
          error: "Chapter title and book details are required" 
        });
      }

      const content = await regenerateChapter(chapterTitle, bookDetails);
      res.json({ content });
    } catch (error) {
      console.error('Chapter regeneration error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to regenerate chapter" 
      });
    }
  });

  // Export book in different formats
  app.post("/api/export/:format", async (req, res) => {
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
