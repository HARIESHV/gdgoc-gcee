import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
import { MemberCard } from '../../components/members/MemberCard';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Reveal } from '../../components/ui/Reveal';
import { api, getErrorMessage } from '../../lib/api';
import { TEAMS } from '../../lib/utils';
import type { Member } from '../../types';

export default function Members() {
  const [grouped, setGrouped] = useState<Record<string, Member[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .get('/members')
      .then((res) => {
        if (mounted) setGrouped(res.data.grouped || {});
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 pt-32 pb-16 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 left-1/4 h-64 w-64 rounded-full bg-g-green/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-g-red/15 blur-3xl" />
        </div>
        <div className="container-x relative z-10">
          <span className="chip border border-white/15 bg-white/5 text-white/80">Our People</span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">Our Members</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            The students who run and power the GDGoC GCEE community.
          </p>
        </div>
        <div className="relative z-10 mt-10 flex h-1.5">
          <div className="flex-1 bg-g-blue" />
          <div className="flex-1 bg-g-green" />
          <div className="flex-1 bg-g-yellow" />
          <div className="flex-1 bg-g-red" />
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="container-x space-y-14">
          {loading ? (
            <PageLoader label="Loading members…" />
          ) : TEAMS.some((t) => (grouped[t] || []).length > 0) ? (
            TEAMS.filter((team) => (grouped[team] || []).length > 0).map((team, ti) => (
              <div key={team}>
                <Reveal>
                  <h2 className="mb-6 flex items-center gap-3 font-display text-2xl font-bold text-navy-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-white">
                      <Users className="h-4 w-4" />
                    </span>
                    {team}
                    <span className="text-sm font-normal text-ink-muted">({grouped[team].length})</span>
                  </h2>
                </Reveal>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {grouped[team].map((member, i) => (
                    <Reveal key={member._id} delay={i * 60}>
                      <MemberCard member={member} />
                    </Reveal>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No members yet" description="The team directory is being built. Check back soon." />
          )}

          <Reveal>
            <div className="rounded-3xl bg-navy-950 p-10 text-center">
              <h3 className="font-display text-2xl font-bold text-white">Want to be part of this team?</h3>
              <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
                Join the community and contribute to events, projects and the club's growth.
              </p>
              <Link to="/register" className="btn-primary mt-6">
                Join Community
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
