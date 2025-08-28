import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChapters, regenerateChapter } from "./anthropic.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
      const validFormats = ['pdf', 'epub', 'docx'];
      if (!validFormats.includes(format.toLowerCase())) {
        return res.status(400).json({ 
          error: "Invalid export format. Supported formats: PDF, EPUB, DOCX" 
        });
      }

      // For now, return success response with download URL
      // In a real implementation, you would generate the actual file
      const fileName = `${bookData.title.replace(/[^a-zA-Z0-9]/g, '_')}.${format.toLowerCase()}`;
      const downloadUrl = `/downloads/${fileName}`;
      
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

  const httpServer = createServer(app);

  return httpServer;
}
