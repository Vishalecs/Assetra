import 'dotenv/config';

const env = {
  PORT: Number(process.env.PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'local-dev-secret',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'local-cookie-secret',
  INITIAL_SUPER_ADMIN_ID: process.env.INITIAL_SUPER_ADMIN_ID || '',
  INITIAL_SUPER_ADMIN_NAME: process.env.INITIAL_SUPER_ADMIN_NAME || '',
  INITIAL_SUPER_ADMIN_PASSWORD: process.env.INITIAL_SUPER_ADMIN_PASSWORD || '',
};

export default env;
