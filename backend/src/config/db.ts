import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import env from './env.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

export const db = drizzle(pool);

export const checkDatabaseConnection = async () => {
  const result = await pool.query('SELECT 1 AS ok');
  if (result.rows[0]?.ok !== 1) {
    throw new Error('PostgreSQL health check failed.');
  }

  return true;
};
