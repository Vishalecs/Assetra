'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, RotateCcw, Search } from 'lucide-react';

type Filters = {
  query: string;
  branch: string;
  designation: string;
  role: string;
  status: string;
};

const blankFilters: Filters = { query: '', branch: '', designation: '', role: 'ALL', status: 'ALL' };
const pageSize = 20;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [lookups, setLookups] = useState<any>({ branches: [], designations: [] });
  const [stats, setStats] = useState<any>({});
  const [filters, setFilters] = useState<Filters>(blankFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(blankFilters);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadPage = useCallback(async (targetPage: number, activeFilters: Filters) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(targetPage), limit: String(pageSize) });
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== 'ALL') params.set(key, value);
    });
    try {
      const [profileResponse, listResponse, statsResponse, lookupsResponse] = await Promise.all([
        fetch('http://localhost:5000/api/v1/auth/me', { credentials: 'include' }),
        fetch(`http://localhost:5000/api/v1/employees?${params.toString()}`, { credentials: 'include' }),
        fetch('http://localhost:5000/api/v1/employees/stats', { credentials: 'include' }),
        fetch('http://localhost:5000/api/v1/employees/lookups', { credentials: 'include' }),
      ]);
      if (!profileResponse.ok) {
        window.location.href = '/';
        return;
      }
      if (!listResponse.ok) throw new Error('You are not authorized to view employees.');
      const [profile, list, statsData, lookupData] = await Promise.all([
        profileResponse.json(), listResponse.json(), statsResponse.json(), lookupsResponse.json(),
      ]);
      setCurrentUser(profile.data.user);
      setEmployees(list.data.items || []);
      setPage(list.data.page || targetPage);
      setTotal(list.data.total || 0);
      setStats(statsData.data || {});
      setLookups(lookupData.data || { branches: [], designations: [] });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('created') === '1') {
      setSuccessMessage('Employee created successfully.');
      window.history.replaceState({}, '', '/dashboard/employees');
    }
    void loadPage(1, blankFilters);
  }, [loadPage]);

  const canManage = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'IT_ADMIN';
  const updateFilter = (key: keyof Filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));

  const searchEmployees = (event: React.FormEvent) => {
    event.preventDefault();
    setAppliedFilters(filters);
    void loadPage(1, filters);
  };

  const resetSearch = () => {
    setFilters(blankFilters);
    setAppliedFilters(blankFilters);
    void loadPage(1, blankFilters);
  };

  const changeStatus = async (employee: any) => {
    const nextStatus = employee.status === 'ACTIVE' ? 'inactive' : 'active';
    if (!window.confirm(`Are you sure you want to ${nextStatus} ${employee.name}?`)) return;
    const status = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const response = await fetch(`http://localhost:5000/api/v1/employees/${encodeURIComponent(employee.employeeId)}/status`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to update employee status.');
      await loadPage(page, appliedFilters);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Unable to update employee status.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRecord = Math.min(page * pageSize, total);

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-cyan-800">Employee Management</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">All Employees</h1>
          <p className="mt-1 text-sm text-slate-500">Manage employee access, assignments, and status.</p>
        </div>
        {canManage && (
          <Link href="/dashboard/employees/new" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#075b68] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#064852]">
            <Plus size={17} aria-hidden="true" /> Create New Employee
          </Link>
        )}
      </header>

      {successMessage && <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{successMessage}</div>}
      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 md:grid-cols-4" aria-label="Employee totals">
        {[
          ['Total Employees', stats.total ?? 0], ['Active', stats.active ?? 0], ['Inactive', stats.inactive ?? 0], ['IT Admins', stats.adminCount ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="bg-white px-4 py-3">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <form onSubmit={searchEmployees} className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Search Employees</h2>
          <span className="text-xs text-slate-500">{total} records</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-xs font-medium text-slate-600">Employee ID or name
            <input value={filters.query} onChange={(event) => updateFilter('query', event.target.value)} className="mt-1.5 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/15" placeholder="Search ID or name" />
          </label>
          <label className="text-xs font-medium text-slate-600">Branch
            <select value={filters.branch} onChange={(event) => updateFilter('branch', event.target.value)} className="mt-1.5 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-700">
              <option value="">All branches</option>{lookups.branches.map((item: any) => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">Designation
            <select value={filters.designation} onChange={(event) => updateFilter('designation', event.target.value)} className="mt-1.5 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-700">
              <option value="">All designations</option>{lookups.designations.map((item: any) => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">System Role
            <select value={filters.role} onChange={(event) => updateFilter('role', event.target.value)} className="mt-1.5 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-700">
              <option value="ALL">All roles</option><option value="SUPER_ADMIN">SUPER_ADMIN</option><option value="IT_ADMIN">IT_ADMIN</option><option value="EMPLOYEE">EMPLOYEE</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">Status
            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="mt-1.5 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-700">
              <option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className="inline-flex items-center gap-2 rounded bg-[#075b68] px-4 py-2 text-sm font-semibold text-white hover:bg-[#064852]"><Search size={15} /> Search</button>
            <button type="button" onClick={resetSearch} className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RotateCcw size={15} /> Reset</button>
          </div>
        </div>
      </form>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-900">Employee Directory</h2>
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
        </div>
        {loading ? <div className="space-y-3 p-5" aria-label="Loading employees">{[1, 2, 3].map((item) => <div key={item} className="h-8 animate-pulse rounded bg-slate-100" />)}</div> : employees.length === 0 ? (
          <div className="px-5 py-12 text-center"><p className="font-medium text-slate-800">No employees found</p><p className="mt-1 text-sm text-slate-500">Try changing your filters or create an employee record.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
                <th className="px-4 py-3">Employee ID</th><th className="px-4 py-3">Employee Name</th><th className="px-4 py-3">Designation</th><th className="px-4 py-3">System Role</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Branch</th><th className="px-4 py-3">Mobile</th><th className="px-4 py-3">Joining Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
              </tr></thead>
              <tbody>{employees.map((employee) => (
                <tr key={employee.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{employee.employeeId}</td><td className="px-4 py-3 font-medium text-slate-800">{employee.name}</td><td className="px-4 py-3">{employee.designation || '—'}</td><td className="px-4 py-3">{employee.systemRole}</td><td className="px-4 py-3">{employee.department || '—'}</td><td className="px-4 py-3">{employee.branch || '—'}</td><td className="px-4 py-3">{employee.mobileNumber || '—'}</td><td className="px-4 py-3">{employee.joiningDate || '—'}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${employee.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{employee.status}</span></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1">
                    <Link title="View employee" aria-label={`View ${employee.name}`} href={`/dashboard/employees/${encodeURIComponent(employee.employeeId)}`} className="rounded p-1.5 text-slate-600 hover:bg-slate-100"><Eye size={16} /></Link>
                    {canManage && employee.systemRole !== 'SUPER_ADMIN' && (currentUser?.role === 'SUPER_ADMIN' || employee.systemRole === 'EMPLOYEE') && <>
                      <Link title="Edit employee" aria-label={`Edit ${employee.name}`} href={`/dashboard/employees/${encodeURIComponent(employee.employeeId)}/edit`} className="rounded p-1.5 text-slate-600 hover:bg-slate-100"><Pencil size={16} /></Link>
                      <button type="button" title={employee.status === 'ACTIVE' ? 'Deactivate employee' : 'Activate employee'} onClick={() => void changeStatus(employee)} className="rounded px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100">{employee.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button>
                    </>}
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span>Showing {firstRecord}–{lastRecord} of {total} employees</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1 || loading} onClick={() => void loadPage(page - 1, appliedFilters)} className="inline-flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40"><ChevronLeft size={15} /> Previous</button>
            <span className="min-w-14 text-center">{page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages || loading} onClick={() => void loadPage(page + 1, appliedFilters)} className="inline-flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40">Next <ChevronRight size={15} /></button>
          </div>
        </footer>
      </section>
    </div>
  );
}