'use client';

import { apiUrl } from '@/utils/api';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, KeyRound, Pencil } from 'lucide-react';

const fields = [
  ['Employee ID', 'employeeId'], ['Employee Name', 'name'], ["Father's Name", 'fatherName'], ["Mother's Name", 'motherName'],
  ['Date of Birth', 'dob'], ['Gender', 'gender'], ['Mobile Number', 'mobileNumber'], ['Alternate Mobile', 'alternateMobileNumber'], ['Email', 'email'],
  ['Designation', 'designation'], ['System Role', 'systemRole'], ['Department', 'department'], ['Branch', 'branch'], ['Reporting Manager', 'reportingManager'],
  ['Joining Date', 'joiningDate'], ['Status', 'status'], ['City', 'city'], ['District', 'district'], ['State', 'state'], ['Pincode', 'pincode'],
  ['Address Line 1', 'addressLine1'], ['Address Line 2', 'addressLine2'], ['Bank Name', 'bankName'], ['IFSC', 'bankIfsc'], ['Bank Branch', 'bankBranch'],
  ['Created By', 'createdBy'], ['Updated By', 'updatedBy'], ['Last Login', 'lastLoginAt'], ['Last Password Reset', 'lastPasswordResetAt'], ['Created On', 'createdAt'], ['Updated On', 'updatedAt'],
] as const;

export default function EmployeeDetailsPage() {
  const params = useParams<{ employeeId: string }>();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileResponse, response] = await Promise.all([
          fetch(apiUrl('/auth/me'), { credentials: 'include' }),
          fetch(apiUrl(`/employees/${encodeURIComponent(params.employeeId)}`), { credentials: 'include' }),
        ]);
        const [profile, result] = await Promise.all([profileResponse.json(), response.json()]);
        if (!profileResponse.ok) return void (window.location.href = '/');
        if (!response.ok) throw new Error(result.message || 'Unable to load employee.');
        setCurrentUser(profile.data.user);
        setData(result.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load employee.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [params.employeeId]);

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading employee record…</div>;
  if (error) return <div role="alert" className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>;
  if (!data?.employee) return null;
  const employee = data.employee;
  const canManageTarget = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'IT_ADMIN' && (employee.systemRole === 'EMPLOYEE' || currentUser.employeeId === employee.employeeId);
  const formatValue = (value: unknown) => value ? String(value).replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC') : '—';

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><Link href="/dashboard/employees" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={15} /> All Employees</Link><h1 className="mt-2 text-3xl font-semibold text-slate-950">{employee.name}</h1><p className="mt-1 text-sm text-slate-500">Employee ID {employee.employeeId} · {employee.systemRole}</p></div>
        <div className="flex gap-2">
          {canManageTarget && employee.systemRole !== 'SUPER_ADMIN' && <Link href={`/dashboard/employees/${encodeURIComponent(employee.employeeId)}/edit`} className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"><Pencil size={15} /> Edit</Link>}
          {canManageTarget && <Link href={`/dashboard/change-password?employeeId=${encodeURIComponent(employee.employeeId)}`} className="inline-flex items-center gap-2 rounded bg-[#075b68] px-3 py-2 text-sm font-semibold text-white"><KeyRound size={15} /> Reset Password</Link>}
        </div>
      </div>

      <section className="rounded-md border border-slate-200 bg-white">
        <h2 className="border-b border-slate-200 px-5 py-4 font-semibold text-slate-900">Employee Profile</h2>
        <dl className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(([label, key]) => <div key={key}><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-slate-900">{formatValue(employee[key])}</dd></div>)}
        </dl>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <h2 className="border-b border-slate-200 px-5 py-4 font-semibold text-slate-900">Audit History</h2>
        {data.audit?.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Date &amp; Time</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Performed By</th><th className="px-4 py-3">Details</th><th className="px-4 py-3">Reason</th></tr></thead><tbody>{data.audit.map((item: any) => <tr key={`${item.createdAt}-${item.action}`} className="border-t border-slate-100"><td className="whitespace-nowrap px-4 py-3">{formatValue(item.createdAt)}</td><td className="px-4 py-3 font-medium">{item.action}</td><td className="px-4 py-3">{item.performedByName} · {item.performedBy}</td><td className="px-4 py-3">{item.details}</td><td className="px-4 py-3">{item.reason || '—'}</td></tr>)}</tbody></table></div> : <p className="px-5 py-8 text-sm text-slate-500">No audit events recorded for this employee.</p>}
      </section>
    </div>
  );
}