import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Download,
  Mail,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/Badge';
import { EventForm } from '../../components/admin/EventForm';
import { api, getErrorMessage, downloadPdf } from '../../lib/api';
import { formatHumanDate, cn, downloadBlob } from '../../lib/utils';
import type { GEvent, SendingHistoryEntry, SendingHistoryStats } from '../../types';

type Tab = 'details' | 'registrations' | 'emails' | 'history';

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
        {(['details', 'registrations', 'emails', 'history'] as Tab[]).map((t) => (
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
            {t === 'emails' && 'Send Emails'}
            {t === 'history' && 'Sending History'}
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

      {tab === 'emails' && (
        <EventEmailSender eventId={event.eventId} event={event} />
      )}

      {tab === 'history' && (
        <EventSendingHistory eventId={event.eventId} />
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
  const [pdfResult, setPdfResult] = useState<{ sent: number; failed: number; total: number; failedEmails?: string[] } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // registrationId

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
    setPdfResult(null);
    try {
      const res = await api.post(`/admin/events/${eventId}/send-pdf`);
      setPdfResult(res.data);
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
          <span className="font-mono text-sm font-bold">{count}</span>
          <span className="font-mono text-xs text-black/40">registered</span>
        </div>
        {event.capacity > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-black/40">Capacity: {event.capacity}</span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full bg-black transition-all"
                style={{ width: `${Math.min((count / event.capacity) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
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

      {/* Search */}
      <div className="flex items-center gap-2 rounded border border-black/10 bg-white px-4 py-2.5">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, phone, roll..."
          className="w-full bg-transparent font-mono text-sm text-black placeholder:text-black/30 focus:outline-none"
        />
      </div>

      {/* Table */}
      {loading ? (
        <PageLoader label="Loading registrations..." />
      ) : registrations.length === 0 ? (
        <div className="rounded border border-black/10 bg-white p-8 text-center font-mono text-sm text-black/40">
          No registrations found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-black/10 bg-white">
          {/* Send PDF result */}
          {pdfResult && (
            <div className="border-b border-black/5 bg-gray-50 px-4 py-3">
              <p className="font-mono text-xs">
                <span className="font-bold text-green-700">{pdfResult.sent} sent</span>
                {' · '}
                <span className="font-bold text-red-600">{pdfResult.failed} failed</span>
                {' · '}
                <span className="text-black/40">{pdfResult.total} total</span>
              </p>
              {pdfResult.failedEmails && pdfResult.failedEmails.length > 0 && (
                <p className="mt-1 text-[10px] text-red-500">{pdfResult.failedEmails.slice(0, 3).join(', ')}</p>
              )}
            </div>
          )}
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-gray-50">
                <th className="p-3 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">#</th>
                <th className="p-3 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Name</th>
                <th className="p-3 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Email</th>
                <th className="p-3 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Phone</th>
                <th className="p-3 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Dept</th>
                <th className="p-3 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Source</th>
                <th className="p-3 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {registrations.map((r, i) => (
                <tr key={r._id} className="transition hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs text-black/40">{(page - 1) * 50 + i + 1}</td>
                  <td className="p-3 font-semibold text-black">{r.name}</td>
                  <td className="p-3 font-mono text-xs text-black/60">{r.email}</td>
                  <td className="p-3 text-xs text-black/50">{r.phone || '—'}</td>
                  <td className="p-3 text-xs text-black/50">{r.department || '—'}</td>
                  <td className="p-3">
                    <span className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-black/40">
                      {r.source}
                    </span>
                  </td>
                  <td className="p-3">
                    {deleteConfirm === r._id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteRegistration(r._id)}
                          className="rounded bg-red-600 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white transition hover:bg-red-700"
                        >Confirm</button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="font-mono text-[10px] text-black/40 hover:text-black"
                        >Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(r._id)}
                        className="rounded border border-red-200 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-red-500 transition hover:bg-red-50"
                      >Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {count > 50 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border border-black/10 px-3 py-1.5 font-mono text-xs font-bold text-black/40 transition hover:text-black disabled:opacity-30"
          >
            <ChevronLeft className="inline h-4 w-4" /> Prev
          </button>
          <span className="font-mono text-xs text-black/40">Page {page} of {Math.ceil(count / 50)}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(count / 50)}
            className="border border-black/10 px-3 py-1.5 font-mono text-xs font-bold text-black/40 transition hover:text-black disabled:opacity-30"
          >
            Next <ChevronRight className="inline h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Send Emails Tab ─────────────────────────────────────────────── */

function EventEmailSender({ eventId, event }: { eventId: string; event: GEvent }) {
  const [mode, setMode] = useState<'registered' | 'custom'>('registered');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [customEmailsRaw, setCustomEmailsRaw] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  // Parse and deduplicate emails from textarea
  const parsedEmails = customEmailsRaw
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@') && e.includes('.'));
  const uniqueEmails = [...new Set(parsedEmails)];

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required.');
      return;
    }
    if (mode === 'custom' && uniqueEmails.length === 0) {
      toast.error('Please enter at least one valid email address.');
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const payload: Record<string, any> = {
        subject: subject.trim(),
        message: message.trim(),
        type: 'event-email',
      };
      if (mode === 'custom') {
        payload.customEmails = uniqueEmails;
      }
      const res = await api.post(`/admin/events/${eventId}/send-emails`, payload);
      setResult(res.data);
      toast.success(`Emails sent: ${res.data.sent} successful, ${res.data.failed} failed`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      {/* Mode selector */}
      <div className="flex overflow-hidden rounded border border-black/10">
        <button
          onClick={() => setMode('registered')}
          className={cn(
            'flex-1 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition',
            mode === 'registered' ? 'bg-black text-white' : 'bg-white text-black/40 hover:text-black'
          )}
        >
          Registered Students
        </button>
        <button
          onClick={() => setMode('custom')}
          className={cn(
            'flex-1 border-l border-black/10 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition',
            mode === 'custom' ? 'bg-black text-white' : 'bg-white text-black/40 hover:text-black'
          )}
        >
          Custom Email List
        </button>
      </div>

      <div className="rounded border border-black/10 bg-white p-6">
        <h3 className="mb-2 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-black">
          <Send className="h-4 w-4" />
          {mode === 'registered' ? 'Send to Registered Students' : 'Send to Custom Email List'}
        </h3>

        {mode === 'registered' ? (
          <div className="mb-4 rounded border border-black/5 bg-gray-50 px-4 py-3 text-xs text-black/50">
            This sends to all students stored in <strong>Form Registrations</strong> for this event.
            If registrations were collected via Google Form externally (not through this system),
            use <button onClick={() => setMode('custom')} className="font-bold text-black underline">Custom Email List</button> instead.
          </div>
        ) : (
          <div className="mb-4 space-y-3">
            <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
              Paste student email addresses below — one per line, or separated by commas. Duplicates are automatically removed.
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-black/40">
                Email Addresses
              </label>
              <textarea
                rows={6}
                value={customEmailsRaw}
                onChange={(e) => setCustomEmailsRaw(e.target.value)}
                placeholder={`student1@gmail.com\nstudent2@gmail.com\nstudent3@example.com`}
                className="w-full resize-y border border-black/10 bg-white px-4 py-2.5 font-mono text-sm text-black placeholder:text-black/30 focus:border-black focus:outline-none"
              />
              {uniqueEmails.length > 0 && (
                <p className="mt-1 font-mono text-xs text-black/40">
                  {uniqueEmails.length} valid email{uniqueEmails.length !== 1 ? 's' : ''} detected
                </p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-black/40">
              Email Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Important Update for Web Dev Bootcamp"
              className="w-full border border-black/10 bg-white px-4 py-2.5 font-mono text-sm text-black placeholder:text-black/30 focus:border-black focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-black/40">
              Email Message
            </label>
            <textarea
              rows={7}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here. It will be sent as an HTML email."
              className="w-full resize-y border border-black/10 bg-white px-4 py-2.5 font-mono text-sm text-black placeholder:text-black/30 focus:border-black focus:outline-none"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim() || (mode === 'custom' && uniqueEmails.length === 0)}
            className="flex w-full items-center justify-center gap-2 border border-black bg-black px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-black disabled:opacity-40"
          >
            {sending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                {mode === 'custom'
                  ? `Send to ${uniqueEmails.length || '—'} Email${uniqueEmails.length !== 1 ? 's' : ''}`
                  : 'Send to All Registered Students'}
              </>
            )}
          </button>
        </div>

        {result && (
          <div className="mt-4 rounded border border-black/10 bg-gray-50 p-4">
            <p className="font-mono text-sm">
              <span className="font-bold text-green-700">{result.sent} sent</span>
              {' · '}
              <span className="font-bold text-red-600">{result.failed} failed</span>
              {' · '}
              <span className="text-black/40">{result.total} total</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


/* ─── Sending History Tab ─────────────────────────────────────────── */

function EventSendingHistory({ eventId }: { eventId: string }) {
  const [history, setHistory] = useState<SendingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SendingHistoryStats>({ sent: 0, failed: 0, pending: 0 });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/events/${eventId}/sending-history`, {
        params: { page: String(page), limit: '50' },
      });
      setHistory(res.data.history);
      setTotal(res.data.total);
      setStats(res.data.stats);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [eventId, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-4 rounded border border-black/10 bg-white p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="font-mono text-sm font-bold">{stats.sent}</span>
          <span className="font-mono text-xs text-black/40">sent</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="font-mono text-sm font-bold">{stats.failed}</span>
          <span className="font-mono text-xs text-black/40">failed</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-black/30" />
          <span className="font-mono text-sm font-bold">{stats.pending}</span>
          <span className="font-mono text-xs text-black/40">pending</span>
        </div>
        <div className="ml-auto">
          <span className="font-mono text-xs text-black/30">{total} total entries</span>
        </div>
      </div>

      {/* History table */}
      {loading ? (
        <PageLoader label="Loading history..." />
      ) : history.length === 0 ? (
        <div className="rounded border border-black/10 bg-white p-8 text-center font-mono text-sm text-black/40">
          No sending history yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-black/10 bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-gray-50">
                <th className="p-3 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Type</th>
                <th className="p-3 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Recipient</th>
                <th className="p-3 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Subject</th>
                <th className="p-3 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Status</th>
                <th className="p-3 font-mono text-[10px] font-bold uppercase tracking-wider text-black/40">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {history.map((h) => (
                <tr key={h._id} className="transition hover:bg-gray-50">
                  <td className="p-3">
                    <span className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-black/40">
                      {h.eventType}
                    </span>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-black">{h.recipientName}</p>
                    <p className="font-mono text-[10px] text-black/40">{h.recipientEmail}</p>
                  </td>
                  <td className="max-w-[200px] truncate p-3 text-xs text-black/60">{h.subject}</td>
                  <td className="p-3">
                    <span className={cn(
                      'rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase',
                      h.status === 'sent' ? 'bg-green-100 text-green-700' :
                      h.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-black/40'
                    )}>
                      {h.status}
                    </span>
                    {h.errorMessage && (
                      <p className="mt-1 max-w-[200px] truncate text-[10px] text-red-500">{h.errorMessage}</p>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs text-black/40">
                    {h.sentAt ? new Date(h.sentAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border border-black/10 px-3 py-1.5 font-mono text-xs font-bold text-black/40 transition hover:text-black disabled:opacity-30"
          >
            <ChevronLeft className="inline h-4 w-4" /> Prev
          </button>
          <span className="font-mono text-xs text-black/40">Page {page} of {Math.ceil(total / 50)}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 50)}
            className="border border-black/10 px-3 py-1.5 font-mono text-xs font-bold text-black/40 transition hover:text-black disabled:opacity-30"
          >
            Next <ChevronRight className="inline h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
