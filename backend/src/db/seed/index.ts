import 'dotenv/config';
import bcrypt from 'bcryptjs';
import env from '../../config/env.js';
import { db } from '../../config/db';
import { departments, designations, employees, permissions, rolePermissions, roles, users } from '../schema';
import { sql } from 'drizzle-orm';

export const seedDatabase = async () => {
  if (!env.INITIAL_SUPER_ADMIN_ID || !env.INITIAL_SUPER_ADMIN_NAME || !env.INITIAL_SUPER_ADMIN_PASSWORD) {
    throw new Error('Set INITIAL_SUPER_ADMIN_ID, INITIAL_SUPER_ADMIN_NAME, and INITIAL_SUPER_ADMIN_PASSWORD before seeding.');
  }
  if (env.INITIAL_SUPER_ADMIN_ID !== 'AST0001') throw new Error('The primary Super Admin employee ID must remain AST0001.');

  await db.insert(roles).values([
    { id: 'role-super-admin', name: 'SUPER_ADMIN', description: 'Full system access', isSystemRole: true },
    { id: 'role-it-admin', name: 'IT_ADMIN', description: 'IT and employee operations access', isSystemRole: true },
    { id: 'role-employee', name: 'EMPLOYEE', description: 'Operational access for personal and assigned work', isSystemRole: true },
  ]).onConflictDoNothing();

  const permissionDefinitions = [
    { id: 'perm-dashboard.view', key: 'dashboard.view', module: 'dashboard', resource: 'dashboard', action: 'view', description: 'View dashboard' },
    { id: 'perm-profile.view', key: 'profile.view', module: 'profile', resource: 'profile', action: 'view', description: 'View own profile' },
    { id: 'perm-employee.view', key: 'employees.view', module: 'employees', resource: 'employee', action: 'view', description: 'View employee records' },
    { id: 'perm-employee.create', key: 'employees.create', module: 'employees', resource: 'employee', action: 'create', description: 'Create employee records' },
    { id: 'perm-employee.edit', key: 'employees.edit', module: 'employees', resource: 'employee', action: 'edit', description: 'Edit employee records and status' },
    { id: 'perm-password.manage', key: 'passwords.manage', module: 'passwords', resource: 'password', action: 'manage', description: 'Reset permitted employee passwords' },
    { id: 'perm-audit.view', key: 'audit.view', module: 'audit', resource: 'audit', action: 'view', description: 'View employee audit history' },
  ];
  await db.insert(permissions).values(permissionDefinitions).onConflictDoNothing();
  await db.insert(rolePermissions).values([
    ...permissionDefinitions.map((permission) => ({ roleId: 'role-super-admin', permissionId: permission.id })),
    ...permissionDefinitions.filter((permission) => permission.id !== 'perm-audit.view').map((permission) => ({ roleId: 'role-it-admin', permissionId: permission.id })),
    { roleId: 'role-employee', permissionId: 'perm-dashboard.view' },
    { roleId: 'role-employee', permissionId: 'perm-profile.view' },
  ]).onConflictDoNothing();

  const designationOptions = [
    { name: 'IT', department: 'IT' },
    { name: 'IT Executive', department: 'IT' },
    { name: 'Developer', department: 'IT' },
    { name: 'IT Support', department: 'IT' },
    { name: 'System Administrator', department: 'IT' },
    { name: 'Software Engineer', department: 'IT' },
    { name: 'Network Administrator', department: 'IT' },
    { name: 'Sales Officer', department: 'Sales' },
    { name: 'Field Officer', department: 'Sales' },
    { name: 'Relationship Officer', department: 'Sales' },
    { name: 'Branch Officer', department: 'Sales' },
    { name: 'Credit Officer', department: 'Credit' },
    { name: 'Loan Officer', department: 'Credit' },
    { name: 'Credit Analyst', department: 'Credit' },
    { name: 'HR Executive', department: 'HR' },
    { name: 'HR Manager', department: 'HR' },
    { name: 'HR Officer', department: 'HR' },
    { name: 'Collection Officer', department: 'Collections' },
    { name: 'Other', department: 'Other' },
  ];
  await db.insert(designations).values(designationOptions.map(({ name, department }) => ({
    id: `designation-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name,
    department,
    description: null,
  }))).onConflictDoUpdate({
    target: designations.id,
    set: { department: sql`excluded.department` },
  });
  await db.insert(departments).values([
    'Sales', 'Credit', 'Operations', 'IT', 'Finance', 'HR', 'Collections', 'Administration', 'Other',
  ].map((name) => ({ id: `department-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name, description: null }))).onConflictDoNothing();

  await db.insert(users).values({
    id: `user-${env.INITIAL_SUPER_ADMIN_ID}`,
    employeeId: env.INITIAL_SUPER_ADMIN_ID,
    name: env.INITIAL_SUPER_ADMIN_NAME,
    role: 'SUPER_ADMIN',
    passwordHash: bcrypt.hashSync(env.INITIAL_SUPER_ADMIN_PASSWORD, 12),
    permissions: ['*'],
    status: 'ACTIVE',
    firstLoginRequired: false,
  }).onConflictDoNothing();

  await db.insert(employees).values({
    id: `employee-${env.INITIAL_SUPER_ADMIN_ID}`,
    employeeId: env.INITIAL_SUPER_ADMIN_ID,
    name: env.INITIAL_SUPER_ADMIN_NAME,
    systemRole: 'SUPER_ADMIN',
    status: 'ACTIVE',
    isActive: true,
    createdBy: env.INITIAL_SUPER_ADMIN_ID,
    updatedBy: env.INITIAL_SUPER_ADMIN_ID,
  }).onConflictDoNothing();
};

(async () => {
  try {
    await seedDatabase();
    console.log('ASSETRA PostgreSQL seed completed successfully.');
  } catch (error) {
    console.error('ASSETRA PostgreSQL seed failed:', error);
    process.exit(1);
  }
})();
