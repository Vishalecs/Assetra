'use client';

import { apiUrl } from '@/utils/api';

import { useEffect, useState } from 'react';

export default function MyProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch(apiUrl('/auth/me'), { credentials: 'include' });
        const data = await response.json();
        setUser(data?.data?.user || null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  if (loading) return <div className="p-4 text-slate-500">Loading profile...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500">Employee profile details retrieved from the authenticated session.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Employee ID</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{user?.employeeId || '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Employee Name</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{user?.name || '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Designation</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{user?.designation || '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Department</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{user?.department || '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Branch</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{user?.branch || '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">System Role</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{user?.systemRole || user?.role || '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Mobile Number</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{user?.mobileNumber || '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Email</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{user?.email || '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Joining Date</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{user?.joiningDate || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
