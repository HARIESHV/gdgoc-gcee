import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, CalendarX2, ExternalLink, Users, MailCheck, MailX } from 'lucide-react';
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

  useEffect(() => { load(); }, []);

  const remove = async (eventId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This will also remove its registrations.`)) return;
    try {
      const res = await api.delete(`/admin/events/${eventId}`);
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
          <Link to="/admin/events/create" className="border border-black bg-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-black">
            <Plus className="mr-1 inline h-4 w-4" /> Create event
          </Link>
        }
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-md px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider transition-all',
              filter === f
                ? 'bg-black text-white'
                : 'border border-black/10 bg-white text-black/50 hover:border-black/30 hover:text-black'
            )}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader label="Loading events..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarX2 className="h-7 w-7" />}
          title="No events found"
          description="Create your first event to get started."
          action={
            <Link to="/admin/events/create" className="border border-black bg-black px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-black">
              <Plus className="mr-1 inline h-4 w-4" /> Create event
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded border border-black/10 bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-gray-50">
                <th className="p-4 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Event</th>
                <th className="p-4 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Date</th>
                <th className="p-4 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Category</th>
                <th className="p-4 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Registrations</th>
                <th className="p-4 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Google Form</th>
                <th className="p-4 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Email</th>
                <th className="p-4 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Status</th>
                <th className="p-4 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.map((ev) => (
                <tr key={ev._id} className="transition hover:bg-gray-50">
                  <td className="max-w-[240px] p-4">
                    <p className="truncate font-semibold text-black">{ev.title}</p>
                    <p className="font-mono text-[11px] text-black/30">{ev.eventId}</p>
                  </td>
                  <td className="p-4 font-mono text-xs text-black/50">{formatHumanDate(ev.date)}</td>
                  <td className="p-4">
                    <span className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-black/40">
                      {ev.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-black/30" />
                      <span className="font-mono text-sm font-bold">{ev.registeredCount}</span>
                      {ev.capacity > 0 && (
                        <span className="font-mono text-xs text-black/30">/ {ev.capacity}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {ev.googleFormUrl ? (
                      <a href={ev.googleFormUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-mono text-xs text-black/50 hover:text-black">
                        <ExternalLink className="h-3 w-3" /> View form
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-black/20">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    {ev.emailSent ? (
                      <div className="flex items-center gap-1.5 text-green-700">
                        <MailCheck className="h-3.5 w-3.5" />
                        <span className="font-mono text-xs">Sent to {ev.emailSentCount || 0}</span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 text-black/20">
                        <MailX className="h-3.5 w-3.5" />
                        <span className="font-mono text-xs">Not sent</span>
                      </span>
                    )}
                  </td>
                  <td className="p-4"><StatusBadge status={ev.status} /></td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Link to={`/admin/events/${ev.eventId}`} className="rounded p-2 text-black/30 transition hover:bg-black/5 hover:text-black" title="Manage">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => remove(ev.eventId, ev.title)} className="rounded p-2 text-black/30 transition hover:bg-red-50 hover:text-red-600" title="Delete">
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
