'use client';

import { apiUrl } from '@/utils/api';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { KeyRound, Search } from 'lucide-react';

export default function ChangePasswordPage() {
  const [user, setUser] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [employee, setEmployee] = useState<any>(null);
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch(apiUrl('/auth/me'), { credentials: 'include' });
        if (!response.ok) return void (window.location.href = '/');
        const result = await response.json();
        if (!['SUPER_ADMIN', 'IT_ADMIN'].includes(result.data.user.role)) return void (window.location.href = '/dashboard');
        setUser(result.data.user);
      } catch {
        window.location.href = '/';
      }
    };
    void loadUser();
  }, []);

  const lookupEmployee = async (requestedEmployeeId = employeeId) => {
    if (!requestedEmployeeId.trim()) return setEmployee(null);
    setLoadingEmployee(true);
    setMessage(null);
    try {
      const response = await fetch(apiUrl(`/employees/${encodeURIComponent(requestedEmployeeId.trim())}`), { credentials: 'include' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Employee not found.');
      setEmployee(result.data.employee);
    } catch (error) {
      setEmployee(null);
      setMessage({ success: false, text: error instanceof Error ? error.message : 'Unable to find employee.' });
    } finally {
      setLoadingEmployee(false);
    }
  };

  useEffect(() => {
    const initialEmployeeId = new URLSearchParams(window.location.search).get('employeeId');
    if (initialEmployeeId) {
      setEmployeeId(initialEmployeeId);
      void lookupEmployee(initialEmployeeId);
    }
  }, []);

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!employee) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(apiUrl(`/employees/${encodeURIComponent(employee.employeeId)}/reset-password`), {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(passwords),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to reset password.');
      setPasswords({ newPassword: '', confirmPassword: '' });
      setMessage({ success: true, text: `Password Reset Successfully. Employee ${employee.employeeId} can now sign in using the new password.` });
    } catch (error) {
      setMessage({ success: false, text: error instanceof Error ? error.message : 'Unable to reset password.' });
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'IT_ADMIN';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header><p className="text-xs font-semibold uppercase text-cyan-800">Employee Management</p><h1 className="mt-1 text-3xl font-semibold text-slate-950">Change Password</h1><p className="mt-1 text-sm text-slate-500">Reset credentials for an employee account. Existing sessions are invalidated.</p></header>
      {isAdmin && <section className="rounded-md border border-slate-200 bg-white p-5">
        <label className="block text-xs font-medium text-slate-600">Employee ID
          <div className="mt-1.5 flex gap-2"><input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void lookupEmployee(); } }} className="w-full rounded border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-700" placeholder="Enter Employee ID" /><button type="button" onClick={() => void lookupEmployee()} disabled={loadingEmployee} className="inline-flex shrink-0 items-center gap-2 rounded bg-[#075b68] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Search size={15} />{loadingEmployee ? 'Searching…' : 'Search'}</button></div>
        </label>
        {employee && <dl className="mt-4 grid gap-3 rounded bg-slate-50 p-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Employee Name</dt><dd className="mt-1 font-medium text-slate-900">{employee.name}</dd></div><div><dt className="text-xs text-slate-500">Designation</dt><dd className="mt-1 font-medium text-slate-900">{employee.designation || '—'}</dd></div><div><dt className="text-xs text-slate-500">Department</dt><dd className="mt-1 font-medium text-slate-900">{employee.department || '—'}</dd></div><div><dt className="text-xs text-slate-500">Branch</dt><dd className="mt-1 font-medium text-slate-900">{employee.branch || '—'}</dd></div><div><dt className="text-xs text-slate-500">Status</dt><dd className="mt-1 font-medium text-slate-900">{employee.status}</dd></div></dl>}
      </section>}

      {isAdmin && employee && <form onSubmit={resetPassword} className="rounded-md border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">New Credentials</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="block text-xs font-medium text-slate-600">New Password<input type="password" minLength={8} autoComplete="new-password" value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} className="mt-1.5 w-full rounded border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-700" required /></label><label className="block text-xs font-medium text-slate-600">Confirm New Password<input type="password" minLength={8} autoComplete="new-password" value={passwords.confirmPassword} onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))} className="mt-1.5 w-full rounded border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-700" required /></label></div>
        {message && <div role={message.success ? 'status' : 'alert'} className={`mt-4 rounded px-3 py-2.5 text-sm ${message.success ? 'border border-emerald-200 bg-emerald-50 text-emerald-800' : 'border border-red-200 bg-red-50 text-red-800'}`}>{message.text}</div>}
        <div className="mt-5 flex justify-end"><button type="submit" disabled={submitting || employee.status !== 'ACTIVE'} className="inline-flex items-center gap-2 rounded bg-[#075b68] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><KeyRound size={15} />{submitting ? 'Resetting…' : 'Reset Password'}</button></div>
      </form>}
      {!isAdmin && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">You do not have permission to reset passwords. Contact your IT Admin or Super Admin.</div>}
      <Link href="/dashboard/employees" className="inline-block text-sm font-medium text-cyan-800 hover:text-cyan-950">Return to All Employees</Link>
    </div>
  );
}