import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import env from '../config/env.js';
import { createAuditLog, getStore, getUserByEmployeeId } from '../store.js';
import { requireAuth, requirePermission, requireRole } from '../middlewares/auth.middleware.js';
import { apiError, apiSuccess } from '../utils/response.js';

const router = Router();
const tokenCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
};

router.post('/login', async (req, res) => {
  const { employeeId, password } = req.body || {};

  if (!employeeId || !password) {
    return apiError(res, 'Employee ID and password are required.', 400);
  }

  const normalizedEmployeeId = String(employeeId).trim();
  const userResult = await pool.query(
    `SELECT u.id, u.employee_id AS "employeeId", u.name, u.role, u.password_hash AS "passwordHash", u.status,
      u.first_login_required AS "firstLoginRequired", u.auth_version AS "authVersion",
      COALESCE((SELECT jsonb_agg(rp.permission_id) FROM role_permissions rp WHERE rp.role_id = r.id), '[]'::jsonb) AS "rolePermissions",
      COALESCE((SELECT jsonb_agg(ep.permission_id) FROM employee_permissions ep WHERE ep.employee_id = u.employee_id), '[]'::jsonb) AS "employeePermissions"
     FROM users u LEFT JOIN roles r ON r.name = u.role WHERE u.employee_id = $1`,
    [normalizedEmployeeId],
  );
  const user = userResult.rows[0] as {
    id: string; employeeId: string; name: string; role: 'SUPER_ADMIN' | 'IT_ADMIN' | 'EMPLOYEE'; passwordHash: string;
    rolePermissions: string[]; employeePermissions: string[]; status: 'ACTIVE' | 'INACTIVE'; firstLoginRequired: boolean; authVersion: number;
  } | undefined;

  if (!user) {
    return apiError(res, 'Invalid employee ID or password.', 401);
  }

  if (user.status !== 'ACTIVE') {
    return apiError(res, 'This employee account is inactive. Please contact the administrator.', 403);
  }

  const passwordMatches = await bcrypt.compare(String(password), user.passwordHash);
  if (!passwordMatches) {
    return apiError(res, 'Invalid employee ID or password.', 401);
  }

  const payload = {
    userId: user.id,
    employeeId: user.employeeId,
    role: user.role,
    permissions: user.role === 'SUPER_ADMIN' ? ['*'] : [...new Set([...(user.rolePermissions || []), ...(user.employeePermissions || [])])],
    name: user.name,
    authVersion: user.authVersion || 0,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '8h' });

  res.cookie('token', token, {
    ...tokenCookieOptions,
    maxAge: 8 * 60 * 60 * 1000,
  });

  createAuditLog(user.employeeId, user.name, 'Login', 'User signed in successfully.');
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE employee_id = $1', [user.employeeId]);

  return apiSuccess(res, {
    user: payload,
    token,
    requiresPasswordChange: user.firstLoginRequired,
  });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token', tokenCookieOptions);
  return apiSuccess(res, { loggedOut: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT u.id AS "userId", u.employee_id AS "employeeId", u.name, u.role, u.first_login_required AS "firstLoginRequired",
      e.designation, e.department, e.branch, e.mobile_number AS "mobileNumber", e.email, e.joining_date AS "joiningDate", e.system_role AS "systemRole"
     FROM users u LEFT JOIN employees e ON e.employee_id = u.employee_id WHERE u.employee_id = $1`,
    [req.user?.employeeId],
  );
  const profile = result.rows[0];
  if (!profile) return apiError(res, 'Employee profile not found.', 404);

  return apiSuccess(res, {
    user: {
      userId: profile.userId,
      employeeId: profile.employeeId,
      role: req.user?.role,
      permissions: req.user?.permissions || [],
      name: profile.name,
      designation: profile.designation || '',
      department: profile.department || '',
      branch: profile.branch || '',
      mobileNumber: profile.mobileNumber || '',
      email: profile.email || '',
      joiningDate: profile.joiningDate || '',
      systemRole: profile.systemRole || req.user?.role || 'EMPLOYEE',
      firstLoginRequired: profile.firstLoginRequired,
      requiresPasswordChange: profile.firstLoginRequired,
    },
  });
});

router.post('/first-login-password', requireAuth, async (req, res) => {
  const { newPassword, confirmPassword } = req.body || {};
  if (typeof newPassword !== 'string' || newPassword.length < 8) return apiError(res, 'Password must be at least 8 characters long.', 400);
  if (newPassword !== confirmPassword) return apiError(res, 'New password and confirmation do not match.', 400);

  const current = await pool.query('SELECT password_hash FROM users WHERE employee_id = $1 AND first_login_required = true', [req.user!.employeeId]);
  if (!current.rowCount) return apiError(res, 'A first-login password change is not required.', 409);
  if (await bcrypt.compare(newPassword, current.rows[0].password_hash)) {
    return apiError(res, 'Choose a password different from the temporary password.', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const updated = await pool.query(
    'UPDATE users SET password_hash = $1, first_login_required = false, auth_version = auth_version + 1, last_password_reset_at = NOW(), updated_at = NOW() WHERE employee_id = $2 AND first_login_required = true RETURNING auth_version AS "authVersion"',
    [passwordHash, req.user!.employeeId],
  );
  if (!updated.rowCount) return apiError(res, 'Password setup is already complete. Sign in again.', 409);

  const user = getUserByEmployeeId(req.user!.employeeId);
  if (user) {
    user.passwordHash = passwordHash;
    user.firstLoginRequired = false;
    user.authVersion = updated.rows[0].authVersion;
    user.lastPasswordResetAt = new Date().toISOString();
  }
  const token = jwt.sign({
    userId: req.user!.userId,
    employeeId: req.user!.employeeId,
    role: req.user!.role,
    permissions: req.user!.permissions,
    name: req.user!.name,
    authVersion: updated.rows[0].authVersion,
  }, env.JWT_SECRET, { expiresIn: '8h' });
  res.cookie('token', token, {
    ...tokenCookieOptions,
    maxAge: 8 * 60 * 60 * 1000,
  });
  createAuditLog(req.user!.employeeId, req.user!.name || req.user!.employeeId, 'Password Changed', 'Completed required first-login password setup.', req.user!.employeeId);
  return apiSuccess(res, { message: 'Password changed successfully.', requiresPasswordChange: false });
});

router.post('/refresh', (req, res) => {
  const currentToken = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!currentToken) {
    return apiError(res, 'No token to refresh.', 401);
  }

  try {
    const decoded = jwt.verify(currentToken, env.JWT_SECRET) as any;
    const user = getUserByEmployeeId(String(decoded.employeeId || ''));
    if (!user || user.status !== 'ACTIVE' || (decoded.authVersion ?? 0) !== (user.authVersion || 0)) {
      return apiError(res, 'Refresh token is no longer valid.', 401);
    }
    const fresh = jwt.sign(
      {
        userId: user.id,
        employeeId: user.employeeId,
        role: user.role,
        permissions: user.permissions,
        name: user.name,
        authVersion: user.authVersion || 0,
      },
      env.JWT_SECRET,
      { expiresIn: '8h' },
    );

    res.cookie('token', fresh, {
      ...tokenCookieOptions,
      maxAge: 8 * 60 * 60 * 1000,
    });

    return apiSuccess(res, { token: fresh });
  } catch {
    return apiError(res, 'Refresh token is invalid.', 401);
  }
});

router.post('/forgot-password', async (_req, res) => {
  return apiSuccess(res, { message: 'Password reset request recorded. Contact the Super Admin to reset the password.' });
});

router.post('/change-password', requireAuth, requireRole('SUPER_ADMIN', 'IT_ADMIN'), async (req, res) => {
  const { currentPassword, newPassword, confirmPassword, employeeId } = req.body || {};
  const targetEmployeeId = employeeId || req.user?.employeeId || '';
  const isSelfChange = targetEmployeeId === req.user?.employeeId;
  const hasAdminRole = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'IT_ADMIN';

  if (!newPassword || !confirmPassword) {
    return apiError(res, 'New password and confirm password are required.', 400);
  }

  if (newPassword !== confirmPassword) {
    return apiError(res, 'New password and confirm password do not match.', 400);
  }

  if (String(newPassword).length < 8) {
    return apiError(res, 'Password must be at least 8 characters long.', 400);
  }

  const user = getUserByEmployeeId(targetEmployeeId);
  if (!user) {
    return apiError(res, 'The user account could not be located.', 404);
  }

  if (hasAdminRole && !isSelfChange) {
    if (req.user?.role === 'IT_ADMIN' && user.role !== 'EMPLOYEE') {
      return apiError(res, 'IT Admin is not allowed to change this account type.', 403);
    }
  }

  if (isSelfChange) {
    if (!currentPassword) {
      return apiError(res, 'Current password is required to change your password.', 400);
    }

    const matchesCurrentPassword = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!matchesCurrentPassword) {
      return apiError(res, 'The current password is incorrect.', 401);
    }
  }

  user.passwordHash = await bcrypt.hash(String(newPassword), 12);
  user.firstLoginRequired = !isSelfChange;
  user.authVersion = (user.authVersion || 0) + 1;
  user.lastPasswordResetAt = new Date().toISOString();
  user.updatedAt = new Date().toISOString();
  await pool.query('UPDATE users SET password_hash = $1, first_login_required = $2, auth_version = auth_version + 1, last_password_reset_at = NOW(), updated_at = NOW() WHERE employee_id = $3', [user.passwordHash, !isSelfChange, targetEmployeeId]);

  createAuditLog(user.employeeId, user.name, 'Password changed', `${req.user?.employeeId || 'System'} updated password for ${user.employeeId}.`);

  return apiSuccess(res, {
    success: true,
    message: isSelfChange ? 'Password changed successfully.' : 'Password updated successfully. The employee must change this password on their next login.',
  });
});

router.post('/reset-password', requireAuth, requirePermission('perm-password.manage'), requireRole('SUPER_ADMIN', 'IT_ADMIN'), async (req, res) => {
  const { employeeId, newPassword, confirmPassword } = req.body || {};

  if (!employeeId || !newPassword || !confirmPassword) {
    return apiError(res, 'Employee ID, new password, and confirm password are required.', 400);
  }

  if (String(newPassword).length < 8) {
    return apiError(res, 'Password must be at least 8 characters long.', 400);
  }

  if (newPassword !== confirmPassword) {
    return apiError(res, 'New password and confirm password do not match.', 400);
  }

  const user = getUserByEmployeeId(String(employeeId).trim());
  if (!user) {
    return apiError(res, 'The user account could not be located.', 404);
  }

  if (req.user?.role === 'IT_ADMIN' && user.role !== 'EMPLOYEE' && user.employeeId !== req.user.employeeId) {
    return apiError(res, 'IT Admin is not allowed to change this account type.', 403);
  }
  if (user.role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') return apiError(res, 'Only Super Admin can reset the Super Admin account.', 403);

  user.passwordHash = await bcrypt.hash(String(newPassword), 12);
  user.firstLoginRequired = true;
  user.authVersion = (user.authVersion || 0) + 1;
  user.lastPasswordResetAt = new Date().toISOString();
  user.updatedAt = new Date().toISOString();
  await pool.query('UPDATE users SET password_hash = $1, first_login_required = true, auth_version = auth_version + 1, last_password_reset_at = NOW(), updated_at = NOW() WHERE employee_id = $2', [user.passwordHash, user.employeeId]);

  createAuditLog(req.user?.employeeId || user.employeeId, req.user?.name || user.name, 'Password reset', `Admin reset password for ${user.employeeId}.`);

  return apiSuccess(res, {
    success: true,
    message: `Password reset successfully. Employee ${user.employeeId} can sign in with the new password.`,
    employeeId: user.employeeId,
  });
});

export { router as authRoutes };
