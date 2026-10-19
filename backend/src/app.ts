import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { authRoutes } from './routes/auth.routes.js';
import { dashboardRoutes } from './routes/dashboard.routes.js';
import { employeesRoutes } from './routes/employees.routes.js';
import { masterDataRoutes } from './routes/master-data.routes.js';
import { applicationsRoutes } from './routes/applications.routes.js';
import { auditLogsRoutes } from './routes/audit-logs.routes.js';
import { initializeStore, store } from './store.js';

const app = express();
const globalObj = globalThis as typeof globalThis & { __assetra_store?: typeof store };

initializeStore();
globalObj.__assetra_store = store;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'ASSETRA' });
});

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'ASSETRA API is healthy.' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/employees', employeesRoutes);
app.use('/api/v1/master-data', masterDataRoutes);
app.use('/api/v1/applications', applicationsRoutes);
app.use('/api/v1/audit-logs', auditLogsRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

export default app;
