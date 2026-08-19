import { useEffect, useCallback, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, ChevronLeft } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Events', to: '/events' },
  { label: 'Members', to: '/members' },
  { label: 'Team', to: '/team' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Resources', to: '/resources' },
  { label: 'Certificates', to: '/certificates' },
  { label: 'Contact', to: '/contact' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { student, logoutStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const close = useCallback(() => setOpen(false), []);

  // Scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [open]);

  // Close on resize to desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) close(); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [close]);

  // Close on route change
  useEffect(() => {
    close();
  }, [location.pathname, close]);

  // Back button closes mobile menu
  useEffect(() => {
    if (!open) return;
    const handlePopState = () => setOpen(false);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [open]);

  const handleLogout = async () => {
    await logoutStudent();
    navigate('/');
    close();
  };

  return (
    <>
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur-md">
        <div className="container-x flex h-14 items-center justify-between gap-4 md:h-16">
          <Logo />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-colors',
                    isActive ? 'text-black' : 'text-black/40 hover:text-black'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop right buttons */}
          <div className="hidden items-center gap-3 md:flex">
            {student ? (
              <>
                <Link to="/dashboard" className="border border-black/10 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black transition hover:bg-black hover:text-white">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="font-mono text-xs font-bold uppercase tracking-wider text-black/40 transition hover:text-black">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="font-mono text-xs font-bold uppercase tracking-wider text-black/40 transition hover:text-black">
                  Login
                </Link>
                <Link to="/register" className="border border-black bg-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-black">
                  Join
                </Link>
              </>
            )}
          </div>

          {/* Mobile: hamburger only */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded border border-black/10 text-black transition hover:bg-black hover:text-white md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-white transition-all duration-300 md:hidden',
          open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        )}
      >
        {/* Mobile menu header */}
        <div className="flex h-14 items-center justify-between border-b border-black/5 px-4">
          <button
            onClick={close}
            className="flex items-center gap-1 font-mono text-xs font-semibold text-black/50 transition hover:text-black"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={close}
            className="flex h-10 w-10 items-center justify-center rounded border border-black/10 text-black transition hover:bg-black hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={close}
              className={({ isActive }) =>
                cn(
                  'rounded border border-transparent px-4 py-3.5 font-mono text-sm font-bold uppercase tracking-wider transition-all',
                  isActive
                    ? 'border-black bg-black text-white'
                    : 'text-black/50 hover:border-black/10 hover:text-black'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="my-4 h-px bg-black/10" />

          {student ? (
            <>
              <Link
                to="/dashboard"
                onClick={close}
                className="flex w-full items-center justify-center gap-2 border border-black bg-black px-4 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-black"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="mt-2 flex w-full items-center justify-center gap-2 border border-black/10 px-4 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-black/50 transition hover:border-black hover:text-black"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={close}
                className="flex w-full items-center justify-center gap-2 border border-black/10 px-4 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-black/50 transition hover:border-black hover:text-black"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={close}
                className="mt-2 flex w-full items-center justify-center gap-2 border border-black bg-black px-4 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-black"
              >
                Join Community
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
