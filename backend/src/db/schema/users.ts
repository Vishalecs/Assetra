import { pgEnum, pgTable, varchar, text, timestamp, boolean, jsonb, integer, primaryKey } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['SUPER_ADMIN', 'IT_ADMIN', 'EMPLOYEE']);
export const employeeStatusEnum = pgEnum('employee_status', ['ACTIVE', 'INACTIVE']);

export const roles = pgTable('roles', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: userRoleEnum('name').notNull(),
  description: text('description'),
  isSystemRole: boolean('is_system_role').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const permissions = pgTable('permissions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  key: varchar('key', { length: 128 }).notNull().unique(),
  module: text('module').notNull(),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: varchar('role_id', { length: 64 }).notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: varchar('permission_id', { length: 64 }).notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => ({ pk: primaryKey({ columns: [table.roleId, table.permissionId] }) }));

export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  employeeId: varchar('employee_id', { length: 32 }).notNull().unique(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull(),
  passwordHash: text('password_hash').notNull(),
  permissions: jsonb('permissions').$type<string[]>().default([]).notNull(),
  status: employeeStatusEnum('status').default('ACTIVE').notNull(),
  firstLoginRequired: boolean('first_login_required').default(true).notNull(),
  authVersion: integer('auth_version').default(0).notNull(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  lastPasswordResetAt: timestamp('last_password_reset_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
