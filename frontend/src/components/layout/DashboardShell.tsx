import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { cn } from '../../lib/utils';

export interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  badge?: number;
}

export function DashboardShell({
  navItems,
  userLabel,
  userSubLabel,
  logout,
  basePath,
}: {
  navItems: NavItem[];
  userLabel: string;
  userSubLabel: string;
  logout: () => Promise<void>;
  basePath: string;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(basePath === '/dashboard' ? '/login' : '/admin/login');
  };

  const content = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Sidebar">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            )
          }
        >
          <item.icon className="h-[18px] w-[18px]" />
          <span className="flex-1">{item.label}</span>
          {item.badge && item.badge > 0 ? (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-g-blue px-1.5 text-[10px] font-bold text-white">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy-950 lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo light to={basePath} />
        </div>
        {content}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-g-blue to-g-green text-sm font-bold text-white">
              {userLabel.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{userLabel}</p>
              <p className="truncate text-xs text-white/50">{userSubLabel}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-g-red/90 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between bg-navy-950 px-4 lg:hidden">
        <Logo light to={basePath} />
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-white transition hover:bg-white/10"
          aria-label="Toggle sidebar"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 flex flex-col bg-navy-950 pt-14 lg:hidden">
          <div className="flex flex-1 flex-col overflow-y-auto">{content}</div>
          <div className="border-t border-white/10 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-g-red/90 hover:text-white"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        <main className="min-h-screen px-4 pb-16 pt-20 sm:px-6 lg:px-10 lg:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
