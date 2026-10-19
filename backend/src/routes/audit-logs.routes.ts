import { Router } from 'express';
import { pool } from '../config/db.js';
import { requireAuth, requirePermission, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, requirePermission('perm-audit.view'), requireRole('SUPER_ADMIN'), async (req, res) => {
  const pageValue = Number(req.query.page || 1);
  const limitValue = Number(req.query.limit || 50);
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const limit = Number.isInteger(limitValue) && limitValue > 0 ? Math.min(limitValue, 100) : 50;
  const employeeId = String(req.query.employeeId || '').trim();
  const values: unknown[] = [];
  const where = employeeId ? (values.push(employeeId), `WHERE target_employee_id = $${values.length}`) : '';
  const count = await pool.query(`SELECT count(*)::int AS total FROM audit_logs ${where}`, values);
  const rows = await pool.query(
    `SELECT id, actor_employee_id AS "performedBy", actor_name AS "performedByName", target_employee_id AS "targetEmployeeId",
      action, details, previous_value AS "previousValue", new_value AS "newValue", reason, created_at AS "createdAt"
     FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, (page - 1) * limit],
  );
  return res.json({ success: true, data: { items: rows.rows, page, limit, total: count.rows[0].total, totalPages: Math.ceil(count.rows[0].total / limit) } });
});

export { router as auditLogsRoutes };