import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { student, logoutStudent } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleLogout = async () => {
    await logoutStudent();
    navigate('/');
    setOpen(false);
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'border-b border-navy-100 bg-white/90 shadow-sm backdrop-blur-md' : 'bg-transparent'
      )}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo light={!scrolled} />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  scrolled
                    ? isActive
                      ? 'text-g-blue'
                      : 'text-ink-soft hover:text-navy-900'
                    : isActive
                      ? 'text-white'
                      : 'text-white/80 hover:text-white'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {student ? (
            <>
              <Link
                to="/dashboard"
                className={cn(
                  'rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
                  scrolled
                    ? 'border-navy-200 bg-white text-navy-900 hover:border-g-blue hover:text-g-blue'
                    : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                )}
              >
                <LayoutDashboard className="inline h-4 w-4 mr-1.5" />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                  scrolled
                    ? 'text-ink-soft hover:bg-navy-50 hover:text-navy-900'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                <LogOut className="inline h-4 w-4 mr-1.5" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={cn(
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                  scrolled
                    ? 'text-ink-soft hover:bg-navy-50 hover:text-navy-900'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                  scrolled
                    ? 'bg-navy-900 text-white hover:bg-navy-800'
                    : 'bg-white text-navy-900 hover:bg-white/90'
                )}
              >
                Join Community
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className={cn(
            'rounded-lg p-2 transition lg:hidden',
            scrolled ? 'text-navy-900 hover:bg-navy-50' : 'text-white hover:bg-white/10'
          )}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-white lg:hidden">
          <div className="container-x flex flex-col gap-1 py-6">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-3 text-base font-medium transition-colors',
                    isActive ? 'bg-g-blue/10 text-g-blue' : 'text-ink-soft hover:bg-navy-50'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="my-3 h-px bg-navy-100" />
            {student ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-primary w-full">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-outline mt-2 w-full"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="btn-outline w-full">
                  Login
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary mt-2 w-full">
                  Join Community
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
