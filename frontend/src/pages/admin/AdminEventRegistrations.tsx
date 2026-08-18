import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList, Download, Filter } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { api, getErrorMessage } from '../../lib/api';
import { downloadBlob } from '../../lib/utils';

interface RegistrationRow {
  id: string;
  studentName: string;
  studentEmail: string;
  rollNumber: string;
  department: string;
  year: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventCategory: string;
  registeredAt: string;
}

interface EventOption {
  eventId: string;
  title: string;
}

export default function AdminEventRegistrations() {
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      const res = await api.get('/admin/events');
      setEvents(res.data.events.map((e: any) => ({ eventId: e.eventId, title: e.title })));
    } catch {}
  };

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedEvent) params.eventId = selectedEvent;
      const res = await api.get('/admin/registrations', { params });
      setRows(res.data.registrations);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);
  useEffect(() => { load(); }, [selectedEvent]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Registration"
        subtitle={`${rows.length} registration${rows.length !== 1 ? 's' : ''}`}
      />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-navy-200 bg-white px-3">
          <Filter className="h-4 w-4 shrink-0 text-ink-faint" />
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="bg-transparent py-2.5 text-sm focus:outline-none"
          >
            <option value="">All Events</option>
            {events.map((ev) => (
              <option key={ev.eventId} value={ev.eventId}>{ev.title}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <PageLoader label="Loading registrations…" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-7 w-7" />}
          title="No registrations found"
          description="Student event registrations will appear here."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-ink-faint">
                <th className="p-4 font-medium">#</th>
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Roll Number</th>
                <th className="p-4 font-medium">Department</th>
                <th className="p-4 font-medium">Event</th>
                <th className="p-4 font-medium">Event Date</th>
                <th className="p-4 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {rows.map((r, i) => (
                <tr key={r.id} className="transition hover:bg-navy-50/50">
                  <td className="p-4 text-ink-faint">{i + 1}</td>
                  <td className="p-4">
                    <p className="font-semibold text-navy-900">{r.studentName}</p>
                    <p className="text-xs text-ink-muted">{r.studentEmail}</p>
                  </td>
                  <td className="p-4 text-ink-soft">{r.rollNumber || '—'}</td>
                  <td className="p-4 text-ink-soft">{r.department || '—'}</td>
                  <td className="p-4">
                    <p className="font-medium text-navy-900">{r.eventTitle}</p>
                    <p className="text-xs text-ink-faint">{r.eventId}</p>
                  </td>
                  <td className="p-4 text-ink-soft">{r.eventDate || '—'}</td>
                  <td className="p-4 text-ink-faint">
                    {r.registeredAt ? new Date(r.registeredAt).toLocaleDateString('en-IN') : '—'}
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
