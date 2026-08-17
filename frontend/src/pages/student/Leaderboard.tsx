import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trophy, Zap } from 'lucide-react';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { api, getErrorMessage } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { LeaderboardEntry } from '../../types';

export default function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .get('/leaderboard?limit=100')
      .then((res) => mounted && setRows(res.data.leaderboard))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <PageLoader label="Loading leaderboard…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900 sm:text-3xl">Leaderboard</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Community participation points from event attendance and contributions.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<Trophy className="h-7 w-7" />} title="Leaderboard is empty" description="Points accumulate as members attend events." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-ink-faint">
                <th className="p-4 font-medium">Rank</th>
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Department</th>
                <th className="p-4 font-medium">Events attended</th>
                <th className="p-4 text-right font-medium">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {rows.map((entry) => (
                <tr key={entry.studentId} className="transition hover:bg-navy-50/50">
                  <td className="p-4">
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                        entry.rank === 1
                          ? 'bg-g-yellow/20 text-yellow-700'
                          : entry.rank === 2
                            ? 'bg-slate-200 text-slate-600'
                            : entry.rank === 3
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-navy-50 text-ink-muted'
                      )}
                    >
                      {entry.rank}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {entry.profileImage ? (
                        <img src={entry.profileImage} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-g-blue to-g-green text-sm font-bold text-white">
                          {entry.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-semibold text-navy-900">{entry.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-ink-soft">{entry.department || '—'}</td>
                  <td className="p-4 text-ink-soft">{entry.eventsAttended}</td>
                  <td className="p-4 text-right">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-g-blue">
                      <Zap className="h-4 w-4" /> {entry.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="rounded-xl bg-navy-50 p-4 text-xs leading-relaxed text-ink-muted">
        <strong>Note:</strong> The leaderboard reflects community participation and is not the sole basis for
        certificate eligibility — certificates follow the configured campaign criteria.
      </p>
    </div>
  );
}
