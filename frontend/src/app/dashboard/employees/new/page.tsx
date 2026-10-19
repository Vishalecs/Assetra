'use client';

import { apiUrl } from '@/utils/api';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';

const emptyForm = {
  employeeName: '', fatherName: '', motherName: '', mobileNumber: '', alternateMobileNumber: '', email: '', dob: '', gender: '',
  designation: '', systemRole: 'EMPLOYEE', department: '', branch: '', joiningDate: '', reportingManager: '', employeeStatus: 'ACTIVE',
  addressLine1: '', addressLine2: '', city: '', state: '', district: '', pincode: '', bankName: '', bankAccountNumber: '', bankIfsc: '', bankBranch: '',
};

const inputClass = 'mt-1.5 w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/15';
const labelClass = 'block text-xs font-medium text-slate-600';

export default function NewEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [user, setUser] = useState<any>(null);
  const [lookups, setLookups] = useState<any>({ branches: [], designations: [], departments: [], managers: [] });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileResponse, lookupResponse] = await Promise.all([
          fetch(apiUrl('/auth/me'), { credentials: 'include' }),
          fetch(apiUrl('/employees/lookups'), { credentials: 'include' }),
        ]);
        if (!profileResponse.ok) return void (window.location.href = '/');
        if (!lookupResponse.ok) throw new Error('Unable to load employee options.');
        const [profile, lookupData] = await Promise.all([profileResponse.json(), lookupResponse.json()]);
        const current = profile.data.user;
        if (!['SUPER_ADMIN', 'IT_ADMIN'].includes(current.role)) return void (window.location.href = '/dashboard');
        setUser(current);
        setLookups(lookupData.data);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to load employee options.');
      }
    };
    void load();
  }, []);

  const change = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => {
      if (field === 'department') {
        return { ...current, department: value, designation: '', ...(value.trim().toUpperCase() !== 'IT' && current.systemRole === 'IT_ADMIN' ? { systemRole: 'EMPLOYEE' } : {}) };
      }
      return { ...current, [field]: value, ...(field === 'designation' && value.trim().toUpperCase() !== 'IT' && current.systemRole === 'IT_ADMIN' ? { systemRole: 'EMPLOYEE' } : {}) };
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);
    try {
      const response = await fetch(apiUrl('/employees'), {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to create employee.');
      router.replace('/dashboard/employees?created=1');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create employee.');
    } finally {
      setSubmitting(false);
    }
  };

  const canCreateITAdmin = user?.role === 'SUPER_ADMIN' && form.designation.trim().toUpperCase() === 'IT';
  const designationOptions = lookups.designations.filter((item: any) => item.department?.trim().toLowerCase() === form.department.trim().toLowerCase());

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase text-cyan-800">Employee Management</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950">Create Employee</h1>
        <p className="mt-1 text-sm text-slate-500">Employee IDs and login credentials are generated automatically.</p>
      </header>

      {message && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</div>}

      <form onSubmit={submit} className="space-y-5">
        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Employee Information</h2></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelClass}>Employee Name <span className="text-red-600">*</span><input className={inputClass} value={form.employeeName} onChange={(event) => change('employeeName', event.target.value)} required maxLength={160} autoComplete="name" /></label>
            <label className={labelClass}>Father&apos;s Name<input className={inputClass} value={form.fatherName} onChange={(event) => change('fatherName', event.target.value)} maxLength={160} /></label>
            <label className={labelClass}>Mother&apos;s Name<input className={inputClass} value={form.motherName} onChange={(event) => change('motherName', event.target.value)} maxLength={160} /></label>
            <label className={labelClass}>Mobile Number <span className="text-red-600">*</span><input className={inputClass} value={form.mobileNumber} onChange={(event) => change('mobileNumber', event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" pattern="[0-9]{10}" title="Enter a 10-digit mobile number" required /></label>
            <label className={labelClass}>Date of Birth<input className={inputClass} type="date" value={form.dob} onChange={(event) => change('dob', event.target.value)} /></label>
            <label className={labelClass}>Gender <span className="text-red-600">*</span><select className={inputClass} value={form.gender} onChange={(event) => change('gender', event.target.value)} required><option value="">Select gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></label>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Employment Details</h2></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelClass}>Department <span className="text-red-600">*</span><select className={inputClass} value={form.department} onChange={(event) => change('department', event.target.value)} required><option value="">Select department</option>{lookups.departments.map((item: any) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
            <label className={labelClass}>Designation <span className="text-red-600">*</span><input className={inputClass} list="designation-options" value={form.designation} onChange={(event) => change('designation', event.target.value)} disabled={!form.department} placeholder={form.department ? 'Search designations' : 'Select department first'} required maxLength={120} /><datalist id="designation-options">{designationOptions.map((item: any) => <option key={`${item.department}-${item.name}`} value={item.name} />)}</datalist></label>
            <label className={labelClass}>System Role <span className="text-red-600">*</span><select className={inputClass} value={form.systemRole} onChange={(event) => change('systemRole', event.target.value as any)}><option value="EMPLOYEE">EMPLOYEE</option>{canCreateITAdmin && <option value="IT_ADMIN">IT_ADMIN</option>}</select></label>
            <label className={labelClass}>Branch <span className="text-red-600">*</span><input className={inputClass} list="branch-options" value={form.branch} onChange={(event) => change('branch', event.target.value)} required maxLength={120} /><datalist id="branch-options">{lookups.branches.map((item: any) => <option key={item.name} value={item.name} />)}</datalist></label>
            <label className={labelClass}>Reporting Manager<select className={inputClass} value={form.reportingManager} onChange={(event) => change('reportingManager', event.target.value)}><option value="">No manager selected</option>{lookups.managers.filter((item: any) => item.employeeId !== user?.employeeId).map((item: any) => <option key={item.employeeId} value={item.employeeId}>{item.name} · {item.employeeId}</option>)}</select></label>
            <label className={labelClass}>Joining Date <span className="text-red-600">*</span><input className={inputClass} type="date" value={form.joiningDate} onChange={(event) => change('joiningDate', event.target.value)} required /></label>
            <label className={labelClass}>Employee Status<select className={inputClass} value={form.employeeStatus} onChange={(event) => change('employeeStatus', event.target.value as any)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Contact Information</h2></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelClass}>Alternate Mobile<input className={inputClass} value={form.alternateMobileNumber} onChange={(event) => change('alternateMobileNumber', event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" pattern="[0-9]{10}" /></label>
            <label className={labelClass}>Email<input className={inputClass} type="email" value={form.email} onChange={(event) => change('email', event.target.value)} maxLength={255} autoComplete="email" /></label>
            <label className={labelClass}>Pincode<input className={inputClass} value={form.pincode} onChange={(event) => change('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" /></label>
            <label className={labelClass}>Address Line 1<input className={inputClass} value={form.addressLine1} onChange={(event) => change('addressLine1', event.target.value)} maxLength={240} /></label>
            <label className={labelClass}>Address Line 2<input className={inputClass} value={form.addressLine2} onChange={(event) => change('addressLine2', event.target.value)} maxLength={240} /></label>
            <label className={labelClass}>City<input className={inputClass} value={form.city} onChange={(event) => change('city', event.target.value)} maxLength={100} /></label>
            <label className={labelClass}>District<input className={inputClass} value={form.district} onChange={(event) => change('district', event.target.value)} maxLength={100} /></label>
            <label className={labelClass}>State<input className={inputClass} value={form.state} onChange={(event) => change('state', event.target.value)} maxLength={100} /></label>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-900">Bank / Payment Information <span className="ml-1 text-xs font-normal text-slate-500">Optional</span></h2></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelClass}>Bank Name<input className={inputClass} value={form.bankName} onChange={(event) => change('bankName', event.target.value)} maxLength={160} /></label>
            <label className={labelClass}>Account Number<input className={inputClass} value={form.bankAccountNumber} onChange={(event) => change('bankAccountNumber', event.target.value)} maxLength={64} autoComplete="off" /></label>
            <label className={labelClass}>IFSC<input className={inputClass} value={form.bankIfsc} onChange={(event) => change('bankIfsc', event.target.value.toUpperCase())} maxLength={32} /></label>
            <label className={labelClass}>Bank Branch<input className={inputClass} value={form.bankBranch} onChange={(event) => change('bankBranch', event.target.value)} maxLength={160} /></label>
          </div>
        </section>

        <div className="flex flex-col gap-3 rounded-md border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-950 sm:flex-row sm:items-start">
          <UserPlus size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div><p className="font-semibold">Login credentials are generated automatically.</p><p className="mt-1 text-cyan-900">The employee receives a system-generated Employee ID and initial password from ASSETRA.</p></div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
          <Link href="/dashboard/employees" className="rounded border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link>
          <button type="submit" disabled={submitting} className="rounded bg-[#075b68] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#064852] disabled:opacity-60">{submitting ? 'Saving…' : 'Create Employee'}</button>
        </div>
      </form>
    </div>
  );
}