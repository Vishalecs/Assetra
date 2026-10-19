import { pgEnum, pgTable, varchar, text, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core';
import { permissions, userRoleEnum, employeeStatusEnum } from './users.js';

export const genderEnum = pgEnum('gender', ['MALE', 'FEMALE', 'OTHER']);

export const employees = pgTable('employees', {
  id: varchar('id', { length: 64 }).primaryKey(),
  employeeId: varchar('employee_id', { length: 32 }).notNull().unique(),
  name: text('name').notNull(),
  fatherName: text('father_name'),
  motherName: text('mother_name'),
  mobileNumber: varchar('mobile_number', { length: 24 }),
  alternateMobileNumber: varchar('alternate_mobile_number', { length: 24 }),
  email: varchar('email', { length: 255 }),
  dob: text('dob'),
  gender: genderEnum('gender').default('MALE'),
  designation: text('designation'),
  systemRole: userRoleEnum('system_role').notNull(),
  department: text('department'),
  branch: text('branch'),
  joiningDate: text('joining_date'),
  reportingManager: text('reporting_manager'),
  addressLine1: text('address_line_1'),
  addressLine2: text('address_line_2'),
  city: text('city'),
  state: text('state'),
  district: text('district'),
  pincode: varchar('pincode', { length: 12 }),
  bankName: text('bank_name'),
  bankAccountNumber: text('bank_account_number'),
  bankIfsc: varchar('bank_ifsc', { length: 32 }),
  bankBranch: text('bank_branch'),
  createdBy: varchar('created_by', { length: 32 }),
  updatedBy: varchar('updated_by', { length: 32 }),
  status: employeeStatusEnum('status').default('ACTIVE').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const employeePermissions = pgTable('employee_permissions', {
  employeeId: varchar('employee_id', { length: 32 }).notNull().references(() => employees.employeeId, { onDelete: 'cascade' }),
  permissionId: varchar('permission_id', { length: 64 }).notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => ({ pk: primaryKey({ columns: [table.employeeId, table.permissionId] }) }));
