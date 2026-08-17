import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EventForm } from '../../components/admin/EventForm';
import { api, getErrorMessage } from '../../lib/api';
import type { GEvent } from '../../types';

export default function AdminEventDetail() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<GEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    api
      .get(`/admin/events/${eventId}`)
      .then((res) => mounted && setEvent(res.data.event))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [eventId, reloadKey]);

  if (loading) return <PageLoader label="Loading event…" />;
  if (!event) return <div className="text-ink-muted">Event not found.</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Edit Event"
        subtitle={`${event.eventId} — ${event.title}`}
        actions={
          <>
            <Link to="/admin/events" className="btn-outline">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <Link to={`/admin/events/${event.eventId}/attendance`} className="btn-green">
              <ClipboardCheck className="h-4 w-4" /> Attendance
            </Link>
          </>
        }
      />
      <EventForm event={event} onSaved={() => setReloadKey((k) => k + 1)} />
    </div>
  );
}
