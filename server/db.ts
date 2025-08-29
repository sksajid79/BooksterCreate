import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { sql } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

// Validate all required database environment variables
function validateDatabaseEnvironment() {
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missing.join(', ')}. ` +
      'Please ensure your database is properly configured and all secrets are set.'
    );
  }
}

// Validate environment on module load
validateDatabaseEnvironment();

// Create connection pool with enhanced error handling
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Add connection pool configuration for better reliability
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle({ client: pool, schema });

// Database connection testing function
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('Testing database connection...');
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Database connection with retry logic
export async function connectWithRetry(maxRetries: number = 5, delayMs: number = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Database connection attempt ${attempt}/${maxRetries}`);
    
    try {
      const isConnected = await testDatabaseConnection();
      if (isConnected) {
        return true;
      }
    } catch (error) {
      console.error(`Connection attempt ${attempt} failed:`, error);
    }
    
    if (attempt < maxRetries) {
      console.log(`Waiting ${delayMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      // Exponential backoff
      delayMs *= 1.5;
    }
  }
  
  console.error(`❌ Failed to connect to database after ${maxRetries} attempts`);
  return false;
}

// Database schema verification function
export async function verifyDatabaseSchema(): Promise<boolean> {
  try {
    console.log('Verifying database schema...');
    
    // Check if core tables exist by trying to query them
    const coreTableChecks = [
      { name: 'users', query: `SELECT COUNT(*) FROM users LIMIT 1` },
      { name: 'books', query: `SELECT COUNT(*) FROM books LIMIT 1` },
      { name: 'chapters', query: `SELECT COUNT(*) FROM chapters LIMIT 1` },
      { name: 'book_progress', query: `SELECT COUNT(*) FROM book_progress LIMIT 1` }
    ];

    for (const table of coreTableChecks) {
      try {
        await db.execute(sql.raw(table.query));
        console.log(`✅ Table ${table.name} exists and is accessible`);
      } catch (error) {
        console.error(`❌ Table ${table.name} verification failed:`, error);
        console.log('💡 This might indicate:');
        console.log('   - Database migrations have not been run');
        console.log('   - Schema is out of date');
        console.log('   - Database permissions issue');
        console.log('🔧 To fix: Run `npm run db:push` to sync schema');
        return false;
      }
    }

    console.log('✅ Database schema verification successful');
    return true;
  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    return false;
  }
}

// Comprehensive database initialization check
export async function initializeDatabase(): Promise<boolean> {
  console.log('🔄 Initializing database...');
  
  // First check connection
  const isConnected = await connectWithRetry();
  if (!isConnected) {
    return false;
  }

  // Then verify schema
  const schemaValid = await verifyDatabaseSchema();
  if (!schemaValid) {
    console.error('❌ Database schema verification failed');
    console.error('💡 Deployment troubleshooting:');
    console.error('   1. Ensure all database migrations have been applied');
    console.error('   2. Verify schema is synchronized with the application code');
    console.error('   3. Check if database has required permissions');
    console.error('   4. Run migrations manually if this is the first deployment');
    return false;
  }

  console.log('✅ Database initialization completed successfully');
  return true;
}

// Graceful shutdown function
export async function closeDatabaseConnection(): Promise<void> {
  try {
    console.log('Closing database connection...');
    await pool.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}