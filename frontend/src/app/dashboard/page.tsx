'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [profileResponse, dashboardResponse] = await Promise.all([
          fetch('http://localhost:5000/api/v1/auth/me', { credentials: 'include' }),
          fetch('http://localhost:5000/api/v1/dashboard', { credentials: 'include' }),
        ]);

        if (!profileResponse.ok || !dashboardResponse.ok) {
          window.location.href = '/';
          return;
        }

        const profileData = await profileResponse.json();
        const dashboardData = await dashboardResponse.json();
        setUser(profileData?.data?.user || null);
        setData(dashboardData?.data || null);
      } catch {
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-500">Loading dashboard...</div>;
  }

  const role = user?.role || 'EMPLOYEE';

  if (role === 'SUPER_ADMIN') {
    return (
      <div className="space-y-6 p-2">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-700">Overview</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Super Admin Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Total Employees', value: data?.totalEmployees ?? 0 },
            { label: 'Active Employees', value: data?.activeEmployees ?? 0 },
            { label: 'Inactive Employees', value: data?.inactiveEmployees ?? 0 },
            { label: 'Total Applications', value: data?.totalApplications ?? 0 },
            { label: 'Approved Applications', value: data?.approvedApplications ?? 0 },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">{item.label}</div>
              <div className="mt-2 text-2xl font-bold text-[#071827]">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent Employee Activities</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {(data?.recentActivities || []).map((activity: any) => (
              <li key={activity.id} className="flex justify-between border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                <span>{activity.title}</span>
                <span>{activity.actor}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (role === 'IT_ADMIN') {
    return (
      <div className="space-y-6 p-2">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-700">Operations</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">IT Admin Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: 'Employees in Scope', value: data?.scopeEmployees ?? 0 },
            { label: 'Active Employees', value: data?.activeEmployees ?? 0 },
            { label: 'Inactive Employees', value: data?.inactiveEmployees ?? 0 },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-slate-500">{item.label}</div>
              <div className="mt-2 text-2xl font-bold text-[#071827]">{item.value}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Employee Management Shortcuts</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(data?.employeeManagementShortcuts || []).map((item: string) => (
              <span key={item} className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-800">{item}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-700">Employee Portal</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{data?.welcomeMessage || 'Welcome'}</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div><div className="text-xs uppercase tracking-wide text-slate-500">Employee ID</div><div className="mt-2 font-semibold text-slate-900">{data?.employeeId}</div></div>
          <div><div className="text-xs uppercase tracking-wide text-slate-500">Designation</div><div className="mt-2 font-semibold text-slate-900">{data?.designation}</div></div>
          <div><div className="text-xs uppercase tracking-wide text-slate-500">Department</div><div className="mt-2 font-semibold text-slate-900">{data?.department}</div></div>
          <div><div className="text-xs uppercase tracking-wide text-slate-500">Branch</div><div className="mt-2 font-semibold text-slate-900">{data?.branch}</div></div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Employees', value: data?.totalEmployees ?? 0 },
          { label: 'Active Employees', value: data?.activeEmployees ?? 0 },
          { label: 'Total Applications', value: data?.totalApplications ?? 0 },
          { label: 'Approved Applications', value: data?.approvedApplications ?? 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-slate-500">{item.label}</div>
            <div className="mt-2 text-2xl font-bold text-[#071827]">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
