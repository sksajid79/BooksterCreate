import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChapters, regenerateChapter } from "./anthropic.js";
import { exportToPDF, exportToHTML, exportToMarkdown, exportToEPUB, exportToDOCX } from "./exportGenerator.js";
import { insertBookSchema, insertChapterSchema, insertBookProgressSchema, loginSchema, signupSchema } from "@shared/schema";
import { authenticateToken, requireAdmin, requireCredits, generateToken, type AuthRequest } from "./auth";
import { db } from "./db";
import { users } from "@shared/schema";
import path from "path";

// Default AI prompts for book generation
function getDefaultPrompts() {
  return {
    book_outline: {
      prompt: `You are a world-class e-book author and content strategist with expertise in creating bestselling non-fiction books. Your mission is to create an exceptional {numberOfChapters}-chapter e-book that will become the definitive guide for {targetAudience}.

## BOOK SPECIFICATIONS
**Title:** {title}
**Target Audience:** {targetAudience}
**Description:** {description}
**Tone & Style:** {toneStyle}
**Core Mission:** {mission}

## CONTENT REQUIREMENTS FOR EACH CHAPTER
Each chapter must be a masterpiece that includes:

### STRUCTURE (2000-3000 words per chapter)
- **Compelling opening hook** that immediately engages {targetAudience}
- **2-3 main sections** with descriptive subheadings (##)
- **Multiple subsections** (###) for detailed exploration
- **Practical implementation section** with step-by-step guidance
- **Real-world examples and case studies** relevant to {targetAudience}
- **Actionable takeaways** and summary

### QUALITY STANDARDS
- **Expert-level depth:** Provide insights that go beyond surface-level advice
- **Practical focus:** Every concept must include specific, actionable steps
- **Evidence-based:** Reference research, studies, or proven methodologies where appropriate
- **Engaging narrative:** Use storytelling, analogies, and relatable examples
- **Progressive learning:** Each chapter builds upon previous concepts
- **Professional formatting:** Use markdown extensively (##, ###, **, -, bullet points)

### CONTENT ELEMENTS TO INCLUDE
- Industry best practices and cutting-edge strategies
- Common mistakes and how to avoid them
- Tools, resources, and frameworks
- Success stories and transformation examples
- Troubleshooting guides for common challenges
- Future-focused insights and trends

## JSON OUTPUT FORMAT
Return ONLY a valid JSON array with no additional text, explanations, or formatting:

[
  {
    "id": "1",
    "title": "Compelling Chapter Title That Hooks the Reader",
    "content": "## Opening Hook Section\n\nStart with a powerful story, statistic, or question that immediately captures attention...\n\n## Core Concept 1: Main Learning Objective\n\nProvide comprehensive explanation with depth and nuance...\n\n### Practical Implementation\n\nStep-by-step guidance for immediate application...\n\n### Real-World Example\n\nDetailed case study or example...\n\n## Core Concept 2: Advanced Strategies\n\nBuild upon foundation with sophisticated approaches...\n\n### Common Pitfalls to Avoid\n\nSpecific mistakes and prevention strategies...\n\n## Action Plan and Next Steps\n\nClear, specific actions readers can take immediately...\n\n### Key Takeaways\n\n- Specific, memorable insight 1\n- Actionable strategy 2\n- Important mindset shift 3"
  }
]

## FINAL INSTRUCTIONS
- Create titles that are specific, benefit-focused, and intriguing
- Ensure each chapter delivers transformational value to {targetAudience}
- Maintain consistent {toneStyle} throughout
- Make content immediately actionable and practically applicable
- Use engaging, conversational language while maintaining professional authority
- Return ONLY the JSON array - no explanations, no markdown code blocks, just the raw JSON`
    },
    chapter_generation: {
      prompt: `You are a world-renowned expert author specializing in {targetAudience} success strategies. You're writing the definitive chapter on "{chapterTitle}" for the book "{title}". This chapter must be exceptional - the kind of content that readers will highlight, share, and return to repeatedly.

## BOOK CONTEXT
**Title:** {title}
**Target Audience:** {targetAudience}
**Book Description:** {description}
**Tone & Style:** {toneStyle}
**Core Mission:** {mission}

## CHAPTER MISSION
Create a comprehensive, transformational chapter titled "{chapterTitle}" that becomes the go-to resource for {targetAudience} on this specific topic.

## CONTENT SPECIFICATIONS (2500-3500 words)

### OPENING SECTION (300-400 words)
- **Powerful Hook:** Start with a compelling story, surprising statistic, thought-provoking question, or bold statement
- **Problem Recognition:** Help readers identify why this topic matters to them personally
- **Promise:** Clearly state what they'll achieve by reading this chapter
- **Roadmap:** Brief overview of what's coming

### MAIN CONTENT STRUCTURE

#### Section 1: Foundation & Context (600-800 words)
- **## [Descriptive Heading]**
- Deep dive into the fundamental concepts
- Why traditional approaches often fail
- What makes this approach different
- Research or evidence backing your approach

#### Section 2: Core Strategy/Framework (800-1000 words)
- **## [Action-Oriented Heading]**
- Your primary methodology or system
- **### Step-by-step breakdown** with specific, actionable instructions
- **### Tools and resources** needed for implementation
- **### Real-world application examples** relevant to {targetAudience}

#### Section 3: Advanced Implementation (600-800 words)
- **## [Results-Focused Heading]**
- Advanced techniques for maximizing results
- **### Common obstacles** and how to overcome them
- **### Troubleshooting guide** for typical challenges
- **### Success accelerators** and optimization strategies

#### Section 4: Practical Application (400-500 words)
- **## Putting It Into Action**
- **### Immediate next steps** (what to do today)
- **### 30-day implementation plan**
- **### Long-term mastery roadmap**
- **### Measuring progress and success**

### CLOSING SECTION (200-300 words)
- **## Key Takeaways and Next Steps**
- Powerful summary of core insights
- Motivational closing that inspires action
- Smooth transition to next chapter concepts

## QUALITY REQUIREMENTS

### Content Excellence
- **Authority:** Demonstrate deep expertise and insider knowledge
- **Practicality:** Every concept must include specific, actionable steps
- **Engagement:** Use storytelling, analogies, and relatable examples throughout
- **Value Density:** Pack maximum insights per paragraph
- **Originality:** Provide fresh perspectives and unique frameworks

### Writing Standards
- **Tone:** Maintain consistent {toneStyle} that resonates with {targetAudience}
- **Clarity:** Use clear, concise language while maintaining sophistication
- **Flow:** Ensure smooth transitions between sections and concepts
- **Formatting:** Extensive use of markdown (##, ###, **, bullet points, numbered lists)
- **Engagement:** Vary sentence length and structure for readability

### Essential Elements to Include
- At least 2-3 real-world examples or mini case studies
- Specific tools, templates, or frameworks
- Actionable checklists or step-by-step processes
- Common mistakes and prevention strategies
- Industry insights or "insider secrets"
- Future-thinking perspectives on the topic

## CRITICAL FORMATTING INSTRUCTIONS
- Start immediately with content (no JSON, no explanations)
- Use ## for main sections, ### for subsections
- Bold important concepts with **text**
- Use bullet points (-) and numbered lists (1.) generously
- Include practical elements like checklists and action items
- End with clear, specific next steps

Create content that positions you as the definitive expert on "{chapterTitle}" while delivering massive value to {targetAudience}. This chapter should be so good that readers consider it worth the price of the entire book.`
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
      const allUsers = await db.select({
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
      res.json(allUsers);
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

  // AI Prompts management routes
  app.get("/api/admin/prompts", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      // Get all prompt configs
      const configs = await storage.getAllAdminConfigs();
      const prompts = configs.filter(config => 
        config.configKey.startsWith('prompt_') || 
        config.configKey.includes('_prompt')
      );
      res.json(prompts);
    } catch (error) {
      console.error("Admin prompts fetch error:", error);
      res.status(500).json({ error: "Failed to fetch AI prompts" });
    }
  });

  app.get("/api/admin/prompts/:promptType", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { promptType } = req.params; // 'book_outline' or 'chapter_generation'
      const configKey = `prompt_${promptType}`;
      const config = await storage.getAdminConfig(configKey);
      
      if (!config) {
        // Return default prompt if not found
        const defaultPrompts = getDefaultPrompts();
        const defaultPrompt = (defaultPrompts as any)[promptType];
        if (!defaultPrompt) {
          return res.status(404).json({ error: "Prompt type not found" });
        }
        return res.json({
          configKey,
          configValue: defaultPrompt,
          description: `Default ${promptType.replace('_', ' ')} prompt`
        });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Admin prompt fetch error:", error);
      res.status(500).json({ error: "Failed to fetch AI prompt" });
    }
  });

  app.put("/api/admin/prompts/:promptType", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { promptType } = req.params; // 'book_outline' or 'chapter_generation'
      const { prompt, description } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "Prompt content is required" });
      }
      
      const configKey = `prompt_${promptType}`;
      const config = await storage.setAdminConfig({
        configKey,
        configValue: { prompt },
        description: description || `${promptType.replace('_', ' ')} prompt`
      });
      
      res.json(config);
    } catch (error) {
      console.error("Admin prompt update error:", error);
      res.status(500).json({ error: "Failed to update AI prompt" });
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
