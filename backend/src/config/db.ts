import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { fileURLToPath } from 'node:url';
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

const migrationsFolder = fileURLToPath(new URL('../../src/db/migrations', import.meta.url));
const migrationLockKey: [number, number] = [1651662690, 1];
const requiredRelations = [
  'users',
  'employees',
  'designations',
  'departments',
  'branches',
  'roles',
  'applications',
  'audit_logs',
  'permissions',
  'role_permissions',
  'employee_permissions',
  'employee_code_seq',
];

export const migrateDatabase = async () => {
  const lockClient = await pool.connect();

  try {
    await lockClient.query('SELECT pg_advisory_lock($1, $2)', migrationLockKey);
    await migrate(db, { migrationsFolder });

    const result = await pool.query<{ relationName: string }>(
      `SELECT required.name AS "relationName"
       FROM unnest($1::text[]) AS required(name)
       WHERE to_regclass(format('public.%I', required.name)) IS NULL
       ORDER BY required.name`,
      [requiredRelations],
    );

    if (result.rows.length > 0) {
      throw new Error(`Required PostgreSQL relations are missing from the public schema: ${result.rows.map(({ relationName }) => relationName).join(', ')}`);
    }
  } finally {
    try {
      await lockClient.query('SELECT pg_advisory_unlock($1, $2)', migrationLockKey);
    } finally {
      lockClient.release();
    }
  }
};
