import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { applications as dbApplications, auditLogs as dbAuditLogs, branches as dbBranches, departments as dbDepartments, designations as dbDesignations, employees as dbEmployees, roles as dbRoles, users as dbUsers } from './db/schema/index.js';
import { db, pool } from './config/db.js';
import { encryptSensitiveValue } from './utils/sensitive-data.js';

export type UserRole = 'SUPER_ADMIN' | 'IT_ADMIN' | 'EMPLOYEE';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

export interface RoleRecord {
  id: string;
  name: UserRole;
  description: string;
  is_system_role: boolean;
}

export interface PermissionRecord {
  id: string;
  module: string;
  resource: string;
  action: string;
  description: string;
}

export interface UserRecord {
  id: string;
  employeeId: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  permissions: string[];
  status: EmployeeStatus;
  firstLoginRequired: boolean;
  createdAt: string;
  updatedAt: string;
  authVersion?: number;
  lastLoginAt?: string | null;
  lastPasswordResetAt?: string | null;
}

export interface EmployeeRecord {
  id: string;
  employeeId: string;
  name: string;
  fatherName: string;
  motherName: string;
  mobileNumber: string;
  email: string;
  dob: string;
  gender: string;
  designation: string;
  systemRole: UserRole;
  department: string;
  branch: string;
  joiningDate: string;
  reportingManager: string;
  alternateMobileNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  district: string;
  pincode: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankBranch: string;
  createdBy: string;
  updatedBy: string;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DesignationRecord {
  id: string;
  name: string;
  description: string;
}

export interface DepartmentRecord {
  id: string;
  name: string;
  description: string;
}

export interface BranchRecord {
  id: string;
  name: string;
  code: string;
  region: string;
}

export interface AuditLogRecord {
  id: string;
  actorEmployeeId: string;
  actorName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface ApplicationRecord {
  id: string;
  applicationNumber: string;
  customerName: string;
  customerId: string;
  branch: string;
  loanOfficer: string;
  loanType: string;
  requestedAmount: number;
  applicationDate: string;
  status: string;
  assignedCreditOfficer: string;
  lastUpdated: string;
}

export const store = {
  users: [] as UserRecord[],
  employees: [] as EmployeeRecord[],
  designations: [] as DesignationRecord[],
  departments: [] as DepartmentRecord[],
  branches: [] as BranchRecord[],
  roles: [] as RoleRecord[],
  permissions: [
    { id: 'perm-employee.view', module: 'employees', resource: 'employee', action: 'view', description: 'View employee records' },
    { id: 'perm-employee.create', module: 'employees', resource: 'employee', action: 'create', description: 'Create employees' },
    { id: 'perm-employee.edit', module: 'employees', resource: 'employee', action: 'edit', description: 'Edit employee records' },
    { id: 'perm-password.manage', module: 'passwords', resource: 'password', action: 'manage', description: 'Manage employee passwords' },
    { id: 'perm-dashboard.view', module: 'dashboard', resource: 'dashboard', action: 'view', description: 'View dashboard' },
    { id: 'perm-profile.view', module: 'profile', resource: 'profile', action: 'view', description: 'View profile' },
    { id: 'perm-profile.edit', module: 'profile', resource: 'profile', action: 'edit', description: 'Edit profile' },
  ] as PermissionRecord[],
  applications: [] as ApplicationRecord[],
  auditLogs: [] as AuditLogRecord[],
};

const buildTimestamp = () => new Date().toISOString();

export const getStore = () => {
  const globalObj = globalThis as typeof globalThis & { __assetra_store?: typeof store };
  if (!globalObj.__assetra_store) {
    globalObj.__assetra_store = store;
  }
  return globalObj.__assetra_store;
};

export const deriveRolePermissions = (role: UserRole): string[] => {
  if (role === 'SUPER_ADMIN') return ['*'];
  if (role === 'IT_ADMIN') return ['perm-dashboard.view', 'perm-profile.view', 'perm-profile.edit', 'perm-employee.view', 'perm-employee.create', 'perm-password.manage'];
  return ['perm-dashboard.view', 'perm-profile.view'];
};

export const canAssignRole = (actorRole: UserRole, targetRole: UserRole) => {
  if (actorRole === 'SUPER_ADMIN') return true;
  if (actorRole === 'IT_ADMIN') return targetRole === 'EMPLOYEE';
  return false;
};

export const buildDashboardData = (role: UserRole, user?: Partial<UserRecord>) => {
  const activeStore = getStore();
  const dashboardEmployees = activeStore.employees.map(({ bankAccountNumber: _bankAccountNumber, bankIfsc: _bankIfsc, bankName: _bankName, bankBranch: _bankBranch, ...employee }) => employee);
  const totalEmployees = activeStore.employees.length;
  const activeEmployees = activeStore.employees.filter((employee) => employee.status === 'ACTIVE').length;
  const inactiveEmployees = activeStore.employees.filter((employee) => employee.status === 'INACTIVE').length;

  const applicationStats = {
    totalApplications: activeStore.applications.length,
    approvedApplications: activeStore.applications.filter((application) => application.status === 'APPROVED').length,
    rejectedApplications: activeStore.applications.filter((application) => application.status === 'REJECTED').length,
  };

  if (role === 'SUPER_ADMIN') {
    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      totalAdmins: activeStore.employees.filter((employee) => employee.systemRole === 'IT_ADMIN').length + (activeStore.employees.some((employee) => employee.systemRole === 'SUPER_ADMIN') ? 1 : 0),
      totalEmployeesInScope: totalEmployees,
      totalApplications: applicationStats.totalApplications,
      approvedApplications: applicationStats.approvedApplications,
      rejectedApplications: applicationStats.rejectedApplications,
      recentEmployees: dashboardEmployees.slice(0, 5),
      recentActivities: activeStore.auditLogs.slice(0, 5).map((log) => ({
        id: log.id,
        title: log.action,
        actor: log.actorName,
        time: new Date(log.createdAt).toLocaleString(),
      })),
      systemOverview: {
        departments: activeStore.departments.length,
        branches: activeStore.branches.length,
        designations: activeStore.designations.length,
      },
      employeeDirectory: activeStore.employees.map((employee) => ({
        id: employee.id,
        name: employee.name,
        employeeId: employee.employeeId,
        designation: employee.designation,
        department: employee.department,
        branch: employee.branch,
        status: employee.status,
      })),
      welcomeMessage: 'Welcome, Super Admin',
    };
  }

  if (role === 'IT_ADMIN') {
    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      scopeEmployees: totalEmployees,
      totalApplications: applicationStats.totalApplications,
      approvedApplications: applicationStats.approvedApplications,
      rejectedApplications: applicationStats.rejectedApplications,
      recentEmployees: dashboardEmployees.slice(0, 4),
      recentActivities: activeStore.auditLogs.slice(0, 4).map((log) => ({
        id: log.id,
        title: log.action,
        actor: log.actorName,
        time: new Date(log.createdAt).toLocaleString(),
      })),
      employeeManagementShortcuts: ['Employee Directory', 'Create New Employee', 'Change Password', 'My Profile'],
      welcomeMessage: 'Welcome, IT Admin',
    };
  }

  const employeeProfile = activeStore.employees.find((employee) => employee.employeeId === user?.employeeId);

  return {
    welcomeMessage: `Welcome ${user?.name || employeeProfile?.name || 'Employee'}`,
    employeeId: user?.employeeId || employeeProfile?.employeeId || '',
    designation: employeeProfile?.designation || '',
    department: employeeProfile?.department || '',
    branch: employeeProfile?.branch || '',
    totalApplications: applicationStats.totalApplications,
    approvedApplications: applicationStats.approvedApplications,
    rejectedApplications: applicationStats.rejectedApplications,
    assignedModules: ['Dashboard', 'My Profile'],
    profileInformation: {
      status: employeeProfile?.status || 'ACTIVE',
      role: user?.role || employeeProfile?.systemRole || 'EMPLOYEE',
    },
  };
};

export const getUserByEmployeeId = (employeeId: string) => {
  const activeStore = getStore();
  return activeStore.users.find((user) => user.employeeId === employeeId);
};

export const createAuditLog = (actorEmployeeId: string, actorName: string, action: string, details: string, targetEmployeeId?: string, previousValue?: unknown, newValue?: unknown, reason?: string) => {
  const activeStore = getStore();
  const log = {
    id: randomUUID(),
    actorEmployeeId,
    actorName,
    action,
    details,
    createdAt: buildTimestamp(),
  };
  activeStore.auditLogs.unshift(log);
  void pool.query(
    'INSERT INTO audit_logs (id, actor_employee_id, actor_name, target_employee_id, action, details, previous_value, new_value, reason) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)',
    [log.id, actorEmployeeId, actorName, targetEmployeeId || null, action, details, previousValue == null ? null : JSON.stringify(previousValue), newValue == null ? null : JSON.stringify(newValue), reason || null],
  ).catch((error) => console.error('Failed to persist audit log:', error));
};

export const createEmployeeAccount = async (input: {
  employeeName: string;
  fatherName: string;
  motherName: string;
  mobileNumber: string;
  email: string;
  dob: string;
  gender: string;
  designation: string;
  systemRole: UserRole;
  department: string;
  branch: string;
  joiningDate: string;
  reportingManager: string;
  alternateMobileNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  district: string;
  pincode: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankBranch: string;
  employeeStatus: EmployeeStatus;
  defaultPassword: string;
  createdBy: string;
  actorName: string;
}) => {
  const activeStore = getStore();
  const client = await pool.connect();
  let employeeId = '';
  let employee: EmployeeRecord;
  let user: UserRecord;
  const timestamp = buildTimestamp();
  try {
    await client.query('BEGIN');
    const sequenceResult = await client.query<{ employee_id: string }>("SELECT nextval('employee_code_seq')::text AS employee_id");
    employeeId = sequenceResult.rows[0].employee_id;
    const userId = `user-${employeeId}`;
    const employeeRecordId = randomUUID();
    const passwordHash = await bcrypt.hash(input.defaultPassword, 12);
    const permissions = deriveRolePermissions(input.systemRole);

    await client.query(
      'INSERT INTO users (id, employee_id, name, role, password_hash, permissions, status, first_login_required) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, true)',
      [userId, employeeId, input.employeeName, input.systemRole, passwordHash, JSON.stringify(permissions), input.employeeStatus],
    );
    await client.query(
      `INSERT INTO employees (id, employee_id, name, father_name, mother_name, mobile_number, alternate_mobile_number, email, dob, gender,
        designation, system_role, department, branch, joining_date, reporting_manager, address_line_1, address_line_2, city, state, district,
        pincode, bank_name, bank_account_number, bank_ifsc, bank_branch, status, is_active, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $29)`,
      [employeeRecordId, employeeId, input.employeeName, input.fatherName, input.motherName, input.mobileNumber, input.alternateMobileNumber, input.email, input.dob, input.gender, input.designation, input.systemRole, input.department, input.branch, input.joiningDate, input.reportingManager, input.addressLine1, input.addressLine2, input.city, input.state, input.district, input.pincode, input.bankName, encryptSensitiveValue(input.bankAccountNumber), input.bankIfsc, input.bankBranch, input.employeeStatus, input.employeeStatus === 'ACTIVE', input.createdBy],
    );
    await client.query(
      'INSERT INTO audit_logs (id, actor_employee_id, actor_name, target_employee_id, action, details, previous_value, new_value) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)',
      [randomUUID(), input.createdBy, input.actorName, employeeId, 'Employee Created', `Created employee ${employeeId}.`, null, JSON.stringify({ name: input.employeeName, systemRole: input.systemRole, status: input.employeeStatus })],
    );
    await client.query('COMMIT');

    user = {
      id: userId,
      employeeId,
      name: input.employeeName,
      role: input.systemRole,
      passwordHash,
      permissions,
      status: input.employeeStatus,
      firstLoginRequired: true,
      authVersion: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    employee = {
      id: employeeRecordId,
      employeeId,
      name: input.employeeName,
      fatherName: input.fatherName,
      motherName: input.motherName,
      mobileNumber: input.mobileNumber,
      alternateMobileNumber: input.alternateMobileNumber,
      email: input.email,
      dob: input.dob,
      gender: input.gender,
      designation: input.designation,
      systemRole: input.systemRole,
      department: input.department,
      branch: input.branch,
      joiningDate: input.joiningDate,
      reportingManager: input.reportingManager,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      district: input.district,
      pincode: input.pincode,
      bankName: input.bankName,
      bankAccountNumber: '',
      bankIfsc: input.bankIfsc,
      bankBranch: input.bankBranch,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      status: input.employeeStatus,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    activeStore.users.push(user);
    activeStore.employees.push(employee);
    activeStore.auditLogs.unshift({
      id: randomUUID(),
      actorEmployeeId: input.createdBy,
      actorName: input.actorName,
      action: 'Employee Created',
      details: `Created employee ${employeeId}.`,
      createdAt: timestamp,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if ((error as { code?: string }).code === '23505') {
      return { success: false, message: 'Employee ID or account already exists.' };
    }
    throw error;
  } finally {
    client.release();
  }

  return {
    success: true,
    payload: {
      user,
      employee,
      temporaryPassword: input.defaultPassword,
    },
  };
};

export const initializeStore = () => {
  const activeStore = getStore();
  const globalObj = globalThis as typeof globalThis & { __assetra_store?: typeof store };
  globalObj.__assetra_store = activeStore;
  return activeStore;
};

export const loadStoreFromDatabase = async () => {
  const activeStore = initializeStore();
  const [users, employees, designations, departments, branches, roles, applications, auditLogs] = await Promise.all([
    db.select().from(dbUsers),
    db.select().from(dbEmployees),
    db.select().from(dbDesignations),
    db.select().from(dbDepartments),
    db.select().from(dbBranches),
    db.select().from(dbRoles),
    db.select().from(dbApplications),
    db.select().from(dbAuditLogs),
  ]);

  activeStore.users = users.map((user) => ({
    ...user,
    permissions: user.permissions || [],
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    lastPasswordResetAt: user.lastPasswordResetAt?.toISOString() || null,
  }));
  activeStore.employees = employees.map((employee) => ({
    ...employee,
    fatherName: employee.fatherName || '',
    motherName: employee.motherName || '',
    mobileNumber: employee.mobileNumber || '',
    email: employee.email || '',
    dob: employee.dob || '',
    gender: employee.gender || '',
    designation: employee.designation || '',
    department: employee.department || '',
    branch: employee.branch || '',
    joiningDate: employee.joiningDate || '',
    reportingManager: employee.reportingManager || '',
    alternateMobileNumber: employee.alternateMobileNumber || '',
    addressLine1: employee.addressLine1 || '',
    addressLine2: employee.addressLine2 || '',
    city: employee.city || '',
    state: employee.state || '',
    district: employee.district || '',
    pincode: employee.pincode || '',
    bankName: employee.bankName || '',
    bankAccountNumber: employee.bankAccountNumber || '',
    bankIfsc: employee.bankIfsc || '',
    bankBranch: employee.bankBranch || '',
    createdBy: employee.createdBy || '',
    updatedBy: employee.updatedBy || '',
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  }));
  activeStore.designations = designations.map((item) => ({ ...item, description: item.description || '' }));
  activeStore.departments = departments.map((item) => ({ ...item, description: item.description || '' }));
  activeStore.branches = branches.map((item) => ({ ...item, code: item.code || '', region: item.region || '' }));
  activeStore.roles = roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description || '',
    is_system_role: role.isSystemRole,
  }));
  activeStore.applications = applications.map((application) => ({
    ...application,
    customerId: application.customerId || '',
    branch: application.branch || '',
    loanOfficer: application.loanOfficer || '',
    loanType: application.loanType || '',
    requestedAmount: application.requestedAmount || 0,
    applicationDate: application.applicationDate || '',
    status: application.status || '',
    assignedCreditOfficer: application.assignedCreditOfficer || '',
    lastUpdated: application.lastUpdated.toISOString(),
  }));
  activeStore.auditLogs = auditLogs.map((log) => ({ ...log, createdAt: log.createdAt.toISOString() }));
  return activeStore;
};

export const getDashboardStats = () => {
  const activeStore = getStore();
  const totalEmployees = activeStore.employees.length;
  const activeEmployees = activeStore.employees.filter((employee) => employee.status === 'ACTIVE').length;
  const inactiveEmployees = activeStore.employees.filter((employee) => employee.status === 'INACTIVE').length;

  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    totalAdmins: activeStore.employees.filter((employee) => employee.systemRole === 'IT_ADMIN').length,
    totalStaff: activeStore.employees.filter((employee) => employee.systemRole === 'EMPLOYEE').length,
    recentEmployees: activeStore.employees.slice(0, 5),
    recentActivities: activeStore.auditLogs.slice(0, 5).map((log) => ({
      id: log.id,
      title: log.action,
      actor: log.actorName,
      time: new Date(log.createdAt).toLocaleString(),
    })),
    systemOverview: {
      departments: activeStore.departments.length,
      branches: activeStore.branches.length,
      designations: activeStore.designations.length,
    },
  };
};
