import test from 'node:test';
import assert from 'node:assert/strict';

import {
  initializeStore,
  canAssignRole,
  buildDashboardData,
  getStore,
} from '../src/store.js';

const clearStore = () => {
  initializeStore();
  const activeStore = getStore();
  activeStore.users = [];
  activeStore.employees = [];
  activeStore.designations = [];
  activeStore.departments = [];
  activeStore.branches = [];
  activeStore.applications = [];
  activeStore.auditLogs = [];
  activeStore.roles = [];
  return activeStore;
};

test('initializeStore does not populate demo or business records', () => {
  const activeStore = clearStore();
  initializeStore();

  assert.equal(activeStore.users.length, 0);
  assert.equal(activeStore.employees.length, 0);
  assert.equal(activeStore.designations.length, 0);
  assert.equal(activeStore.departments.length, 0);
  assert.equal(activeStore.branches.length, 0);
  assert.equal(activeStore.applications.length, 0);
});

test('IT Admin can create employees but not Super Admins', () => {
  clearStore();

  const allowed = canAssignRole('IT_ADMIN', 'EMPLOYEE');
  const blocked = canAssignRole('IT_ADMIN', 'SUPER_ADMIN');

  assert.equal(allowed, true);
  assert.equal(blocked, false);
});

test('dashboard data differs by role and is not hardcoded', () => {
  clearStore();

  const superAdminStats = buildDashboardData('SUPER_ADMIN');
  const employeeStats = buildDashboardData('EMPLOYEE', { employeeId: 'TEST0001', name: 'Test User' });

  assert.equal(superAdminStats.totalEmployees, 0);
  assert.equal(superAdminStats.totalApplications, 0);
  assert.equal(employeeStats.employeeId, 'TEST0001');
  assert.equal(employeeStats.welcomeMessage, 'Welcome Test User');
});
