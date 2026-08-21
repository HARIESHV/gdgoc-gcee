import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, ArrowRight, CalendarX2, Users, MapPin, Calendar, Clock } from 'lucide-react';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
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

  const upcomingEvents = events.filter((e) => e.effectiveStatus === 'UPCOMING' || e.effectiveStatus === 'ONGOING');
  const pastEvents = events.filter((e) => e.effectiveStatus === 'COMPLETED' || e.effectiveStatus === 'CANCELLED');

  return (
    <section className="min-h-screen bg-white">
      {/* Header */}
      <div className="container-x pt-24 pb-4 md:pt-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-mono text-4xl font-black tracking-tighter text-black md:text-5xl">
              EVENTS
            </h1>
            <p className="mt-3 max-w-md font-mono text-sm text-black/50">
              Workshops, hackathons, talks and meetups — find something to learn and build.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5">
            <Search className="h-4 w-4 text-black/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full bg-transparent font-mono text-sm text-black placeholder:text-black/30 focus:outline-none sm:w-64"
            />
          </div>
        </div>
        <div className="mt-6 h-px bg-black/10" />
      </div>

      {/* Filter tabs */}
      <div className="container-x pb-8">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-full border px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-all',
                tab === t
                  ? 'border-black bg-black text-white'
                  : 'border-black/10 bg-white text-black/50 hover:border-black/30 hover:text-black'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Empty */}
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
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="mb-16">
              <h2 className="mb-8 font-mono text-xs font-bold uppercase tracking-[0.2em] text-black/30">
                Upcoming Events
              </h2>
              <div className="relative">
                <div className="absolute left-[18px] top-0 bottom-0 w-px bg-black/10 md:left-1/2" />
                {upcomingEvents.map((event, i) => (
                  <EventTimelineItem key={event._id} event={event} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="mb-8 font-mono text-xs font-bold uppercase tracking-[0.2em] text-black/30">
                Past Events
              </h2>
              <div className="relative">
                <div className="absolute left-[18px] top-0 bottom-0 w-px bg-black/10 md:left-1/2" />
                {pastEvents.map((event, i) => (
                  <EventTimelineItem key={event._id} event={event} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Count */}
          <div className="mt-10 text-center font-mono text-xs text-black/30">
            Showing {events.length} event{events.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </section>
  );
}

function EventTimelineItem({ event, index }: { event: GEvent; index: number }) {
  const totalRegistered = event.registeredCount + (event.manualRegistrationCount || 0);

  return (
    <div className="relative mb-10 last:mb-0">
      {/* Timeline dot */}
      <div className="absolute left-[14px] top-4 z-10 h-[10px] w-[10px] -translate-x-[4.5px] rounded-full border-2 border-black bg-white md:left-1/2 md:-translate-x-[5px]" />

      {/* Content */}
      <div className="ml-12 md:ml-0 md:w-[calc(50%-2rem)]">
        <Link
          to={`/events/${event.eventId}`}
          className="group block rounded-xl border border-black/10 bg-white p-5 transition-all hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:p-6"
        >
          {/* Date and category */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-black/40">
              <Calendar className="h-3 w-3" />
              {formatHumanDate(event.date)}
            </span>
            {event.startTime && (
              <span className="flex items-center gap-1 font-mono text-xs text-black/30">
                <Clock className="h-3 w-3" />
                {event.startTime}
              </span>
            )}
            <span className="rounded-full border border-black/10 bg-black/5 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black/50">
              {event.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="mt-3 font-mono text-base font-bold leading-snug text-black transition-colors group-hover:text-black md:text-lg">
            {event.title}
          </h3>

          {/* Description */}
          {event.shortDescription && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-black/50">
              {event.shortDescription}
            </p>
          )}

          {/* Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-black/40">
            {event.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {event.venue}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {totalRegistered}
            </span>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4">
            <div className="flex items-center gap-2">
              {event.isCertificateEligible && (
                <span className="rounded-full border border-black/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-black/40">
                  Cert
                </span>
              )}
              <span className="font-mono text-[10px] font-bold uppercase text-black/30">
                {event.effectiveStatus}
              </span>
            </div>
            <span className="flex items-center gap-1 font-mono text-xs font-semibold text-black/30 transition-colors group-hover:text-black">
              View event <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
