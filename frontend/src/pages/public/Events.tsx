import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, CalendarRange, CalendarX2 } from 'lucide-react';
import { EventCard } from '../../components/events/EventCard';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Reveal } from '../../components/ui/Reveal';
import { api, getErrorMessage } from '../../lib/api';
import { EVENT_CATEGORIES } from '../../lib/utils';
import { cn } from '../../lib/utils';
import type { GEvent } from '../../types';

const TABS = ['All', 'Upcoming', 'Completed', ...EVENT_CATEGORIES] as const;

export default function Events() {
  const [events, setEvents] = useState<GEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('All');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (tab === 'Upcoming') params.status = 'UPCOMING';
      else if (tab === 'Completed') params.status = 'COMPLETED';
      else if (tab !== 'All') params.category = tab;
      if (query.trim()) params.q = query.trim();

      const res = await api.get('/events', { params });
      setEvents(res.data.events);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab, query]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 pt-32 pb-16 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 left-1/3 h-64 w-64 rounded-full bg-g-blue/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-g-green/15 blur-3xl" />
        </div>
        <div className="container-x relative z-10">
          <span className="chip border border-white/15 bg-white/5 text-white/80">Events</span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">Events & Activities</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            Workshops, hackathons, talks and meetups — find something to learn and build.
          </p>
          <div className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-xl border border-white/15 bg-white/5 p-1.5 backdrop-blur-sm">
            <Search className="ml-2 h-4 w-4 shrink-0 text-white/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, speakers…"
              className="w-full bg-transparent py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
          </div>
        </div>
        <div className="relative z-10 mt-10 flex h-1.5">
          <div className="flex-1 bg-g-blue" />
          <div className="flex-1 bg-g-green" />
          <div className="flex-1 bg-g-yellow" />
          <div className="flex-1 bg-g-red" />
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="container-x">
          <div className="mb-8 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-all',
                  tab === t ? 'bg-navy-900 text-white shadow-sm' : 'bg-white text-ink-soft hover:text-navy-900 border border-navy-100'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <PageLoader label="Loading events…" />
          ) : events.length === 0 ? (
            <EmptyState
              icon={<CalendarX2 className="h-7 w-7" />}
              title="No events found"
              description="There are no events matching your filters right now. Check back soon."
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event, i) => (
                <Reveal key={event._id} delay={i * 60}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          )}

          {!loading && events.length > 0 && (
            <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-ink-muted">
              <CalendarRange className="h-4 w-4" />
              Showing {events.length} event{events.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
