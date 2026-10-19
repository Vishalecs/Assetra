'use client';

import { apiUrl } from '@/utils/api';

import { useEffect, useState } from 'react';

export default function BranchesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/master-data/branches'), { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setItems(data?.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Branch Master</h1>
        <p className="text-sm text-slate-500">Manage branch locations and codes.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-800">Branches</div>
        {loading ? (
          <div className="p-6 text-slate-500">Loading branches...</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Region</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{item.id}</td>
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.code}</td>
                  <td className="px-4 py-3">{item.region || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
