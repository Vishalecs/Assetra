import { pgTable, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const applications = pgTable('applications', {
  id: varchar('id', { length: 64 }).primaryKey(),
  applicationNumber: varchar('application_number', { length: 32 }).notNull().unique(),
  customerName: text('customer_name').notNull(),
  customerId: varchar('customer_id', { length: 32 }),
  branch: text('branch'),
  loanOfficer: text('loan_officer'),
  loanType: text('loan_type'),
  requestedAmount: integer('requested_amount').default(0),
  applicationDate: text('application_date'),
  status: text('status').default('PENDING'),
  assignedCreditOfficer: text('assigned_credit_officer'),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
