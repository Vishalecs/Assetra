import { pgTable, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable('audit_logs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  actorEmployeeId: varchar('actor_employee_id', { length: 32 }).notNull(),
  actorName: text('actor_name').notNull(),
  targetEmployeeId: varchar('target_employee_id', { length: 32 }),
  action: text('action').notNull(),
  details: text('details').notNull(),
  previousValue: jsonb('previous_value'),
  newValue: jsonb('new_value'),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
