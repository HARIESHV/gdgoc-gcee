import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Clock, Users, Award, Rocket, User2 } from 'lucide-react';
import type { GEvent } from '../../types';
import { cn, formatHumanDate } from '../../lib/utils';
import { StatusBadge } from '../ui/Badge';

const categoryStyles: Record<string, string> = {
  Workshop: 'from-g-blue to-blue-600',
  Hackathon: 'from-g-red to-rose-600',
  'Technical Talk': 'from-g-yellow to-amber-500',
  Seminar: 'from-violet-500 to-purple-600',
  'Coding Session': 'from-g-green to-emerald-600',
  'Hands-on Session': 'from-cyan-500 to-sky-600',
  'Project Showcase': 'from-fuchsia-500 to-pink-600',
  'Community Meetup': 'from-g-green to-teal-600',
  Other: 'from-navy-600 to-navy-800',
};

export function EventCard({ event, className }: { event: GEvent; className?: string }) {
  const gradient = categoryStyles[event.category] || categoryStyles.Other;

  return (
    <Link
      to={`/events/${event.eventId}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift',
        className
      )}
    >
      <div className={cn('relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br', gradient)}>
        {event.banner ? (
          <img src={event.banner} alt={event.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-white">
            <Rocket className="h-10 w-10 opacity-90" />
            <span className="text-sm font-semibold">{event.category}</span>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="chip border border-white/20 bg-navy-950/60 text-white backdrop-blur-sm">{event.category}</span>
          <div className="flex gap-1.5">
            {event.isCertificateEligible && (
              <span className="chip border border-white/20 bg-g-green/80 text-white backdrop-blur-sm" title="Certificate eligible">
                <Award className="h-3 w-3" /> Cert
              </span>
            )}
            {event.isInauguration && (
              <span className="chip border border-white/20 bg-g-yellow/80 text-navy-900 backdrop-blur-sm" title="Inauguration">
                <SparkleIcon className="h-3 w-3" /> Inauguration
              </span>
            )}
          </div>
        </div>
        <div className="absolute bottom-3 left-3">
          <StatusBadge status={event.effectiveStatus} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-bold leading-snug text-navy-900 transition-colors group-hover:text-g-blue">
          {event.title}
        </h3>
        {event.shortDescription && (
          <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">{event.shortDescription}</p>
        )}

        <div className="mt-4 space-y-2 text-sm text-ink-soft">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-g-blue" />
            <span>{formatHumanDate(event.date)}</span>
            {event.startTime && (
              <span className="ml-auto flex items-center gap-1 text-xs text-ink-muted">
                <Clock className="h-3.5 w-3.5" /> {event.startTime}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-g-green" />
            <span className="truncate">{event.venue || 'Venue TBA'}</span>
          </div>
          <div className="flex items-center gap-2">
            <User2 className="h-4 w-4 shrink-0 text-g-yellow" />
            <span className="truncate">{event.speaker || 'GDGoC GCEE'}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-navy-50 pt-3">
          <span className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Users className="h-4 w-4" />
            <span className="font-semibold text-navy-900">{event.registeredCount || 0}</span> registered
          </span>
          <span className="rounded bg-black px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-black border border-black">
            REGISTER VIA EVENT
          </span>
        </div>
      </div>
    </Link>
  );
}

function SparkleIcon(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="12" height="12" {...props}>
      <path d="M12 2l1.9 5.7a2 2 0 0 0 1.3 1.3L21 11l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 20l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 11l5.8-1.9a2 2 0 0 0 1.3-1.3L12 2z" />
    </svg>
  );
}
