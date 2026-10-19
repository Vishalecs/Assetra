'use client';

import { apiUrl } from '@/utils/api';

import { useEffect, useState } from 'react';

export default function TransactionsPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetch(apiUrl('/applications'), { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setItems((data?.data?.items || []).map((item: any) => ({
        id: item.id,
        reference: item.applicationNumber,
        customer: item.customerName,
        type: item.loanType,
        amount: Number(item.requestedAmount || 0),
        status: item.status,
      }))))
      .catch(() => setItems([]));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
        <p className="text-sm text-slate-500">Track disbursements, repayments, and ledger movement.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-800">Transaction Ledger</div>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{item.reference}</td>
                <td className="px-4 py-3">{item.customer}</td>
                <td className="px-4 py-3">{item.type}</td>
                <td className="px-4 py-3">₹{item.amount.toLocaleString()}</td>
                <td className="px-4 py-3">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
