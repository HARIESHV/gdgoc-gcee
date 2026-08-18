import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  Clock,
  MapPin,
  User2,
  Users,
  Award,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { PageLoader } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/Badge';
import { api, getErrorMessage } from '../../lib/api';
import { formatHumanDate, formatHumanDateTime } from '../../lib/utils';
import { cn } from '../../lib/utils';
import type { GEvent } from '../../types';

export default function EventDetail() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<GEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/events/${eventId}`);
        if (!mounted) return;
        setEvent(res.data.event);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [eventId]);

  if (loading) {
    return (
      <div className="bg-slate-50 pt-24">
        <PageLoader label="Loading event…" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="bg-slate-50 px-4 pt-28 pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg font-semibold text-navy-900">Event not found</p>
          <Link to="/events" className="btn-outline mt-6">
            <ArrowLeft className="h-4 w-4" /> Back to events
          </Link>
        </div>
      </div>
    );
  }

  const isUpcoming = event.effectiveStatus === 'UPCOMING' || event.effectiveStatus === 'ONGOING';
  const hasGoogleForm = Boolean(event.googleFormUrl);
  const totalRegistered = event.registeredCount + (event.manualRegistrationCount || 0);

  return (
    <>
      {/* Banner */}
      <section className="relative h-[320px] w-full overflow-hidden bg-navy-900 sm:h-[400px]">
        {event.banner ? (
          <img src={event.banner} alt={event.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-g-blue to-navy-900">
            <Sparkles className="h-16 w-16 text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="container-x pb-8">
            <Link to="/events" className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/70 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> All events
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={event.effectiveStatus} />
              <span className="chip border border-white/20 bg-white/10 text-white backdrop-blur-sm">{event.category}</span>
              {event.isInauguration && (
                <span className="chip border border-white/20 bg-g-yellow/80 text-navy-900">
                  <Sparkles className="h-3 w-3" /> Inauguration
                </span>
              )}
              {event.isCertificateEligible && (
                <span className="chip border border-white/20 bg-g-green/80 text-white">
                  <Award className="h-3 w-3" /> Certificate eligible
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">{event.title}</h1>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="container-x grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Details */}
            <div className="card grid gap-4 p-6 sm:grid-cols-2">
              <DetailItem icon={CalendarDays} label="Date" value={formatHumanDate(event.date)} />
              <DetailItem icon={Clock} label="Time" value={event.startTime ? `${event.startTime} — ${event.endTime || 'TBA'}` : 'To be announced'} />
              <DetailItem icon={MapPin} label="Venue" value={event.venue || 'TBA'} />
              <DetailItem icon={Building2} label="Organized by" value="GDGoC GCEE" />
            </div>

            {/* About event */}
            <div className="card p-6">
              <h2 className="font-display text-xl font-bold text-navy-900">About this event</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft sm:text-base">
                {event.description || event.shortDescription}
              </p>
              {event.technologies.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-sm font-semibold text-navy-900">Technologies</p>
                  <div className="flex flex-wrap gap-2">
                    {event.technologies.map((t) => (
                      <span key={t} className="chip border border-navy-100 bg-navy-50 font-mono text-xs text-navy-800">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Speaker */}
            {event.speaker && (
              <div className="card p-6">
                <h2 className="font-display text-xl font-bold text-navy-900">Speaker</h2>
                <div className="mt-4 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-g-blue to-g-green text-white">
                    <User2 className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">{event.speaker}</p>
                    {event.speakerBio && <p className="mt-1 text-sm text-ink-muted">{event.speakerBio}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Registration card */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="card overflow-hidden">
              <div className="border-b border-navy-50 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-navy-900">Registration</p>
                  <StatusBadge status={event.effectiveStatus} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
                  <Users className="h-4 w-4 text-g-blue" />
                  {totalRegistered} registered
                </div>
                {event.capacity > 0 && (
                  <p className="mt-1 text-xs text-ink-muted">
                    {Math.max(event.capacity - totalRegistered, 0)} {event.capacity - totalRegistered === 1 ? 'seat' : 'seats'} remaining
                  </p>
                )}
                {event.registrationDeadline && (
                  <p className="mt-2 text-xs text-ink-muted">
                    Deadline: {formatHumanDateTime(event.registrationDeadline)}
                  </p>
                )}
              </div>

              <div className="space-y-3 p-5">
                {event.isInauguration && (
                  <div className="flex items-start gap-2 rounded-lg bg-g-yellow/10 p-3 text-xs text-yellow-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    This is the inauguration event. It will not contribute to certificate eligibility.
                  </div>
                )}
                {event.isCertificateEligible && (
                  <div className="flex items-start gap-2 rounded-lg bg-g-green/10 p-3 text-xs text-green-800">
                    <Award className="mt-0.5 h-4 w-4 shrink-0" />
                    Attending this event counts towards your participation certificate.
                  </div>
                )}

                {event.effectiveStatus === 'CANCELLED' ? (
                  <p className="rounded-lg bg-g-red/10 p-3 text-center text-sm font-medium text-g-red">Event cancelled</p>
                ) : hasGoogleForm && isUpcoming ? (
                  <a
                    href={event.googleFormUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary flex w-full items-center justify-center gap-2"
                  >
                    Register Now <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <p className="rounded-lg bg-navy-50 p-3 text-center text-sm text-ink-muted">
                    {isUpcoming ? 'Registration opens soon' : 'Registration closed'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-faint">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-navy-900">{value}</p>
      </div>
    </div>
  );
}
