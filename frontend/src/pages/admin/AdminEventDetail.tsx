import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Download,
  Users,
  FileText,
  Send,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EventForm } from '../../components/admin/EventForm';
import { api, getErrorMessage } from '../../lib/api';
import { cn, downloadBlob, formatHumanDate } from '../../lib/utils';
import type { GEvent } from '../../types';

type Tab = 'details' | 'registrations' | 'announcement';

export default function AdminEventDetail() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<GEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<Tab>('details');

  useEffect(() => {
    let mounted = true;
    api
      .get(`/admin/events/${eventId}`)
      .then((res) => mounted && setEvent(res.data.event))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [eventId, reloadKey]);

  if (loading) return <PageLoader label="Loading event..." />;
  if (!event) return <div className="text-ink-muted">Event not found.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Management"
        subtitle={`${event.eventId} — ${event.title}`}
        actions={
          <div className="flex items-center gap-3">
            <Link to="/admin/events" className="border border-black/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black/50 transition hover:text-black">
              <ArrowLeft className="mr-1 inline h-4 w-4" /> All Events
            </Link>
            <Link
              to={`/events/${event.eventId}`}
              target="_blank"
              className="border border-black/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-black/50 transition hover:text-black"
            >
              View Public Page
            </Link>
          </div>
        }
      />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-black/10">
        {(['details', 'registrations', 'announcement'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'border-b-2 px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all',
              tab === t
                ? 'border-black text-black'
                : 'border-transparent text-black/30 hover:text-black/60'
            )}
          >
            {t === 'details' && 'Edit Details'}
            {t === 'registrations' && 'Registrations'}
            {t === 'announcement' && 'Send Announcement'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'details' && (
        <EventForm event={event} onSaved={() => setReloadKey((k) => k + 1)} />
      )}

      {tab === 'registrations' && (
        <EventRegistrations eventId={event.eventId} event={event} />
      )}

      {tab === 'announcement' && (
        <EventAnnouncementComposer event={event} />
      )}
    </div>
  );
}

/* ─── Registrations Tab ───────────────────────────────────────────── */

function EventRegistrations({ eventId, event }: { eventId: string; event: GEvent }) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sendingPdf, setSendingPdf] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '50' };
      if (search) params.search = search;
      const res = await api.get(`/admin/events/${eventId}/registrations`, { params });
      setRegistrations(res.data.registrations);
      setCount(res.data.total);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [eventId, page, search]);

  useEffect(() => { load(); }, [load]);

  const handleExportCsv = async () => {
    try {
      const res = await api.get(`/admin/events/${eventId}/registrations/export`, { responseType: 'blob' });
      downloadBlob(res.data as Blob, `${eventId}-registrations.csv`);
      toast.success('CSV downloaded!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      const res = await api.get(`/admin/events/${eventId}/registration-list`, { responseType: 'blob' });
      downloadBlob(res.data as Blob, `${eventId}-registration-list.pdf`);
      toast.success('PDF downloaded!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleSendPdf = async () => {
    setSendingPdf(true);
    try {
      const res = await api.post(`/admin/events/${eventId}/send-pdf`);
      toast.success(`PDF sent to ${res.data.sent} student(s)!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSendingPdf(false);
    }
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    try {
      await api.delete(`/admin/events/${eventId}/registrations/${registrationId}`);
      toast.success('Registration deleted.');
      setDeleteConfirm(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-4 rounded border border-black/10 bg-white p-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-black/40" />
          <span className="font-mono text-base font-bold text-black">{count}</span>
          <span className="font-mono text-xs text-black/50">Total Registrations</span>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={handleSendPdf}
            disabled={sendingPdf || count === 0}
            className="flex items-center gap-1.5 border border-black bg-black px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-black disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            {sendingPdf ? 'Sending...' : 'Send PDF to All'}
          </button>
          <button
            onClick={handleGeneratePdf}
            disabled={generating || count === 0}
            className="flex items-center gap-1.5 border border-black/10 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-black/60 transition hover:bg-black/5 disabled:opacity-40"
          >
            <FileText className="h-3.5 w-3.5" />
            {generating ? 'Generating...' : 'Download PDF'}
          </button>
          <button
            onClick={handleExportCsv}
            disabled={count === 0}
            className="flex items-center gap-1.5 border border-black/10 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-black/60 transition hover:bg-black/5 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Registrations list table */}
      <div className="overflow-x-auto rounded border border-black/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-gray-50/80 font-mono text-[11px] font-bold uppercase tracking-wider text-black/50">
              <th className="p-3">#</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">College</th>
              <th className="p-3">Dept</th>
              <th className="p-3">Year</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Registration Date</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-black/40">Loading registrations...</td>
              </tr>
            ) : registrations.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-black/40">No registrations found.</td>
              </tr>
            ) : (
              registrations.map((r, i) => (
                <tr key={r._id} className="transition hover:bg-gray-50/50">
                  <td className="p-3 font-mono text-xs text-black/40">{(page - 1) * 50 + i + 1}</td>
                  <td className="p-3 font-semibold text-black">{r.name}</td>
                  <td className="p-3 font-mono text-xs text-black/60">{r.email}</td>
                  <td className="p-3 text-xs text-black/70">{r.college || 'GCEE'}</td>
                  <td className="p-3 text-xs text-black/70">{r.department || '—'}</td>
                  <td className="p-3 text-xs text-black/70">{r.year || '—'}</td>
                  <td className="p-3 font-mono text-xs text-black/60">{r.phone || '—'}</td>
                  <td className="p-3 font-mono text-xs text-black/50">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteRegistration(r._id)}
                      className="font-mono text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Event Announcement Composer ─────────────────────────────────────── */

function EventAnnouncementComposer({ event }: { event: GEvent }) {
  const [recipientGroup, setRecipientGroup] = useState<'all' | 'registered' | 'unregistered'>('all');
  const [subject, setSubject] = useState(`Registration Open – ${event.title}`);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ sentCount: number; failedCount: number; status: string } | null>(null);

  const regUrl = `https://gdgoc-gcee.vercel.app/events/${event.eventId}/register`;

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) {
      toast.error('Subject is required.');
      return;
    }

    if (!window.confirm(`Send this announcement email to target group "${recipientGroup.toUpperCase()}"?`)) return;

    setBusy(true);
    setResult(null);
    try {
      const res = await api.post(`/admin/events/${event.eventId}/send-announcement`, {
        recipientGroup,
        subject,
        message,
      });
      setResult(res.data);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Composer form */}
      <form onSubmit={handleSendAnnouncement} className="space-y-6 card p-6">
        <div>
          <h3 className="font-display text-base font-bold text-navy-900">Send Event Announcement</h3>
          <p className="mt-1 text-xs text-ink-muted">
            Send an official email announcement directly to students' Gmail accounts with the event registration link.
          </p>
        </div>

        <div>
          <label className="label">Recipients Group</label>
          <select
            className="input"
            value={recipientGroup}
            onChange={(e) => setRecipientGroup(e.target.value as any)}
          >
            <option value="all">All Students (Default)</option>
            <option value="registered">Registered Students Only</option>
            <option value="unregistered">Unregistered Students Only</option>
          </select>
        </div>

        <div>
          <label className="label">Subject</label>
          <input
            className="input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Registration Open – AI & GenAI Workshop"
          />
        </div>

        <div>
          <label className="label">Additional Message (Optional)</label>
          <textarea
            rows={4}
            className="input resize-y"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add custom notes or instructions for students..."
          />
        </div>

        <div>
          <label className="label">Website Registration Link</label>
          <div className="flex items-center gap-2 rounded border border-black/10 bg-gray-50 px-3 py-2 font-mono text-xs text-black/70">
            <ExternalLink className="h-3.5 w-3.5 text-black/40" />
            <span className="truncate">{regUrl}</span>
          </div>
        </div>

        {result && (
          <div className={cn(
            'rounded-xl border p-4 text-sm',
            result.status === 'Success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'
          )}>
            <p className="font-bold">
              {result.status === 'Success' ? '✓ Announcement Sent Successfully' : '⚠ Announcement Processed with Warnings'}
            </p>
            <p className="mt-1 text-xs">
              Successfully delivered: <strong>{result.sentCount}</strong> | Failed: <strong>{result.failedCount}</strong>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 border border-black bg-black px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-black disabled:opacity-50"
        >
          <Mail className="h-4 w-4" />
          {busy ? 'Sending Announcement...' : 'Send Event Announcement'}
        </button>
      </form>

      {/* Live Email Preview */}
      <div className="card p-6 bg-slate-50 space-y-4">
        <div>
          <span className="chip bg-navy-900 text-white font-mono text-[10px] uppercase">Email Live Preview</span>
          <h4 className="mt-2 font-bold text-navy-900">{subject || 'Registration Open – Event'}</h4>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 text-xs text-slate-700">
          <p>Hi <strong>Student Name</strong>,</p>
          <p>We are excited to announce an upcoming event organized by GDGoC GCEE.</p>

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-2 font-mono">
            <p><strong>Event:</strong> {event.title}</p>
            <p><strong>Date:</strong> {formatHumanDate(event.date)}</p>
            <p><strong>Time:</strong> {event.startTime ? `${event.startTime} - ${event.endTime || ''}` : 'TBA'}</p>
            <p><strong>Venue:</strong> {event.venue || 'TBA'}</p>
            <p><strong>Event Type:</strong> {event.category}</p>
          </div>

          {message && <p className="whitespace-pre-wrap">{message}</p>}

          <p>Registration is now open.</p>

          <div className="text-center py-2">
            <span className="inline-block rounded-md bg-blue-600 px-6 py-2.5 font-mono font-bold text-white shadow-xs">
              REGISTER FOR EVENT
            </span>
          </div>

          <p className="text-center text-[11px] text-slate-400">
            Registration Deadline: {event.registrationDeadline || 'Until Event Date'}
          </p>

          <hr className="border-slate-100" />
          <p className="text-[11px] text-slate-500">
            Regards,<br/>
            <strong>GDGoC GCEE Team</strong><br/>
            Government College of Engineering, Erode
          </p>
        </div>
      </div>
    </div>
  );
}
