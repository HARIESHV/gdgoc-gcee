import { useEffect, useCallback, useState } from 'react';
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
  const [open, setOpen] = useState(false);
  const { student, logoutStudent } = useAuth();
  const navigate = useNavigate();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) close(); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [close]);

  const handleLogout = async () => {
    await logoutStudent();
    navigate('/');
    close();
  };

  const onNavClick = () => close();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-white/95 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-g-blue' : 'text-ink-soft hover:text-navy-900'
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
              <Link to="/dashboard" className="btn-outline !px-3.5 !py-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <button onClick={handleLogout} className="btn-ghost !px-3.5 !py-2">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost !px-3.5 !py-2">Login</Link>
              <Link to="/register" className="btn-primary !px-4">Join Community</Link>
            </>
          )}
        </div>

        {/* Mobile: Dashboard/Login button + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {student ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 rounded-lg bg-g-blue px-3 py-1.5 text-sm font-semibold text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft">
                Login
              </Link>
              <Link to="/register" className="rounded-lg bg-g-blue px-3 py-1.5 text-sm font-semibold text-white">
                Join
              </Link>
            </>
          )}
          <button
            className="rounded-lg p-2 text-navy-900 transition hover:bg-navy-50"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={close} />
          <nav className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto bg-white md:hidden shadow-lg">
            <div className="container-x flex flex-col gap-1 py-4">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavClick}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-4 py-3 text-base font-medium transition-colors',
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
                  <Link to="/dashboard" onClick={onNavClick} className="btn-primary w-full">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="btn-outline mt-2 w-full">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={onNavClick} className="btn-outline w-full">
                    Login
                  </Link>
                  <Link to="/register" onClick={onNavClick} className="btn-primary mt-2 w-full">
                    Join Community
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
