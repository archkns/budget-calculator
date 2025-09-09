import { Pool } from 'pg';

// Database connection configuration - requires environment variables for security
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Alternative individual config (fallback)
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  // SSL settings
  ssl: {
    rejectUnauthorized: false
  },
  // Performance optimizations
  max: 20, // Maximum number of clients in the pool
  min: 2,  // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
});

// Validate required environment variables
if (!process.env.DATABASE_URL && !process.env.PGHOST) {
  throw new Error('Database configuration is required. Please set DATABASE_URL or individual PG environment variables.');
}

export default pool;

export async function query(text: string, params?: (string | number | null)[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
