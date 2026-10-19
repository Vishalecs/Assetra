'use client';

import { apiUrl } from '@/utils/api';

import { useEffect, useState } from 'react';

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rolesResponse, permissionsResponse] = await Promise.all([
          fetch(apiUrl('/master-data/roles'), { credentials: 'include' }),
          fetch(apiUrl('/master-data/permissions'), { credentials: 'include' }),
        ]);

        const [rolesData, permissionsData] = await Promise.all([
          rolesResponse.json(),
          permissionsResponse.json(),
        ]);

        setRoles(rolesData?.data || []);
        setPermissions(permissionsData?.data || []);
      } catch {
        setRoles([]);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Roles & Permissions</h1>
        <p className="text-sm text-slate-500">Access control is defined by backend role permissions and authorization checks.</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">Loading roles and permissions...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {roles.map((role) => (
            <div key={role.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">{role.name}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{permissions.filter((permission) => permission.module === 'employees' || permission.module === 'dashboard' || permission.module === 'profile').length} permissions</span>
              </div>
              <p className="mb-4 text-sm text-slate-500">{role.description}</p>
              <ul className="space-y-2 text-sm text-slate-600">
                {permissions.slice(0, 4).map((permission) => (
                  <li key={permission.id} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {permission.description}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
