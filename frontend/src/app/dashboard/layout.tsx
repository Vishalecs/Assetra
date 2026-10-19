'use client';

import { apiUrl } from '@/utils/api';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [employeeMenuOpen, setEmployeeMenuOpen] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch(apiUrl('/auth/me'), {
          credentials: 'include',
        });

        if (!response.ok) {
          router.push('/');
          return;
        }

        const data = await response.json();
        setUser(data?.data?.user || null);
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [router]);

  useEffect(() => {
    if (loading || !user) return;
    if (user.requiresPasswordChange) {
      router.replace('/first-login-password');
      return;
    }
    const adminOnlyPath = pathname.startsWith('/dashboard/employees') || pathname.startsWith('/dashboard/change-password');
    if (adminOnlyPath && user.role !== 'SUPER_ADMIN' && user.role !== 'IT_ADMIN') router.replace('/dashboard');
  }, [loading, pathname, router, user]);

  const navItems = useMemo<Array<{ label: string; href?: string; type?: string; items?: { label: string; href: string }[] }>>(() => {
    if (!user) return [];

    const baseItems = [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'My Profile', href: '/dashboard/my-profile' },
    ];

    if (user.role === 'SUPER_ADMIN' || user.role === 'IT_ADMIN') {
      return [
        ...baseItems,
        {
          label: 'Employee Management',
          type: 'group',
          items: [
            { label: 'All Employee', href: '/dashboard/employees' },
            { label: 'Change Password', href: '/dashboard/change-password' },
          ],
        },
      ];
    }

    return baseItems;
  }, [user]);

  const handleLogout = async () => {
    await fetch(apiUrl('/auth/logout'), {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <aside className="h-screen w-72 shrink-0 overflow-hidden border-r border-slate-200 bg-[#071827] p-5 text-white">
        <div className="mb-8 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight">ASSETRA</div>
          <span className="rounded-full border border-slate-600 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-200">
            {loading ? '…' : user?.role || 'USER'}
          </span>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            if (item.type === 'group' && item.items) {
              return (
                <div key={item.label} className="rounded-lg border border-slate-700 bg-slate-900/30">
                  <button
                    type="button"
                    onClick={() => setEmployeeMenuOpen((current) => !current)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-slate-100"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-slate-300">{employeeMenuOpen ? '▾' : '▸'}</span>
                  </button>
                  {employeeMenuOpen && (
                    <div className="space-y-1 border-t border-slate-700 p-2">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`block rounded-md px-3 py-2 text-sm transition ${
                            pathname === subItem.href ? 'bg-slate-700 text-white' : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            if (!item.href) return null;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === item.href ? 'bg-slate-700 text-white' : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-700"
        >
          Logout
        </button>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-6">{children}</main>
    </div>
  );
}
