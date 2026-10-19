import { Router } from 'express';
import { buildDashboardData, getStore } from '../store.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const activeStore = getStore();
  const currentUser = activeStore.users.find((user) => user.employeeId === req.user?.employeeId);

  const dashboard = buildDashboardData(req.user?.role || 'EMPLOYEE', currentUser);
  res.json({ success: true, data: dashboard });
});

export { router as dashboardRoutes };
