import app from './app.js';
import env from './config/env.js';
import { checkDatabaseConnection } from './config/db.js';
import { loadStoreFromDatabase } from './store.js';

const port = env.PORT;

const startServer = async () => {
  try {
    await checkDatabaseConnection();
    await loadStoreFromDatabase();
    console.log('Connected to PostgreSQL successfully.');
  } catch (error) {
    console.error('PostgreSQL connection failed. Please start PostgreSQL and ensure DATABASE_URL is correct.', error);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`ASSETRA backend running on http://localhost:${port}`);
  });
};

startServer();
