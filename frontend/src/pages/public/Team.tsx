import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { UserCog } from 'lucide-react';
import { MemberCard } from '../../components/members/MemberCard';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Reveal } from '../../components/ui/Reveal';
import { api, getErrorMessage } from '../../lib/api';
import type { Member } from '../../types';

export default function Team() {
  const [core, setCore] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .get('/members')
      .then((res) => {
        if (!mounted) return;
        const g = res.data.grouped || {};
        setCore([...(g['Core Team'] || []), ...(g['Student Coordinators'] || [])]);
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
          <div className="absolute -top-16 right-1/3 h-64 w-64 rounded-full bg-g-yellow/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-g-blue/20 blur-3xl" />
        </div>
        <div className="container-x relative z-10">
          <span className="chip border border-white/15 bg-white/5 text-white/80">Core Team</span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">Meet the Team</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            The leadership and coordinators driving the community forward.
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
        <div className="container-x">
          {loading ? (
            <PageLoader label="Loading team…" />
          ) : core.length === 0 ? (
            <EmptyState
              icon={<UserCog className="h-7 w-7" />}
              title="Team profiles coming soon"
              description="The core team profiles are being finalized."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {core.map((member, i) => (
                <Reveal key={member._id} delay={i * 60}>
                  <MemberCard member={member} />
                </Reveal>
              ))}
            </div>
          )}

          <Reveal>
            <div className="mt-14 rounded-3xl bg-navy-950 p-10 text-center">
              <h3 className="font-display text-2xl font-bold text-white">See the full community</h3>
              <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
                From technical and design teams to the wider member base.
              </p>
              <Link to="/members" className="btn-primary mt-6">
                View all members
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
