'use client';

import { apiUrl } from '@/utils/api';

import { useEffect, useState } from 'react';

export default function DepartmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/master-data/departments'), { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setItems(data?.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Department Master</h1>
        <p className="text-sm text-slate-500">Track departments and business units.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-800">Departments</div>
        {loading ? (
          <div className="p-6 text-slate-500">Loading departments...</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{item.id}</td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
