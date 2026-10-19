'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldCheck } from 'lucide-react';

export default function FirstLoginPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/v1/auth/me', { credentials: 'include' });
        if (!response.ok) return void router.replace('/');
        const result = await response.json();
        if (!result.data.user.requiresPasswordChange) return void router.replace('/dashboard');
      } catch {
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };
    void checkSession();
  }, [router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/first-login-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to change password.');
      router.replace('/dashboard');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to change password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">Checking your account…</main>;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-lg rounded-md border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-50 text-cyan-800"><KeyRound size={20} /></div>
        <p className="mt-6 text-xs font-semibold uppercase text-cyan-800">ASSETRA account security</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Create your password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Your administrator issued a temporary password. Set a personal password to continue to your dashboard.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">New password<input type="password" autoComplete="new-password" minLength={8} required value={form.newPassword} onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))} className="mt-1.5 w-full rounded border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/15" /></label>
          <label className="block text-sm font-medium text-slate-700">Confirm new password<input type="password" autoComplete="new-password" minLength={8} required value={form.confirmPassword} onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))} className="mt-1.5 w-full rounded border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/15" /></label>
          {error && <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded bg-[#075b68] px-4 py-3 text-sm font-semibold text-white hover:bg-[#064852] disabled:opacity-60">{submitting ? 'Saving…' : 'Save and Continue'}</button>
        </form>

        <div className="mt-6 flex items-start gap-2 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-cyan-800" /><p>Your temporary password will stop working after you save your personal password.</p></div>
      </section>
    </main>
  );
}