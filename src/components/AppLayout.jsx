import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTeam } from '../hooks/useTeam';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/contacts', label: 'Contacts' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
];

export default function AppLayout({ children }) {
  const { user, signOut } = useAuth();
  const { currentTeam } = useTeam();

  const handleSignOut = async () => {
    if (!window.confirm('Sign out of your account?')) return;
    await signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="w-full shrink-0 border-b border-slate-200 bg-white md:w-60 md:border-b-0 md:border-r md:min-h-screen">
        <div className="flex flex-col gap-6 p-5 md:h-full">
          <div>
            <p className="text-lg font-bold text-slate-900">CRM</p>
            <p className="mt-1 truncate text-sm text-slate-500">{currentTeam?.name || 'Your team'}</p>
          </div>

          <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto space-y-2 md:pt-6">
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
