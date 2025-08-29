import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { sql, eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

neonConfig.webSocketConstructor = ws;

// Validate all required database environment variables
function validateDatabaseEnvironment() {
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Database Environment Validation Failed');
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('💡 Deployment troubleshooting:');
    console.error('   1. Verify DATABASE_URL is configured in Deployment secrets');
    console.error('   2. Check Replit Database is properly provisioned');
    console.error('   3. Ensure secrets are accessible from Cloud Run environment');
    console.error('   4. Contact Replit support if database provisioning failed');
    throw new Error(
      `Missing required database environment variables: ${missing.join(', ')}. ` +
      'Please ensure your database is properly configured and all secrets are set.'
    );
  }
  
  // Validate DATABASE_URL format
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && !databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
    console.error('❌ Invalid DATABASE_URL format');
    console.error('Expected: postgresql://... or postgres://...');
    console.error(`Received: ${databaseUrl.substring(0, 20)}...`);
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  console.log('✅ Database environment variables validated');
}

// Validate environment on module load
validateDatabaseEnvironment();

// Create connection pool with enhanced error handling for Cloud Run
const isCloudRun = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT_ID;

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Enhanced connection pool configuration for Cloud Run deployment
  max: isCloudRun ? 10 : 20, // Reduced pool size for Cloud Run
  idleTimeoutMillis: isCloudRun ? 20000 : 30000, // Shorter timeout for Cloud Run
  connectionTimeoutMillis: isCloudRun ? 15000 : 10000, // Longer timeout for Cloud Run initial connection
  application_name: 'mybookstore_app', // Help identify connections in database logs
  statement_timeout: 30000, // 30 second query timeout
  query_timeout: 30000, // 30 second query timeout
  keepAlive: true, // Keep connections alive
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

// Automated migration handling for deployment
export async function runMigrations(): Promise<boolean> {
  try {
    console.log('🔄 Checking if migrations are needed...');
    
    // First check if we can connect
    const canConnect = await testDatabaseConnection();
    if (!canConnect) {
      console.log('❌ Cannot run migrations - database connection failed');
      return false;
    }
    
    // Check if this is a deployment environment
    const isProduction = process.env.NODE_ENV === 'production';
    const hasReplitDeployment = process.env.REPLIT_DEPLOYMENT_ID;
    
    if (isProduction || hasReplitDeployment) {
      console.log('🚀 Deployment environment detected, attempting schema sync...');
      
      // In deployment, we'll rely on the schema verification
      // If schema verification fails, it indicates missing migrations
      const schemaValid = await verifyDatabaseSchema();
      if (!schemaValid) {
        console.error('❌ Schema verification failed during deployment');
        console.error('💡 Migration troubleshooting:');
        console.error('   1. Ensure database migrations were run before deployment');
        console.error('   2. Run `npm run db:push` in development environment');
        console.error('   3. Database schema may be out of sync with application code');
        console.error('   4. Contact Replit support for platform migration assistance');
        return false;
      }
    }
    
    console.log('✅ Migrations check completed');
    return true;
  } catch (error) {
    console.error('❌ Migration check failed:', error);
    console.error('💡 This might indicate:');
    console.error('   - Platform migration issue (contact Replit support)');
    console.error('   - Database schema out of sync');
    console.error('   - Insufficient database permissions');
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
  
  // First check connection with enhanced Cloud Run handling
  const isConnected = await connectWithRetry();
  if (!isConnected) {
    console.error('❌ Database connection failed during initialization');
    console.error('💡 Cloud Run deployment troubleshooting:');
    console.error('   1. Verify DATABASE_URL is accessible from Cloud Run');
    console.error('   2. Check if Replit database is provisioned and running');
    console.error('   3. Ensure network connectivity between Cloud Run and database');
    console.error('   4. Contact Replit support for platform connectivity issues');
    return false;
  }

  // Check and handle migrations
  const migrationsOk = await runMigrations();
  if (!migrationsOk) {
    console.error('❌ Database migration check failed');
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
    console.error('   5. Contact Replit support for platform migration issues');
    return false;
  }

  // Create default admin user if no admin exists
  const defaultAdminCreated = await createDefaultAdminUser();
  if (!defaultAdminCreated) {
    console.error('❌ Default admin user creation failed');
    return false;
  }

  console.log('✅ Database initialization completed successfully');
  return true;
}

// Create default admin user if no admin exists
async function createDefaultAdminUser(): Promise<boolean> {
  try {
    console.log('🔄 Checking for admin users...');
    
    // Check if any admin user exists
    const [adminUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'admin'))
      .limit(1);
    
    if (adminUser) {
      console.log('✅ Admin user already exists, skipping default creation');
      return true;
    }
    
    console.log('🔄 No admin user found, creating default superadmin...');
    
    // Check if superadmin email/username already exists
    const [existingByEmail] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, 'admin@yourdomain.com'))
      .limit(1);
      
    const [existingByUsername] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, 'superadmin'))
      .limit(1);
    
    if (existingByEmail || existingByUsername) {
      console.log('⚠️ Default admin credentials conflict with existing users, skipping creation');
      return true;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('AdminPass123!', 12);
    
    // Create default admin user
    const [defaultAdmin] = await db
      .insert(schema.users)
      .values({
        username: 'superadmin',
        email: 'admin@yourdomain.com',
        password: hashedPassword,
        role: 'admin',
        credits: 999,
        isActive: true,
        emailVerified: true,
        creditsResetDate: new Date(),
      })
      .returning();
    
    console.log('✅ Default superadmin user created successfully:');
    console.log('   Username: superadmin');
    console.log('   Email: admin@yourdomain.com');
    console.log('   Role: admin');
    console.log('   Credits: 999');
    console.log('💡 Change these credentials after first login for security');
    
    return true;
  } catch (error) {
    console.error('❌ Error creating default admin user:', error);
    return false;
  }
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