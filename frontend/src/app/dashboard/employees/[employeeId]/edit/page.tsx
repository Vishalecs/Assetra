'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';

const editableFields = [
  ['name', 'Employee Name'], ['fatherName', "Father's Name"], ['motherName', "Mother's Name"], ['mobileNumber', 'Mobile Number'],
  ['alternateMobileNumber', 'Alternate Mobile'], ['email', 'Email'], ['dob', 'Date of Birth'], ['gender', 'Gender'],
  ['department', 'Department'], ['designation', 'Designation'], ['branch', 'Branch'], ['reportingManager', 'Reporting Manager'],
  ['joiningDate', 'Joining Date'], ['addressLine1', 'Address Line 1'], ['addressLine2', 'Address Line 2'], ['city', 'City'],
  ['district', 'District'], ['state', 'State'], ['pincode', 'Pincode'],
] as const;

const inputClass = 'mt-1.5 w-full rounded border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/15';

export default function EditEmployeePage() {
  const params = useParams<{ employeeId: string }>();
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [lookups, setLookups] = useState<any>({ branches: [], departments: [], designations: [], managers: [] });
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileResponse, employeeResponse, lookupResponse] = await Promise.all([
          fetch('http://localhost:5000/api/v1/auth/me', { credentials: 'include' }),
          fetch(`http://localhost:5000/api/v1/employees/${encodeURIComponent(params.employeeId)}`, { credentials: 'include' }),
          fetch('http://localhost:5000/api/v1/employees/lookups', { credentials: 'include' }),
        ]);
        if (!profileResponse.ok) return void (window.location.href = '/');
        const [profile, details, lookupData] = await Promise.all([profileResponse.json(), employeeResponse.json(), lookupResponse.json()]);
        if (!employeeResponse.ok) throw new Error(details.message || 'Unable to load employee.');
        if (!['SUPER_ADMIN', 'IT_ADMIN'].includes(profile.data.user.role)) return void router.replace('/dashboard');
        if (details.data.employee.systemRole === 'SUPER_ADMIN') throw new Error('The Super Admin account is protected.');
        if (profile.data.user.role === 'IT_ADMIN' && details.data.employee.systemRole !== 'EMPLOYEE') throw new Error('IT Admin can only edit normal employee records.');
        setUser(profile.data.user);
        setEmployee(details.data.employee);
        setLookups(lookupData.data);
        setForm({ ...Object.fromEntries(editableFields.map(([key]) => [key, details.data.employee[key] || ''])), systemRole: details.data.employee.systemRole });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to load employee.');
      }
    };
    void load();
  }, [params.employeeId, router]);

  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value, ...(key === 'department' ? { designation: '' } : {}) }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = { ...form };
      if (user?.role !== 'SUPER_ADMIN') delete payload.systemRole;
      const response = await fetch(`http://localhost:5000/api/v1/employees/${encodeURIComponent(params.employeeId)}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to save employee.');
      router.push(`/dashboard/employees/${encodeURIComponent(params.employeeId)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save employee.');
    } finally {
      setSaving(false);
    }
  };

  const optionsFor = (key: string) => key === 'designation' ? lookups.designations.filter((item: any) => item.department?.trim().toLowerCase() === form.department?.trim().toLowerCase()) : key === 'department' ? lookups.departments : key === 'branch' ? lookups.branches : [];
  const renderField = (key: string, label: string) => {
    let control;
    if (key === 'gender') {
      control = <select className={inputClass} value={form[key]} onChange={(event) => update(key, event.target.value)}><option value="">Select gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select>;
    } else if (key === 'dob' || key === 'joiningDate') {
      control = <input className={inputClass} type="date" value={form[key]} onChange={(event) => update(key, event.target.value)} />;
    } else if (key === 'mobileNumber' || key === 'alternateMobileNumber') {
      control = <input className={inputClass} value={form[key]} onChange={(event) => update(key, event.target.value.replace(/\D/g, '').slice(0, 10))} pattern="[0-9]{10}" inputMode="numeric" />;
    } else if (key === 'email') {
      control = <input className={inputClass} type="email" value={form[key]} onChange={(event) => update(key, event.target.value)} />;
    } else if (['designation', 'department', 'branch'].includes(key)) {
      control = <><input className={inputClass} list={`options-${key}`} value={form[key]} onChange={(event) => update(key, event.target.value)} disabled={key === 'designation' && !form.department} placeholder={key === 'designation' && !form.department ? 'Select department first' : ''} /><datalist id={`options-${key}`}>{optionsFor(key).map((item: any) => <option key={`${item.department || ''}-${item.name}`} value={item.name} />)}</datalist></>;
    } else if (key === 'reportingManager') {
      control = <select className={inputClass} value={form[key]} onChange={(event) => update(key, event.target.value)}><option value="">No manager selected</option>{lookups.managers.filter((item: any) => item.employeeId !== employee.employeeId).map((item: any) => <option key={item.employeeId} value={item.employeeId}>{item.name} · {item.employeeId}</option>)}</select>;
    } else {
      control = <input className={inputClass} value={form[key]} onChange={(event) => update(key, event.target.value)} />;
    }
    return <label key={key} className="block text-xs font-medium text-slate-600">{label}{control}</label>;
  };
  if (!employee && !message) return <div className="p-6 text-sm text-slate-500">Loading employee record…</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div><Link href={`/dashboard/employees/${encodeURIComponent(params.employeeId)}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={15} /> Employee Profile</Link><h1 className="mt-2 text-3xl font-semibold text-slate-950">Edit Employee</h1><p className="mt-1 text-sm text-slate-500">{employee?.employeeId} · {employee?.systemRole}</p></div>
      {message && <div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{message}</div>}
      {employee && <form onSubmit={save} className="rounded-md border border-slate-200 bg-white">
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {editableFields.map(([key, label]) => renderField(key, label))}
          {user?.role === 'SUPER_ADMIN' && <label className="block text-xs font-medium text-slate-600">System Role<select className={inputClass} value={form.systemRole} onChange={(event) => update('systemRole', event.target.value)}><option value="EMPLOYEE">EMPLOYEE</option><option value="IT_ADMIN">IT_ADMIN (Designation must be IT)</option></select></label>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4"><Link href={`/dashboard/employees/${encodeURIComponent(params.employeeId)}`} className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</Link><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded bg-[#075b68] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Save size={15} />{saving ? 'Saving…' : 'Save Changes'}</button></div>
      </form>}
    </div>
  );
}