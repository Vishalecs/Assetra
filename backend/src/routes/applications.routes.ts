import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../config/db.js';
import { applications } from '../db/schema/index.js';
import { getStore, initializeStore, store } from '../store.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, (_req, res) => {
  initializeStore();
  const globalObj = globalThis as typeof globalThis & { __assetra_store?: typeof store };
  if (!globalObj.__assetra_store) {
    globalObj.__assetra_store = store;
  }
  res.json({ success: true, data: { items: [...globalObj.__assetra_store.applications] } });
});

router.post('/', requireAuth, async (req, res) => {
  initializeStore();
  const globalObj = globalThis as typeof globalThis & { __assetra_store?: typeof store };
  if (!globalObj.__assetra_store) {
    globalObj.__assetra_store = store;
  }
  const { customerName, customerId, branch, loanOfficer, loanType, requestedAmount, applicationDate, status, assignedCreditOfficer } = req.body || {};

  if (!customerName || !customerId || !loanType || !requestedAmount) {
    return res.status(400).json({ success: false, message: 'Customer and loan details are required.' });
  }

  const now = new Date();
  const application = {
    id: randomUUID(),
    applicationNumber: `AST-${now.getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
    customerName,
    customerId,
    branch: branch || '',
    loanOfficer: loanOfficer || req.user?.name || '',
    loanType,
    requestedAmount: Number(requestedAmount),
    applicationDate: applicationDate || now.toISOString().slice(0, 10),
    status: status || 'DRAFT',
    assignedCreditOfficer: assignedCreditOfficer || '',
    lastUpdated: now,
  };

  try {
    const [savedApplication] = await db.insert(applications).values(application).returning();
    getStore().applications.unshift({
      ...savedApplication,
      customerId: savedApplication.customerId || '',
      branch: savedApplication.branch || '',
      loanOfficer: savedApplication.loanOfficer || '',
      loanType: savedApplication.loanType || '',
      requestedAmount: savedApplication.requestedAmount || 0,
      applicationDate: savedApplication.applicationDate || '',
      status: savedApplication.status || '',
      assignedCreditOfficer: savedApplication.assignedCreditOfficer || '',
      lastUpdated: savedApplication.lastUpdated.toISOString(),
    });
    return res.status(201).json({ success: true, data: savedApplication });
  } catch {
    return res.status(500).json({ success: false, message: 'Unable to save application.' });
  }
});

export { router as applicationsRoutes };
