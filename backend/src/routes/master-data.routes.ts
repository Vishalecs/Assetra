import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { branches, departments, designations, permissions, roles } from '../db/schema/index.js';
import { getStore } from '../store.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/designations', requireAuth, requireRole('SUPER_ADMIN', 'IT_ADMIN'), async (_req, res) => {
  const data = await db.select().from(designations);
  return res.json({ success: true, data });
});

router.post('/designations', requireAuth, requireRole('SUPER_ADMIN'), async (req, res) => {
  const { name, department, description } = req.body || {};
  if (!name || !department) return res.status(400).json({ success: false, message: 'Designation name and department are required.' });

  try {
    const [departmentRecord] = await db.select().from(departments).where(eq(departments.name, department)).limit(1);
    if (!departmentRecord) return res.status(400).json({ success: false, message: 'Select an existing department.' });
    const [item] = await db.insert(designations).values({ id: randomUUID(), name, department, description: description || '' }).returning();
    const storedItem = { ...item, description: item.description || '' };
    getStore().designations.push(storedItem);
    return res.status(201).json({ success: true, data: storedItem });
  } catch {
    return res.status(500).json({ success: false, message: 'Unable to save designation.' });
  }
});

router.get('/departments', requireAuth, requireRole('SUPER_ADMIN', 'IT_ADMIN'), async (_req, res) => {
  const data = await db.select().from(departments);
  return res.json({ success: true, data });
});

router.post('/departments', requireAuth, requireRole('SUPER_ADMIN'), async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ success: false, message: 'Department name is required.' });

  try {
    const [item] = await db.insert(departments).values({ id: randomUUID(), name, description: description || '' }).returning();
    const storedItem = { ...item, description: item.description || '' };
    getStore().departments.push(storedItem);
    return res.status(201).json({ success: true, data: storedItem });
  } catch {
    return res.status(500).json({ success: false, message: 'Unable to save department.' });
  }
});

router.get('/branches', requireAuth, requireRole('SUPER_ADMIN', 'IT_ADMIN'), async (_req, res) => {
  const data = await db.select().from(branches);
  return res.json({ success: true, data });
});

router.post('/branches', requireAuth, requireRole('SUPER_ADMIN'), async (req, res) => {
  const { name, code, region } = req.body || {};
  if (!name || !code) return res.status(400).json({ success: false, message: 'Branch name and code are required.' });

  try {
    const [item] = await db.insert(branches).values({ id: randomUUID(), name, code, region: region || '' }).returning();
    const storedItem = { ...item, code: item.code || '', region: item.region || '' };
    getStore().branches.push(storedItem);
    return res.status(201).json({ success: true, data: storedItem });
  } catch {
    return res.status(500).json({ success: false, message: 'Unable to save branch.' });
  }
});

router.get('/roles', requireAuth, requireRole('SUPER_ADMIN', 'IT_ADMIN'), async (_req, res) => {
  const data = await db.select().from(roles);
  return res.json({ success: true, data });
});

router.get('/permissions', requireAuth, requireRole('SUPER_ADMIN', 'IT_ADMIN'), async (_req, res) => {
  const data = await db.select().from(permissions);
  return res.json({ success: true, data });
});

export { router as masterDataRoutes };
