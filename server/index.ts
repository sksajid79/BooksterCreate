import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Environment variable validation
function validateEnvironment() {
  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    // Either JWT_SECRET or SESSION_SECRET is required for authentication
    SECRET: process.env.JWT_SECRET || process.env.SESSION_SECRET,
  };

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key === 'SECRET' ? 'JWT_SECRET or SESSION_SECRET' : key);

  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
    console.error('❌ Deployment Error:', errorMsg);
    console.error('Please configure these environment variables in your deployment settings.');
    console.error('For production deployment, ensure you have set:');
    console.error('- DATABASE_URL (PostgreSQL connection string)');
    console.error('- SESSION_SECRET or JWT_SECRET (for authentication)');
    throw new Error(errorMsg);
  }

  // Validate PORT if provided
  const port = process.env.PORT;
  if (port && (isNaN(parseInt(port)) || parseInt(port) < 1 || parseInt(port) > 65535)) {
    const errorMsg = `Invalid PORT environment variable: ${port}. Must be a number between 1-65535.`;
    console.error('❌ Configuration Error:', errorMsg);
    throw new Error(errorMsg);
  }

  console.log('✅ Environment variables validated successfully');
  console.log(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`Auth Secret: ${(process.env.JWT_SECRET || process.env.SESSION_SECRET) ? 'Configured' : 'Not configured'}`);
}

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

(async () => {
  // Validate environment variables before starting server
  try {
    validateEnvironment();
  } catch (error) {
    console.error('Server startup failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  let server;
  try {
    server = await registerRoutes(app);
    console.log('✅ Routes registered successfully');
  } catch (error) {
    console.error('❌ Failed to register routes:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('❌ Express error:', {
      status,
      message,
      stack: err.stack,
      url: _req.url,
      method: _req.method
    });

    res.status(status).json({ message });
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
  }, (err?: Error) => {
    if (err) {
      console.error('❌ Server failed to start:', err);
      process.exit(1);
    }
    log(`✅ Server successfully listening on 0.0.0.0:${port}`);
    log(`Environment: ${app.get('env') || 'development'}`);
  });
})();
