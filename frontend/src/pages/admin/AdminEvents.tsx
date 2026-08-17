import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, ClipboardCheck, Pencil, Trash2, CalendarX2, Sparkles, Award } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/Badge';
import { api, getErrorMessage } from '../../lib/api';
import { formatHumanDate, cn } from '../../lib/utils';
import type { GEvent } from '../../types';

export default function AdminEvents() {
  const [events, setEvents] = useState<GEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/events');
      setEvents(res.data.events);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This will also remove its registrations.`)) return;
    try {
      const res = await api.delete(`/admin/events/${id}`);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filtered = filter === 'ALL' ? events : events.filter((e) => e.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        subtitle={`${events.length} total events`}
        actions={
          <Link to="/admin/events/create" className="btn-primary">
            <Plus className="h-4 w-4" /> Create event
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {['ALL', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-all',
              filter === f ? 'bg-navy-900 text-white' : 'border border-navy-100 bg-white text-ink-soft hover:text-navy-900'
            )}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader label="Loading events…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarX2 className="h-7 w-7" />}
          title="No events found"
          description="Create your first event to get started."
          action={<Link to="/admin/events/create" className="btn-primary"><Plus className="h-4 w-4" /> Create event</Link>}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-ink-faint">
                <th className="p-4 font-medium">Event</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Registrations</th>
                <th className="p-4 font-medium">Flags</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {filtered.map((ev) => (
                <tr key={ev._id} className="transition hover:bg-navy-50/50">
                  <td className="max-w-[240px] p-4">
                    <p className="truncate font-semibold text-navy-900">{ev.title}</p>
                    <p className="font-mono text-[11px] text-ink-faint">{ev.eventId}</p>
                  </td>
                  <td className="p-4 text-ink-soft">{formatHumanDate(ev.date)}</td>
                  <td className="p-4 text-ink-soft">{ev.category}</td>
                  <td className="p-4 text-ink-soft">
                    {ev.registeredCount}
                    {ev.capacity > 0 ? ` / ${ev.capacity}` : ''}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {ev.isInauguration && <span className="chip bg-g-yellow/15 text-yellow-700" title="Inauguration"><Sparkles className="h-3 w-3" /></span>}
                      {ev.isCertificateEligible && <span className="chip bg-g-green/10 text-green-700" title="Certificate eligible"><Award className="h-3 w-3" /></span>}
                    </div>
                  </td>
                  <td className="p-4"><StatusBadge status={ev.status} /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Link to={`/admin/events/${ev.eventId}`} className="rounded-lg p-2 text-ink-soft transition hover:bg-g-blue/10 hover:text-g-blue" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <Link to={`/admin/events/${ev.eventId}/attendance`} className="rounded-lg p-2 text-ink-soft transition hover:bg-g-green/10 hover:text-green-700" title="Attendance">
                        <ClipboardCheck className="h-4 w-4" />
                      </Link>
                      <button onClick={() => remove(ev._id, ev.title)} className="rounded-lg p-2 text-ink-soft transition hover:bg-g-red/10 hover:text-g-red" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
