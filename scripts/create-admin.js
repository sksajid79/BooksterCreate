#!/usr/bin/env node

/**
 * Script to create an admin user for self-hosting deployment
 * Run this script after deploying your application to create the first admin user
 * 
 * Usage: node scripts/create-admin.js
 */

import { storage } from '../server/storage.js';
import { db } from '../server/db.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createAdminUser() {
  console.log('🔧 Admin User Creation Script');
  console.log('=============================\n');
  
  try {
    // Test database connection
    console.log('🔄 Testing database connection...');
    const testUser = await storage.getUser('test');
    console.log('✅ Database connection successful\n');
    
    // Get admin user details
    const username = await askQuestion('Enter admin username: ');
    const email = await askQuestion('Enter admin email: ');
    const password = await askQuestion('Enter admin password: ');
    
    if (!username || !email || !password) {
      console.log('❌ All fields are required');
      process.exit(1);
    }
    
    // Check if user already exists
    const existingUserByEmail = await storage.getUserByEmail(email);
    if (existingUserByEmail) {
      console.log('❌ Email already registered');
      process.exit(1);
    }
    
    const existingUserByUsername = await storage.getUserByUsername(username);
    if (existingUserByUsername) {
      console.log('❌ Username already taken');
      process.exit(1);
    }
    
    // Create admin user
    console.log('\n🔄 Creating admin user...');
    const adminUser = await storage.createUser({
      username,
      email,
      password,
      role: 'admin',
      credits: 999, // Give admin unlimited credits
    });
    
    console.log('\n✅ Admin user created successfully!');
    console.log('=====================================');
    console.log(`Username: ${adminUser.username}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`Credits: ${adminUser.credits}`);
    console.log('=====================================\n');
    console.log('🎉 You can now log in to your application with these credentials');
    console.log('💡 Access the admin panel at: your-domain.com/admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
createAdminUser();