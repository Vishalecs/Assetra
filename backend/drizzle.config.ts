import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: [
    './src/db/schema/users.ts',
    './src/db/schema/employees.ts',
    './src/db/schema/masters.ts',
    './src/db/schema/audit.ts',
    './src/db/schema/applications.ts',
  ],
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/assetra',
  },
} satisfies Config;
