import app from './app.js';
import env from './config/env.js';
import { checkDatabaseConnection, migrateDatabase } from './config/db.js';
import { loadStoreFromDatabase } from './store.js';

const port = env.PORT;

const startServer = async () => {
  try {
    await checkDatabaseConnection();
  } catch (error) {
    console.error('PostgreSQL connection failed. Verify DATABASE_URL points to the intended reachable database.', error);
    process.exit(1);
  }

  try {
    await migrateDatabase();
    console.log('PostgreSQL migrations are up to date.');
  } catch (error) {
    console.error('PostgreSQL migrations failed. Check the migration error and database permissions before restarting.', error);
    process.exit(1);
  }

  try {
    await loadStoreFromDatabase();
    console.log('Connected to PostgreSQL successfully.');
  } catch (error) {
    console.error('Failed to load application data. Confirm the database schema matches the deployed migrations.', error);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`ASSETRA backend running on http://localhost:${port}`);
  });
};

startServer();
