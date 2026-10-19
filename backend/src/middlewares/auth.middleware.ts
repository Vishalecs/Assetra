import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { pool } from '../config/db.js';
import type { AuthUser } from '../types.js';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const tokenFromCookie = req.cookies?.token;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : tokenFromCookie;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as Partial<AuthUser> & { exp?: number; authVersion?: number };
    const result = await pool.query(
      `SELECT u.id, u.employee_id AS "employeeId", u.name, u.role, u.status,
        u.first_login_required AS "firstLoginRequired", u.auth_version AS "authVersion",
        COALESCE((SELECT jsonb_agg(rp.permission_id) FROM role_permissions rp WHERE rp.role_id = r.id), '[]'::jsonb) AS "rolePermissions",
        COALESCE((SELECT jsonb_agg(ep.permission_id) FROM employee_permissions ep WHERE ep.employee_id = u.employee_id), '[]'::jsonb) AS "employeePermissions"
       FROM users u LEFT JOIN roles r ON r.name = u.role WHERE u.employee_id = $1`,
      [decoded.employeeId],
    );
    const matchingUser = result.rows[0];
    if (!matchingUser || matchingUser.status !== 'ACTIVE' || (decoded.authVersion ?? 0) !== matchingUser.authVersion) {
      return res.status(401).json({ success: false, message: 'Session is no longer valid. Please sign in again.' });
    }
    const allowedDuringPasswordChange = ['/api/v1/auth/me', '/api/v1/auth/first-login-password'];
    if (matchingUser.firstLoginRequired && !allowedDuringPasswordChange.includes(req.originalUrl.split('?')[0])) {
      return res.status(403).json({ success: false, message: 'You must set a new password before continuing.', requiresPasswordChange: true });
    }

    const permissions = matchingUser.role === 'SUPER_ADMIN'
      ? ['*']
      : [...new Set([...(matchingUser.rolePermissions || []), ...(matchingUser.employeePermissions || [])])];

    req.user = {
      userId: matchingUser.id,
      employeeId: matchingUser.employeeId,
      role: matchingUser.role as AuthUser['role'],
      permissions,
      name: matchingUser.name,
      firstLoginRequired: matchingUser.firstLoginRequired,
    };

    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this resource.' });
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const permissions = req.user?.permissions || [];
    const hasAccess = permissions.includes('*') || permissions.includes(permission);

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied - missing required permission.' });
    }

    next();
  };
};
