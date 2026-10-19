'use client';

import { apiUrl } from '@/utils/api';

import { useEffect, useState } from 'react';

export default function IndividualLendingPage() {
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    fetch(apiUrl('/applications'), { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setApplications(data?.data?.items || []))
      .catch(() => setApplications([]));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Individual Lending</h1>
        <p className="text-sm text-slate-500">Monitor Sanction, disbursement, and portfolio exposure.</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          { label: 'Sanctioned', value: '₹2.4 Cr' },
          { label: 'Disbursed', value: '₹1.9 Cr' },
          { label: 'Pending', value: '₹0.5 Cr' },
          { label: 'Portfolio', value: '₹18.2 Cr' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs uppercase text-slate-500">{item.label}</div>
            <div className="mt-2 text-2xl font-bold text-navy">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-800">Loan Pipeline</div>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">App ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((item) => (
              <tr key={item.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{item.applicationNumber}</td>
                <td className="px-4 py-3">{item.customerName}</td>
                <td className="px-4 py-3">{item.loanType}</td>
                <td className="px-4 py-3">₹{Number(item.requestedAmount || 0).toLocaleString()}</td>
                <td className="px-4 py-3">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
