import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, ArrowRight, CalendarX2, Users, MapPin } from 'lucide-react';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/Badge';
import { api, getErrorMessage } from '../../lib/api';
import { EVENT_CATEGORIES, cn, formatHumanDate } from '../../lib/utils';
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

  useEffect(() => { load(); }, [load]);

  return (
    <section className="min-h-screen bg-white">
      {/* Header */}
      <div className="container-x pt-28 pb-8 md:pt-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-mono text-5xl font-black tracking-tighter text-black md:text-6xl">
              EVENTS
            </h1>
            <p className="mt-3 max-w-md font-mono text-sm text-ink-soft">
              Workshops, hackathons, talks and meetups — find something to learn and build.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2.5">
            <Search className="h-4 w-4 text-black/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full bg-transparent font-mono text-sm text-black placeholder:text-black/30 focus:outline-none sm:w-64"
            />
          </div>
        </div>
        <div className="mt-8 h-px bg-black/10" />
      </div>

      {/* Filter tabs */}
      <div className="container-x pb-10">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-md px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-all',
                tab === t
                  ? 'bg-black text-white'
                  : 'border border-black/10 bg-white text-black/50 hover:border-black/30 hover:text-black'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <PageLoader label="Loading events..." />
      ) : events.length === 0 ? (
        <div className="container-x pb-20">
          <EmptyState
            icon={<CalendarX2 className="h-7 w-7" />}
            title="No events found"
            description="There are no events matching your filters right now. Check back soon."
          />
        </div>
      ) : (
        <div className="container-x pb-20">
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-black/15 md:left-1/2" />

            {events.map((event, i) => {
              const isEven = i % 2 === 0;
              const totalRegistered = event.registeredCount + (event.manualRegistrationCount || 0);

              return (
                <div key={event._id} className="relative mb-12 last:mb-0">
                  {/* Timeline dot */}
                  <div className="absolute left-4 top-6 z-10 h-3 w-3 -translate-x-1.5 rounded-full border-2 border-black bg-white md:left-1/2" />

                  {/* Card — alternating sides on desktop */}
                  <div
                    className={cn(
                      'ml-10 md:ml-0 md:w-[calc(50%-2rem)]',
                      isEven ? 'md:mr-auto md:pr-12' : 'md:ml-auto md:pl-12'
                    )}
                  >
                    <Link
                      to={`/events/${event.eventId}`}
                      className="group block border border-black/10 bg-white p-6 transition-all hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {/* Date */}
                      <div className="font-mono text-xs font-semibold uppercase tracking-wider text-black/40">
                        {formatHumanDate(event.date)}
                        {event.startTime && ` · ${event.startTime}`}
                      </div>

                      {/* Title */}
                      <h2 className="mt-3 font-mono text-lg font-bold text-black transition-colors group-hover:text-g-blue">
                        {event.title}
                      </h2>

                      {/* Description */}
                      {event.shortDescription && (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                          {event.shortDescription}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-black/50">
                        {event.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {event.venue}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {totalRegistered} registered
                        </span>
                      </div>

                      {/* Footer */}
                      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
                            {event.category}
                          </span>
                          <StatusBadge status={event.effectiveStatus} />
                        </div>
                        <span className="flex items-center gap-1 font-mono text-xs font-semibold text-black/40 transition-colors group-hover:text-black">
                          View <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Count */}
          <div className="mt-10 text-center font-mono text-xs text-black/30">
            Showing {events.length} event{events.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </section>
  );
}
