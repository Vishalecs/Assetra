'use client';

import { apiUrl } from '@/utils/api';

import { useEffect, useState } from 'react';

export default function ApplicationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl('/applications'), { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setItems(data?.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">All Applications</h1>
        <p className="text-sm text-slate-500">Review all active and submitted applications.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-800">Application Records</div>
        {loading ? (
          <div className="p-6 text-slate-500">Loading applications...</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">App ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Branch</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{item.applicationNumber || item.applicationId || item.id}</td>
                  <td className="px-4 py-3">{item.customerName}</td>
                  <td className="px-4 py-3">{item.loanType || item.product || '—'}</td>
                  <td className="px-4 py-3">₹{Number(item.requestedAmount ?? item.amount ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3">{item.branch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
