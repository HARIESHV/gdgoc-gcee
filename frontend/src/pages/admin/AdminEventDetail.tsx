import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Download,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EventForm } from '../../components/admin/EventForm';
import { api, getErrorMessage } from '../../lib/api';
import { cn, downloadBlob } from '../../lib/utils';
import type { GEvent } from '../../types';

type Tab = 'details' | 'registrations';

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
        {(['details', 'registrations'] as Tab[]).map((t) => (
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
