import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Menu, X, Sun, Users } from 'lucide-react';
import { MemberCard } from '../../components/members/MemberCard';
import { PageLoader } from '../../components/ui/Spinner';
import { Reveal } from '../../components/ui/Reveal';
import { api, getErrorMessage } from '../../lib/api';
import { TEAMS } from '../../lib/utils';
import type { Member } from '../../types';

export default function Members() {
  const [grouped, setGrouped] = useState<Record<string, Member[]>>({});
  const [membersList, setMembersList] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get('/members')
      .then((res) => {
        if (mounted) {
          const grp = res.data.grouped || {};
          setGrouped(grp);
          const all = res.data.members || [];
          setMembersList(all);
        }
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Mobile Sticky Header */}
      <div className="sticky top-3 z-40 px-3 sm:px-6">
        <header className="mx-auto flex max-w-lg items-center justify-between rounded-full border border-slate-300 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur-md transition-all">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 font-bold text-xs">
              <span className="text-g-blue">G</span>
              <span className="text-g-red">D</span>
              <span className="text-g-yellow">G</span>
            </div>
            <span className="font-display text-sm font-bold tracking-tight text-slate-900 sm:text-base">
              GDGOC GCEE
            </span>
          </Link>

          {/* Hamburger Menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full p-1.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Navigation Dropdown */}
        {menuOpen && (
          <div className="mx-auto mt-2 max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-lg animate-in fade-in slide-in-from-top-2">
            <nav className="flex flex-col gap-2 font-medium text-sm text-slate-700">
              <Link to="/" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100">Home</Link>
              <Link to="/events" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100">Events</Link>
              <Link to="/members" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 bg-slate-100 font-bold text-navy-900">Members</Link>
              <Link to="/about" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100">About</Link>
              <Link to="/contact" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-slate-100">Contact</Link>
            </nav>
          </div>
        )}
      </div>

      {/* Main Members Section */}
      <main className="container-x mx-auto max-w-5xl px-3 pt-6 sm:px-6">
        <div className="mb-6 text-center">
          <span className="chip border border-slate-200 bg-white text-slate-600 shadow-xs">
            GDGOC GCEE Team
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Members Directory
          </h1>
          <p className="mx-auto mt-2 max-w-md text-xs text-slate-500 sm:text-sm">
            Meet the active student developers and coordinators behind GDGOC GCEE.
          </p>
        </div>

        {loading ? (
          <PageLoader label="Loading members…" />
        ) : membersList.length > 0 ? (
          <div className="space-y-10">
            {TEAMS.filter((team) => (grouped[team] || []).length > 0).map((team) => (
              <div key={team}>
                <Reveal>
                  <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-slate-900 sm:text-xl">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-900 text-white">
                      <Users className="h-3.5 w-3.5" />
                    </span>
                    {team}
                    <span className="text-xs font-normal text-slate-400">({grouped[team].length})</span>
                  </h2>
                </Reveal>
                {/* 2-Column Responsive Grid on Mobile */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {grouped[team].map((member, i) => (
                    <Reveal key={member._id} delay={i * 50}>
                      <MemberCard member={member} />
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Fallback empty view with sample grid */
          <div className="space-y-6">
            <h2 className="font-display text-lg font-bold text-slate-900 text-center">Core Team</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <MemberCard
                  key={num}
                  member={{
                    _id: `sample-${num}`,
                    name: `MEMBER NAME ${num}`,
                    team: 'Core Team',
                    role: 'Board Member',
                    department: 'GDGOC GCEE',
                    year: '2026',
                    photo: '',
                    socialLinks: { linkedin: 'https://linkedin.com' },
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Theme Button */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg border border-slate-200 transition-transform hover:scale-105 active:scale-95"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5 text-amber-500" />
      </button>
    </div>
  );
}
