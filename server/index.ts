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
    // Log deployment environment information
    const isProduction = process.env.NODE_ENV === 'production';
    const deploymentId = process.env.REPLIT_DEPLOYMENT_ID;
    const port = process.env.PORT || '5000';
    
    if (isProduction || deploymentId) {
      console.log('🚀 Starting in deployment environment');
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Deployment ID: ${deploymentId || 'none'}`);
      console.log(`   Port: ${port}`);
      console.log(`   Database configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
    }
    
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
      console.error('   6. Check if this is a platform infrastructure issue');
      
      // Enhanced error reporting for deployment failures
      if (isProduction || deploymentId) {
        console.error('');
        console.error('🔧 Cloud Run deployment specific checks:');
        console.error('   - Database provisioning status in Replit dashboard');
        console.error('   - Network connectivity between Cloud Run and database');
        console.error('   - Secret availability in deployment environment');
        console.error('   - Platform migration infrastructure status');
      }
      
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
    const portNum = parseInt(port, 10);
    
    server.listen({
      port: portNum,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`✅ Server running on port ${portNum}`);
      log(`🎯 App ready for deployment verification`);
    });

    // Setup graceful shutdown
    setupGracefulShutdown(server);
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    
    // Enhanced error analysis for deployment issues
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isDeployment = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT_ID;
    
    console.error('💡 Startup failure analysis:');
    console.error('   - Missing environment variables');
    console.error('   - Database connection issues');
    console.error('   - Platform infrastructure problems');
    
    // Database-specific error patterns
    if (errorMessage.includes('DATABASE_URL') || errorMessage.includes('database')) {
      console.error('');
      console.error('🔍 Database-related failure detected:');
      console.error('   - Verify database is provisioned in Replit dashboard');
      console.error('   - Check DATABASE_URL secret configuration');
      console.error('   - Ensure database is accessible from deployment environment');
    }
    
    // Migration-specific error patterns
    if (errorMessage.includes('migration') || errorMessage.includes('schema') || errorMessage.includes('table')) {
      console.error('');
      console.error('🔍 Migration/Schema failure detected:');
      console.error('   - Database migrations may have failed during deployment');
      console.error('   - Schema synchronization issue with Cloud Run');
      console.error('   - Platform migration infrastructure error');
      console.error('   - Contact Replit support for assistance');
    }
    
    if (isDeployment) {
      console.error('');
      console.error('🚨 DEPLOYMENT FAILURE SUMMARY:');
      console.error('   This appears to be a Cloud Run deployment issue.');
      console.error('   Common causes:');
      console.error('   1. Database migrations failed due to platform issue');
      console.error('   2. PostgreSQL connection could not be established');
      console.error('   3. Cloud Run infrastructure encountered internal error');
      console.error('   ');
      console.error('   Recommended actions:');
      console.error('   1. Contact Replit support for platform assistance');
      console.error('   2. Verify database secrets in Deployments pane');
      console.error('   3. Check database accessibility from Cloud Run');
      console.error('   4. Ensure database migrations are properly configured');
    }
    
    process.exit(1);
  }
})();
