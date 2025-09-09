import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'budget_calculator',
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
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
