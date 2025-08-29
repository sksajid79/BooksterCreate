import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase, closeDatabaseConnection } from "./db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Graceful shutdown handling
function setupGracefulShutdown(server: any) {
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      console.log(`Received ${signal}, starting graceful shutdown...`);
      
      // Close server
      server.close(async () => {
        console.log('HTTP server closed');
        
        // Close database connections
        await closeDatabaseConnection();
        
        console.log('Graceful shutdown completed');
        process.exit(0);
      });
    });
  });
}

(async () => {
  try {
    // Initialize database (connection + schema verification)
    console.log('🔄 Initializing database...');
    const isDbReady = await initializeDatabase();
    
    if (!isDbReady) {
      console.error('❌ Database initialization failed. Server startup aborted.');
      console.error('💡 Deployment troubleshooting tips:');
      console.error('   1. Verify DATABASE_URL is configured in deployment secrets');
      console.error('   2. Ensure database is accessible from Cloud Run');
      console.error('   3. Check if database exists and credentials are correct');
      console.error('   4. Run database migrations: npm run db:push');
      console.error('   5. Contact Replit support for platform migration issues');
      process.exit(1);
    }

    console.log('✅ Database initialized successfully, starting server...');
    
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`✅ Server running on port ${port}`);
      log(`🎯 App ready for deployment verification`);
    });

    // Setup graceful shutdown
    setupGracefulShutdown(server);
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    console.error('💡 This might be due to:');
    console.error('   - Missing environment variables');
    console.error('   - Database connection issues');
    console.error('   - Platform infrastructure problems');
    process.exit(1);
  }
})();
