const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please set:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Supabase database...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.warn(`   ⚠️  Warning: ${error.message}`);
        } else {
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        }
      }
    }

    // Read and execute seed data
    const seedPath = path.join(__dirname, '../lib/db/seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('🌱 Seeding database with initial data...');
      const seedData = fs.readFileSync(seedPath, 'utf8');
      
      const seedStatements = seedData
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (let i = 0; i < seedStatements.length; i++) {
        const statement = seedStatements[i];
        if (statement.trim()) {
          console.log(`   Seeding statement ${i + 1}/${seedStatements.length}...`);
          
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.warn(`   ⚠️  Warning: ${error.message}`);
          } else {
            console.log(`   ✅ Seed statement ${i + 1} executed successfully`);
          }
        }
      }
    }

    console.log('✅ Database setup completed successfully!');
    
    // Test the connection by fetching some data
    console.log('🧪 Testing database connection...');
    
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .limit(5);
    
    if (rolesError) {
      console.warn(`⚠️  Warning: Could not fetch roles - ${rolesError.message}`);
    } else {
      console.log(`✅ Found ${roles?.length || 0} roles in database`);
    }

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    if (projectsError) {
      console.warn(`⚠️  Warning: Could not fetch projects - ${projectsError.message}`);
    } else {
      console.log(`✅ Found ${projects?.length || 0} projects in database`);
    }

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

// Alternative approach using direct SQL execution
async function setupDatabaseDirect() {
  try {
    console.log('🚀 Setting up Supabase database (direct approach)...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // For now, we'll just log the schema since direct SQL execution
    // requires special permissions in Supabase
    console.log('📝 Schema to be executed:');
    console.log('='.repeat(50));
    console.log(schema);
    console.log('='.repeat(50));
    
    console.log('⚠️  Note: Please execute the above schema manually in your Supabase SQL editor');
    console.log('   or use the Supabase CLI to apply these changes.');
    
    console.log('✅ Schema file read successfully!');
    
  } catch (error) {
    console.error('❌ Error reading schema file:', error);
    process.exit(1);
  }
}

// Check if we should use direct approach
const useDirect = process.argv.includes('--direct');

if (useDirect) {
  setupDatabaseDirect();
} else {
  setupDatabase();
}
