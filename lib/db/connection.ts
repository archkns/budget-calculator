import { Pool } from 'pg';

// Supabase connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:JI6xxIpg8GKGoo5j@db.ijyatywunqqqxtwmedsg.supabase.co:5432/postgres',
  // Alternative individual config (fallback)
  host: process.env.PGHOST || 'db.ijyatywunqqqxtwmedsg.supabase.co',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'postgres',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'JI6xxIpg8GKGoo5j',
  // Supabase specific settings
  ssl: {
    rejectUnauthorized: false
  }
});

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
