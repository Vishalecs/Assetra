'use client';

import { useState } from 'react';

export default function NewApplicationPage() {
  const [form, setForm] = useState({
    customerName: '',
    customerId: '',
    branch: '',
    loanOfficer: '',
    loanType: 'Personal Loan',
    requestedAmount: '',
    applicationDate: '',
    status: 'DRAFT',
  });
  const [message, setMessage] = useState('');

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/v1/applications', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          requestedAmount: Number(form.requestedAmount),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Application could not be saved.');
      setMessage('Application saved successfully.');
      setForm({
        customerName: '',
        customerId: '',
        branch: '',
        loanOfficer: '',
        loanType: 'Personal Loan',
        requestedAmount: '',
        applicationDate: '',
        status: 'DRAFT',
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Application could not be saved.');
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Initial Customer Application</h1>
      <p className="mb-6 text-sm text-slate-500">Capture basic customer and loan details for new applications.</p>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Customer Name</label>
            <input value={form.customerName} onChange={(e) => handleChange('customerName', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Customer ID</label>
            <input value={form.customerId} onChange={(e) => handleChange('customerId', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Branch</label>
            <input value={form.branch} onChange={(e) => handleChange('branch', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Loan Officer</label>
            <input value={form.loanOfficer} onChange={(e) => handleChange('loanOfficer', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Loan Type</label>
            <select value={form.loanType} onChange={(e) => handleChange('loanType', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy">
              <option>Personal Loan</option>
              <option>Business Loan</option>
              <option>Housing Loan</option>
              <option>Vehicle Loan</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Requested Amount</label>
            <input type="number" value={form.requestedAmount} onChange={(e) => handleChange('requestedAmount', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Application Date</label>
            <input type="date" value={form.applicationDate} onChange={(e) => handleChange('applicationDate', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy">
              <option>DRAFT</option>
              <option>SUBMITTED</option>
              <option>PENDING</option>
            </select>
          </div>
        </div>

        {message ? <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null}

        <div className="flex justify-end">
          <button type="submit" className="rounded-lg bg-navy px-4 py-2 font-medium text-white hover:bg-slate-800">
            Save Application
          </button>
        </div>
      </form>
    </div>
  );
}
