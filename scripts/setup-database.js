const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Database connection configuration - requires environment variables for security
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

if (!process.env.DATABASE_URL) {
  console.error('❌ Missing database configuration. Please set DATABASE_URL environment variable.');
  process.exit(1);
}

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, '../lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    console.log('✅ Database schema created successfully!');
    
    // Read seed file
    const seedPath = path.join(__dirname, '../lib/db/seed.sql');
    if (fs.existsSync(seedPath)) {
      const seed = fs.readFileSync(seedPath, 'utf8');
      await pool.query(seed);
      console.log('✅ Database seeded successfully!');
    }
    
    console.log('🎉 Database setup completed!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
