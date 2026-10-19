'use client';

import { apiUrl } from '@/utils/api';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!employeeId.trim() || !password.trim()) {
      setError('Employee ID and password are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ employeeId: employeeId.trim(), password }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Invalid employee ID or password.');
      }

      if (result?.data?.requiresPasswordChange) {
        router.push('/first-login-password');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Sign in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(460px,0.88fr)]">
      <section
        className="login-brand-grid relative flex min-h-[270px] items-center justify-center overflow-hidden bg-[#050914] px-8 py-10 sm:min-h-[340px] lg:min-h-screen lg:px-14"
      >
        <div className="relative z-10 w-full max-w-2xl text-center lg:text-left">
          <div className="login-mark-stage relative mx-auto aspect-[2/1] w-full max-w-[560px] overflow-hidden lg:mx-0">
            <div className="login-brand-float">
              <Image
                src="/logo.png"
                alt="ASSETRA"
                fill
                sizes="(min-width: 1024px) 560px, calc(100vw - 64px)"
                priority
                className="login-brand-mark object-cover object-top mix-blend-screen drop-shadow-[0_18px_48px_rgba(8,190,230,0.2)]"
              />
            </div>
            <span className="login-bracket login-bracket-tl" aria-hidden="true" />
            <span className="login-bracket login-bracket-tr" aria-hidden="true" />
            <span className="login-bracket login-bracket-bl" aria-hidden="true" />
            <span className="login-bracket login-bracket-br" aria-hidden="true" />
            <span className="login-mark-scan" aria-hidden="true" />
          </div>
          <div className="login-brand-caption mx-auto mt-0 flex max-w-[560px] items-center justify-between border-t border-white/10 pt-4 [animation-delay:240ms] lg:mx-0">
            <div>
              <p className="font-serif text-3xl font-semibold text-white sm:text-4xl">ASSETRA</p>
              <p className="mt-1 text-[11px] font-semibold uppercase text-cyan-200">Financial services</p>
            </div>
            <p className="text-right text-[11px] text-slate-500">NBFC<br />operations</p>
          </div>
        </div>
        <div className="login-accent absolute bottom-0 right-0 h-1 w-2/5 bg-gradient-to-l from-cyan-400/80 to-transparent" />
      </section>

      <section className="login-form-panel flex min-h-[calc(100vh-270px)] items-center justify-center px-6 py-14 sm:min-h-[calc(100vh-340px)] lg:min-h-screen lg:border-l lg:border-slate-200/80 lg:px-12 xl:px-16">
        <div className="login-form-content w-full max-w-[460px]">
          <div className="mb-11">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-cyan-800">
                <span className="login-status-dot h-2 w-2 rounded-full bg-cyan-600" aria-hidden="true" />
                <span>Employee portal</span>
              </div>
              <div className="relative h-9 w-[72px] shrink-0 overflow-hidden rounded bg-[#050914] ring-1 ring-slate-200" aria-label="ASSETRA logo">
                <Image
                  src="/logo.png"
                  alt="ASSETRA logo"
                  fill
                  sizes="72px"
                  className="object-cover object-top mix-blend-screen"
                />
              </div>
            </div>
            <h1 className="font-serif text-5xl font-medium text-slate-950 sm:text-[56px]">Welcome back</h1>
            <div className="login-heading-rule mt-4 h-[2px] w-12 bg-cyan-700" aria-hidden="true" />
            <p className="mt-4 text-base leading-7 text-slate-500">Sign in to your ASSETRA account.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="employeeId" className="mb-2 block text-sm font-medium text-slate-700">Employee ID</label>
              <div className="relative">
                <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                <input
                  id="employeeId"
                  name="employeeId"
                  autoComplete="username"
                  required
                  value={employeeId}
                  onChange={(event) => setEmployeeId(event.target.value)}
                  placeholder="Enter your employee ID"
                  className="w-full rounded-md border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/15"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-md border border-slate-300 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-2 focus:ring-cyan-700/15"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 transition hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error ? (
              <div role="alert" className="border-l-2 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-md bg-[#075b68] px-4 py-3.5 text-sm font-semibold text-white transition duration-200 hover:bg-[#064852] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-800 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
              {!isSubmitting && <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />}
            </button>

            <button
              type="button"
              className="mt-2 w-full text-center text-sm font-medium text-cyan-700 transition hover:text-cyan-900"
              onClick={() => setError('Password reset is handled through the administrator workflow. Contact the Super Admin for assistance.')}
            >
              Forgot Password?
            </button>
          </form>

          <div className="mt-8 flex items-center gap-2 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
            <ShieldCheck size={16} className="shrink-0 text-cyan-800" aria-hidden="true" />
            <p>Access is restricted to authorized ASSETRA personnel.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
