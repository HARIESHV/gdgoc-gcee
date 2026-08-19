import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Building2,
  Users,
  Award,
  AlertTriangle,
  User2,
  MessageSquare,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { PageLoader } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/Badge';
import { EventRegistrationForm } from '../../components/events/EventRegistrationForm';
import { useAuth } from '../../context/AuthContext';
import { api, getErrorMessage } from '../../lib/api';
import { formatHumanDate, formatHumanDateTime } from '../../lib/utils';
import type { GEvent } from '../../types';

export default function EventDetail() {
  const { eventId } = useParams();
  const { student } = useAuth();
  const [event, setEvent] = useState<GEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [regBusy, setRegBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .get(`/events/${eventId}`)
      .then((res) => {
        if (!mounted) return;
        setEvent(res.data.event);
        setRegistered(res.data.registered || false);
        setTotalRegistered(res.data.event.registeredCount || 0);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [eventId]);

  const handleStudentRegister = async () => {
    if (!student) {
      toast.error('Please sign up or log in to register.');
      return;
    }
    setRegBusy(true);
    try {
      const res = await api.post(`/events/${eventId}/register`);
      toast.success(res.data.message);
      setRegistered(true);
      setTotalRegistered((c) => c + 1);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRegBusy(false);
    }
  };

  if (loading) return <PageLoader label="Loading event..." />;
  if (!event) return <div className="p-12 text-center text-ink-muted">Event not found.</div>;

  const isCompleted = event.effectiveStatus === 'COMPLETED';
  const isUpcoming = event.effectiveStatus === 'UPCOMING' || event.effectiveStatus === 'ONGOING';
  const hasGoogleForm = Boolean(event.googleFormUrl);

  return (
    <>
      <section className="bg-white pt-24">
        {/* Top navigation */}
        <div className="container-x pb-6">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 font-mono text-sm font-semibold text-black/50 transition hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" /> Back to events
          </Link>
        </div>

        {/* Banner */}
        {event.banner && (
          <div className="container-x pb-8">
            <div className="overflow-hidden rounded-xl border border-black/10">
              <img src={event.banner} alt={event.title} className="h-48 w-full object-cover md:h-72 lg:h-80" />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container-x pb-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
            {/* Left column */}
            <div>
              {/* Title */}
              <h1 className="font-mono text-3xl font-black leading-tight tracking-tighter text-black md:text-4xl lg:text-5xl">
                {event.title.toUpperCase()}
              </h1>

              {/* Tags */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusBadge status={event.effectiveStatus} />
                <span className="rounded bg-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
                  {event.category}
                </span>
                {event.isCertificateEligible && (
                  <span className="flex items-center gap-1 rounded bg-green-600 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
                    <Award className="h-3 w-3" /> Certificate
                  </span>
                )}
                {event.isInauguration && (
                  <span className="flex items-center gap-1 rounded bg-yellow-500 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-black">
                    Inauguration
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="my-8 h-px bg-black/10" />

              {/* Description */}
              <div>
                <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-black/40">
                  :: MISSION_SCOPE
                </h2>
                <div className="mt-4 flex gap-4">
                  <div className="w-0.5 shrink-0 bg-black/20" />
                  <p className="whitespace-pre-line text-base leading-relaxed text-ink-soft">
                    {event.description || event.shortDescription || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Technologies */}
              {event.technologies.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-black/40">
                    Technologies
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {event.technologies.map((t) => (
                      <span key={t} className="rounded border border-black/10 bg-white px-3 py-1 font-mono text-xs text-black/60">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Speaker */}
              {event.speaker && (
                <div className="mt-8">
                  <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-black/40">
                    Speaker / Guest
                  </h2>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-black text-white">
                      <User2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-black">🎙 {event.speaker}</p>
                      {event.speakerBio && <p className="mt-1 text-sm text-ink-soft">{event.speakerBio}</p>}
                    </div>
                  </div>
                </div>
              )}



              {/* Divider */}
              <div className="my-8 h-px bg-black/10" />

              {/* Event Status card */}
              <div className="rounded border border-black/10 p-6">
                {isCompleted ? (
                  <div className="text-center">
                    <p className="font-mono text-2xl font-black text-black">✓</p>
                    <p className="mt-2 font-mono text-sm font-bold uppercase tracking-wider text-black">
                      EVENT COMPLETED
                    </p>
                    <p className="mt-2 text-sm text-black/40">
                      Outcomes and gallery link will be posted soon.
                    </p>
                  </div>
                ) : event.effectiveStatus === 'CANCELLED' ? (
                  <div className="text-center">
                    <p className="font-mono text-sm font-bold uppercase tracking-wider text-red-600">
                      EVENT CANCELLED
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-mono text-sm font-bold uppercase tracking-wider text-black">
                      EVENT UPCOMING
                    </p>
                    <p className="mt-2 text-sm text-black/40">
                      Registration details are active. Fill out the registration form to join.
                    </p>
                  </div>
                )}
              </div>

              {/* Feedback */}
              <div className="mt-6 rounded border border-black/10 p-6">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-black/30" />
                  <div>
                    <p className="font-mono text-sm font-bold uppercase tracking-wider text-black">
                      SUBMIT YOUR FEEDBACK
                    </p>
                    <p className="mt-1 text-xs text-black/40">
                      Help us improve future events with your feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column — sticky sidebar */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="border border-black/10 bg-white">
                {/* Info section */}
                <div className="border-b border-black/5 p-6">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-black/40">
                    Event Info
                  </h3>
                  <div className="mt-4 space-y-4">
                    <InfoRow icon={CalendarDays} label="Date" value={formatHumanDate(event.date)} />
                    <InfoRow icon={Clock} label="Time" value={event.startTime ? `${event.startTime} — ${event.endTime || 'TBA'}` : 'TBA'} />
                    <InfoRow icon={MapPin} label="Venue" value={event.venue || 'TBA'} />
                    <InfoRow icon={Building2} label="Organizer" value="GDGoC GCEE" />
                    <InfoRow icon={Users} label="Registered" value={`${totalRegistered}${event.capacity > 0 ? ` / ${event.capacity}` : ''}`} />
                  </div>
                </div>

                {/* Registration section */}
                <div className="p-6">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-black/40">
                    Registration
                  </h3>

                  {event.isInauguration && (
                    <div className="mt-4 flex items-start gap-2 rounded border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      This is the inauguration event. It will not contribute to certificate eligibility.
                    </div>
                  )}

                  {event.isCertificateEligible && (
                    <div className="mt-3 flex items-start gap-2 rounded border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                      <Award className="mt-0.5 h-4 w-4 shrink-0" />
                      Attending this event counts towards your participation certificate.
                    </div>
                  )}

                  {event.registrationDeadline && (
                    <p className="mt-3 font-mono text-xs text-black/40">
                      Deadline: {formatHumanDateTime(event.registrationDeadline)}
                    </p>
                  )}

                  <div className="mt-4">
                    {/* Check if student is NOT logged in */}
                    {!student && isUpcoming ? (
                      <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-center">
                        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600">
                          <Lock className="h-4 w-4" />
                        </div>
                        <p className="font-mono text-xs font-bold uppercase tracking-wider text-red-700">
                          Not Logged In?
                        </p>
                        <p className="mt-1 text-xs text-red-600">
                          "Please sign up or log in before registering for this event."
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Link
                            to={`/register?eventId=${event.eventId}`}
                            className="flex-1 rounded-md bg-emerald-600 py-2 font-mono text-xs font-bold text-white transition hover:bg-emerald-700 text-center"
                          >
                            Sign Up
                          </Link>
                          <Link
                            to={`/login?redirect=/events/${event.eventId}`}
                            className="flex-1 rounded-md bg-blue-600 py-2 font-mono text-xs font-bold text-white transition hover:bg-blue-700 text-center"
                          >
                            Login
                          </Link>
                        </div>
                      </div>
                    ) : event.effectiveStatus === 'CANCELLED' ? (
                      <div className="rounded border border-red-200 bg-red-50 p-3 text-center font-mono text-sm font-bold text-red-600">
                        Event cancelled
                      </div>
                    ) : registered ? (
                      <div className="rounded border border-green-200 bg-green-50 p-3 text-center font-mono text-sm font-bold text-green-700">
                        ✓ You are registered!
                      </div>
                    ) : hasGoogleForm && isUpcoming ? (
                      <a
                        href={event.googleFormUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center gap-2 border border-black bg-black px-6 py-3 font-mono text-sm font-bold text-white transition hover:bg-white hover:text-black"
                      >
                        Register via Google Form <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : isUpcoming && event.registrationEnabled ? (
                      <button
                        onClick={handleStudentRegister}
                        disabled={regBusy}
                        className="flex w-full items-center justify-center gap-2 border border-black bg-black px-6 py-3 font-mono text-sm font-bold text-white transition hover:bg-white hover:text-black disabled:opacity-50"
                      >
                        {regBusy ? 'Registering...' : 'Register Now'}
                      </button>
                    ) : (
                      <div className="rounded border border-black/10 bg-gray-50 p-3 text-center font-mono text-sm text-black/40">
                        {isUpcoming ? 'Registration opens soon' : 'Registration closed'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Registration Form Modal */}
      {showForm && (
        <EventRegistrationForm
          event={event}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-black/5 text-black/40">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-black/30">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-black">{value}</p>
      </div>
    </div>
  );
}
