import { pgTable, varchar, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const designations = pgTable('designations', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: text('name').notNull(),
  department: text('department').notNull().default(''),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({ nameByDepartmentUnique: uniqueIndex('designations_department_name_unique').on(table.department, table.name) }));

export const departments = pgTable('departments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const branches = pgTable('branches', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: text('name').notNull(),
  code: varchar('code', { length: 32 }),
  region: text('region'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
