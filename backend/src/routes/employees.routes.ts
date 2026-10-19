import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { encryptSensitiveValue } from '../utils/sensitive-data.js';
import { createAuditLog, createEmployeeAccount, deriveRolePermissions, getStore, type EmployeeStatus, type UserRole } from '../store.js';
import { requireAuth, requirePermission, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();
const initialEmployeePassword = 'employee@123';
const employeeSelect = `e.id, e.employee_id AS "employeeId", e.name, e.father_name AS "fatherName", e.mother_name AS "motherName",
  e.mobile_number AS "mobileNumber", e.alternate_mobile_number AS "alternateMobileNumber", e.email, e.dob, e.gender,
  e.designation, e.system_role AS "systemRole", e.department, e.branch, e.joining_date AS "joiningDate",
  e.reporting_manager AS "reportingManager", e.address_line_1 AS "addressLine1", e.address_line_2 AS "addressLine2",
  e.city, e.state, e.district, e.pincode, e.status, e.created_by AS "createdBy", e.updated_by AS "updatedBy",
  e.created_at AS "createdAt", e.updated_at AS "updatedAt", u.last_login_at AS "lastLoginAt",
  u.last_password_reset_at AS "lastPasswordResetAt"`;

const parsePage = (value: unknown, fallback: number, maximum: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
};

const isAdmin = (role?: string) => role === 'SUPER_ADMIN' || role === 'IT_ADMIN';

const getEmployeeById = async (employeeId: string) => {
  const result = await pool.query(`SELECT ${employeeSelect} FROM employees e LEFT JOIN users u ON u.employee_id = e.employee_id WHERE e.employee_id = $1`, [employeeId]);
  return result.rows[0] || null;
};

router.get('/', requireAuth, requirePermission('perm-employee.view'), async (req, res) => {
  const page = parsePage(req.query.page, 1, Number.MAX_SAFE_INTEGER);
  const limit = parsePage(req.query.limit, 20, 100);
  const values: unknown[] = [];
  const filters: string[] = [];
  const addFilter = (sql: string, value: unknown) => {
    values.push(value);
    filters.push(sql.replace(/\?/g, `$${values.length}`));
  };

  const query = String(req.query.query || '').trim();
  if (query) addFilter('(e.employee_id ILIKE ? OR e.name ILIKE ?)', `%${query}%`);
  if (req.query.branch) addFilter('e.branch = ?', String(req.query.branch));
  if (req.query.designation) addFilter('e.designation = ?', String(req.query.designation));
  if (req.query.role && req.query.role !== 'ALL') addFilter('e.system_role = ?', String(req.query.role));
  if (req.query.status && req.query.status !== 'ALL') addFilter('e.status = ?', String(req.query.status));

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const countResult = await pool.query(`SELECT count(*)::int AS total FROM employees e ${where}`, values);
  const total = countResult.rows[0].total as number;
  const offset = (page - 1) * limit;
  const pageValues = [...values, limit, offset];
  const result = await pool.query(
    `SELECT ${employeeSelect} FROM employees e LEFT JOIN users u ON u.employee_id = e.employee_id ${where}
     ORDER BY e.created_at DESC, e.employee_id ASC LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
    pageValues,
  );

  return res.json({ success: true, data: { items: result.rows, page, limit, total, totalPages: Math.ceil(total / limit) } });
});

router.get('/stats', requireAuth, requirePermission('perm-employee.view'), async (_req, res) => {
  const result = await pool.query(`SELECT count(*)::int AS total,
    count(*) FILTER (WHERE status = 'ACTIVE')::int AS active,
    count(*) FILTER (WHERE status = 'INACTIVE')::int AS inactive,
    count(*) FILTER (WHERE system_role = 'IT_ADMIN')::int AS "adminCount",
    count(*) FILTER (WHERE system_role = 'EMPLOYEE')::int AS "staffCount" FROM employees`);
  return res.json({ success: true, data: result.rows[0] });
});

router.get('/lookups', requireAuth, requirePermission('perm-employee.view'), async (_req, res) => {
  const [branches, designations, departments, managers] = await Promise.all([
    pool.query('SELECT name FROM branches ORDER BY name'),
    pool.query('SELECT name, department FROM designations ORDER BY department, name'),
    pool.query('SELECT name FROM departments ORDER BY name'),
    pool.query("SELECT employee_id AS \"employeeId\", name, designation FROM employees WHERE status = 'ACTIVE' ORDER BY name"),
  ]);
  return res.json({ success: true, data: { branches: branches.rows, designations: designations.rows, departments: departments.rows, managers: managers.rows } });
});

router.get('/:employeeId', requireAuth, requirePermission('perm-employee.view'), async (req, res) => {
  const employee = await getEmployeeById(req.params.employeeId);
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found.' });
  const audit = await pool.query(
    'SELECT actor_employee_id AS "performedBy", actor_name AS "performedByName", action, details, previous_value AS "previousValue", new_value AS "newValue", reason, created_at AS "createdAt" FROM audit_logs WHERE target_employee_id = $1 ORDER BY created_at DESC LIMIT 50',
    [req.params.employeeId],
  );
  return res.json({ success: true, data: { employee, audit: audit.rows } });
});

router.post('/', requireAuth, requirePermission('perm-employee.create'), requireRole('SUPER_ADMIN', 'IT_ADMIN'), async (req, res) => {
  const actorRole = req.user?.role as UserRole;
  const payload = req.body || {};
  const requiredFields = ['employeeName', 'mobileNumber', 'gender', 'designation', 'systemRole', 'department', 'branch', 'joiningDate'];

  if (requiredFields.some((field) => !payload[field])) {
    return res.status(400).json({ success: false, message: 'Please complete all required employee details.' });
  }

  const role = payload.systemRole as UserRole;
  if (role !== 'EMPLOYEE' && role !== 'IT_ADMIN') {
    return res.status(400).json({ success: false, message: 'Only EMPLOYEE or IT_ADMIN accounts can be created here.' });
  }
  if (role === 'IT_ADMIN' && (actorRole !== 'SUPER_ADMIN' || String(payload.designation).trim().toUpperCase() !== 'IT')) {
    return res.status(403).json({ success: false, message: 'Only Super Admin can create an IT Admin, and its designation must be IT.' });
  }
  if (!/^\d{10}$/.test(String(payload.mobileNumber))) return res.status(400).json({ success: false, message: 'Mobile number must contain exactly 10 digits.' });
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
  if (!['MALE', 'FEMALE', 'OTHER'].includes(payload.gender)) return res.status(400).json({ success: false, message: 'Select a valid gender.' });
  const designationMatch = await pool.query('SELECT 1 FROM designations WHERE lower(name) = lower($1) AND lower(department) = lower($2)', [String(payload.designation).trim(), String(payload.department).trim()]);
  if (!designationMatch.rowCount) return res.status(400).json({ success: false, message: 'The selected designation does not belong to the selected department.' });

  try {
    const created = await createEmployeeAccount({
      employeeName: String(payload.employeeName).trim(),
      fatherName: String(payload.fatherName || '').trim(),
      motherName: String(payload.motherName || '').trim(),
      mobileNumber: String(payload.mobileNumber),
      alternateMobileNumber: String(payload.alternateMobileNumber || ''),
      email: String(payload.email || '').trim(),
      dob: String(payload.dob || ''),
      gender: payload.gender,
      designation: String(payload.designation).trim(),
      systemRole: role,
      department: String(payload.department).trim(),
      branch: String(payload.branch).trim(),
      joiningDate: String(payload.joiningDate),
      reportingManager: String(payload.reportingManager || ''),
      addressLine1: String(payload.addressLine1 || ''),
      addressLine2: String(payload.addressLine2 || ''),
      city: String(payload.city || ''),
      state: String(payload.state || ''),
      district: String(payload.district || ''),
      pincode: String(payload.pincode || ''),
      bankName: String(payload.bankName || ''),
      bankAccountNumber: String(payload.bankAccountNumber || ''),
      bankIfsc: String(payload.bankIfsc || ''),
      bankBranch: String(payload.bankBranch || ''),
      employeeStatus: payload.employeeStatus === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      defaultPassword: initialEmployeePassword,
      createdBy: req.user!.employeeId,
      actorName: req.user!.name || req.user!.employeeId,
    });

    if (!created.success || !created.payload) return res.status(409).json({ success: false, message: created.message || 'Unable to create employee.' });

    const createdEmployee = created.payload.employee;
    const { bankAccountNumber: _bankAccountNumber, bankIfsc: _bankIfsc, bankName: _bankName, bankBranch: _bankBranch, ...safeEmployee } = createdEmployee;
    return res.status(201).json({ success: true, message: 'Employee created successfully.', data: {
      employee: safeEmployee,
      employeeId: createdEmployee.employeeId,
      temporaryPassword: created.payload.temporaryPassword,
    } });
  } catch (error) {
    console.error('Employee creation failed:', error);
    return res.status(500).json({ success: false, message: 'Unable to create employee.' });
  }
});

router.patch('/:employeeId', requireAuth, requirePermission('perm-employee.edit'), requireRole('SUPER_ADMIN', 'IT_ADMIN'), async (req, res) => {
  const employeeId = req.params.employeeId;
  const current = await getEmployeeById(employeeId);
  if (!current) return res.status(404).json({ success: false, message: 'Employee not found.' });
  if (current.systemRole === 'SUPER_ADMIN') return res.status(403).json({ success: false, message: 'The Super Admin account is protected.' });
  if (req.user?.role === 'IT_ADMIN' && current.systemRole !== 'EMPLOYEE') return res.status(403).json({ success: false, message: 'IT Admin can only edit normal employee records.' });

  const allowed = ['name', 'fatherName', 'motherName', 'mobileNumber', 'alternateMobileNumber', 'email', 'dob', 'gender', 'designation', 'department', 'branch', 'joiningDate', 'reportingManager', 'addressLine1', 'addressLine2', 'city', 'state', 'district', 'pincode', 'bankName', 'bankAccountNumber', 'bankIfsc', 'bankBranch'] as const;
  const columnMap: Record<(typeof allowed)[number], string> = {
    name: 'name', fatherName: 'father_name', motherName: 'mother_name', mobileNumber: 'mobile_number', alternateMobileNumber: 'alternate_mobile_number',
    email: 'email', dob: 'dob', gender: 'gender', designation: 'designation', department: 'department', branch: 'branch', joiningDate: 'joining_date',
    reportingManager: 'reporting_manager', addressLine1: 'address_line_1', addressLine2: 'address_line_2', city: 'city', state: 'state', district: 'district',
    pincode: 'pincode', bankName: 'bank_name', bankAccountNumber: 'bank_account_number', bankIfsc: 'bank_ifsc', bankBranch: 'bank_branch',
  };
  const fields = allowed.filter((field) => req.body?.[field] !== undefined);
  const nextRole = req.body.systemRole as UserRole | undefined;
  if (!fields.length && nextRole === undefined) return res.status(400).json({ success: false, message: 'No editable employee fields were provided.' });
  if (nextRole !== undefined && req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ success: false, message: 'Only Super Admin can change system roles.' });
  if (nextRole !== undefined && nextRole !== 'EMPLOYEE' && nextRole !== 'IT_ADMIN') return res.status(400).json({ success: false, message: 'The Super Admin role cannot be assigned through employee management.' });
  const resultingRole = nextRole || current.systemRole;
  const resultingDesignation = String(req.body.designation ?? current.designation).trim().toUpperCase();
  const resultingDepartment = String(req.body.department ?? current.department).trim();
  if (resultingRole === 'IT_ADMIN' && resultingDesignation !== 'IT') return res.status(400).json({ success: false, message: 'IT_ADMIN requires the IT designation. Demote the role before changing the designation.' });
  const designationMatch = await pool.query('SELECT 1 FROM designations WHERE lower(name) = lower($1) AND lower(department) = lower($2)', [String(req.body.designation ?? current.designation).trim(), resultingDepartment]);
  if (!designationMatch.rowCount) return res.status(400).json({ success: false, message: 'The selected designation does not belong to the selected department.' });
  if (req.body.mobileNumber !== undefined && !/^\d{10}$/.test(String(req.body.mobileNumber))) return res.status(400).json({ success: false, message: 'Mobile number must contain exactly 10 digits.' });
  if (req.body.gender !== undefined && !['MALE', 'FEMALE', 'OTHER'].includes(req.body.gender)) return res.status(400).json({ success: false, message: 'Select a valid gender.' });
  if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(req.body.email))) return res.status(400).json({ success: false, message: 'Enter a valid email address.' });

  const values: unknown[] = [];
  const assignments = fields.map((field) => {
    values.push(field === 'bankAccountNumber' ? encryptSensitiveValue(String(req.body[field] || '')) : req.body[field]);
    return `${columnMap[field]} = $${values.length}`;
  });
  if (nextRole !== undefined) {
    values.push(nextRole);
    assignments.push(`system_role = $${values.length}`);
  }
  values.push(req.user!.employeeId, employeeId);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE employees SET ${assignments.join(', ')}, updated_by = $${values.length - 1}, updated_at = NOW() WHERE employee_id = $${values.length}`, values);
    if (req.body.name !== undefined) {
      await client.query('UPDATE users SET name = $1, updated_at = NOW() WHERE employee_id = $2', [req.body.name, employeeId]);
    }
    if (nextRole !== undefined) {
      await client.query('UPDATE users SET role = $1, permissions = $2::jsonb, auth_version = auth_version + 1, updated_at = NOW() WHERE employee_id = $3', [nextRole, JSON.stringify(deriveRolePermissions(nextRole)), employeeId]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  const updated = await getEmployeeById(employeeId);
  const cachedUser = getStore().users.find((user) => user.employeeId === employeeId);
  if (req.body.name !== undefined && cachedUser) cachedUser.name = String(req.body.name);
  if (nextRole !== undefined && cachedUser) {
    cachedUser.role = nextRole;
    cachedUser.permissions = deriveRolePermissions(nextRole);
    cachedUser.authVersion = (cachedUser.authVersion || 0) + 1;
  }
  const action = nextRole && nextRole !== current.systemRole ? 'Role Changed' : req.body.designation !== undefined && req.body.designation !== current.designation ? 'Designation Changed' : req.body.branch !== undefined && req.body.branch !== current.branch ? 'Branch Changed' : 'Employee Updated';
  createAuditLog(req.user!.employeeId, req.user!.name || req.user!.employeeId, action, `Updated employee ${employeeId}.`, employeeId, current, updated);
  return res.json({ success: true, data: { employee: updated } });
});

router.patch('/:employeeId/status', requireAuth, requirePermission('perm-employee.edit'), requireRole('SUPER_ADMIN', 'IT_ADMIN'), async (req, res) => {
  const employeeId = req.params.employeeId;
  const status = req.body?.status as EmployeeStatus;
  if (!['ACTIVE', 'INACTIVE'].includes(status)) return res.status(400).json({ success: false, message: 'Status must be ACTIVE or INACTIVE.' });
  const current = await getEmployeeById(employeeId);
  if (!current) return res.status(404).json({ success: false, message: 'Employee not found.' });
  if (current.systemRole === 'SUPER_ADMIN' || employeeId === req.user?.employeeId && req.user?.role === 'SUPER_ADMIN') return res.status(403).json({ success: false, message: 'The Super Admin account cannot be deactivated.' });
  if (req.user?.role === 'IT_ADMIN' && current.systemRole !== 'EMPLOYEE') return res.status(403).json({ success: false, message: 'IT Admin can only change normal employee status.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE employees SET status = $1, is_active = $2, updated_by = $3, updated_at = NOW() WHERE employee_id = $4', [status, status === 'ACTIVE', req.user!.employeeId, employeeId]);
    await client.query('UPDATE users SET status = $1, auth_version = auth_version + 1, updated_at = NOW() WHERE employee_id = $2', [status, employeeId]);
    await client.query('INSERT INTO audit_logs (id, actor_employee_id, actor_name, target_employee_id, action, details, previous_value, new_value) VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)', [req.user!.employeeId, req.user!.name, employeeId, status === 'ACTIVE' ? 'Employee Activated' : 'Employee Deactivated', `${status === 'ACTIVE' ? 'Activated' : 'Deactivated'} employee ${employeeId}.`, JSON.stringify({ status: current.status }), JSON.stringify({ status })]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  const updated = await getEmployeeById(employeeId);
  const activeStore = getStore();
  const cachedEmployee = activeStore.employees.find((employee) => employee.employeeId === employeeId);
  if (cachedEmployee) cachedEmployee.status = status;
  const cachedUser = activeStore.users.find((user) => user.employeeId === employeeId);
  if (cachedUser) cachedUser.status = status;
  const auditLog = { id: `${Date.now()}-${employeeId}`, actorEmployeeId: req.user!.employeeId, actorName: req.user!.name || req.user!.employeeId, action: status === 'ACTIVE' ? 'Employee Activated' : 'Employee Deactivated', details: `Changed employee ${employeeId} status to ${status}.`, createdAt: new Date().toISOString() };
  getStore().auditLogs.unshift(auditLog);
  return res.json({ success: true, data: { employee: updated } });
});

router.post('/:employeeId/reset-password', requireAuth, requirePermission('perm-password.manage'), requireRole('SUPER_ADMIN', 'IT_ADMIN'), async (req, res) => {
  const { newPassword, confirmPassword, reason } = req.body || {};
  const employeeId = req.params.employeeId;
  if (typeof newPassword !== 'string' || newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
  if (newPassword !== confirmPassword) return res.status(400).json({ success: false, message: 'New password and confirmation do not match.' });
  const target = await pool.query('SELECT role FROM users WHERE employee_id = $1', [employeeId]);
  if (!target.rowCount) return res.status(404).json({ success: false, message: 'Employee account not found.' });
  if (req.user?.role === 'IT_ADMIN' && target.rows[0].role !== 'EMPLOYEE' && employeeId !== req.user.employeeId) return res.status(403).json({ success: false, message: 'IT Admin cannot reset another administrator or Super Admin account.' });
  if (target.rows[0].role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ success: false, message: 'Only Super Admin can reset the Super Admin account.' });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE users SET password_hash = $1, first_login_required = true, auth_version = auth_version + 1, last_password_reset_at = NOW(), updated_at = NOW() WHERE employee_id = $2', [passwordHash, employeeId]);
    await client.query('INSERT INTO audit_logs (id, actor_employee_id, actor_name, target_employee_id, action, details, reason) VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6)', [req.user!.employeeId, req.user!.name || req.user!.employeeId, employeeId, 'Password Reset', `Reset password for employee ${employeeId}.`, reason || null]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  const user = getStore().users.find((item) => item.employeeId === employeeId);
  if (user) {
    user.passwordHash = passwordHash;
    user.firstLoginRequired = true;
    user.authVersion = (user.authVersion || 0) + 1;
    user.lastPasswordResetAt = new Date().toISOString();
  }
  return res.json({ success: true, message: `Password reset successfully. Employee ${employeeId} can sign in with the new password.` });
});

export { router as employeesRoutes };
