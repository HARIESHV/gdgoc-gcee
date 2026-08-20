import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Award, ShieldX, ShieldCheck, Download, Link2, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { ButtonSpinner } from '../../components/ui/Spinner';
import { api, getErrorMessage, downloadPdf } from '../../lib/api';
import { cn, formatDotDate } from '../../lib/utils';
import type { GEvent } from '../../types';

interface Row {
  certificateId: string;
  studentName: string;
  studentEmail: string;
  campaignName: string;
  eventName?: string;
  eventDate?: string;
  eventDateLabel?: string;
  issueDate: string;
  status: string;
}

export default function AdminCertificates() {
  const [rows, setRows] = useState<Row[]>([]);
  const [events, setEvents] = useState<GEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    eventId: '',
    eventName: '',
    eventDate: '',
    recipientGroup: 'registered',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [certRes, evRes] = await Promise.all([
        api.get('/admin/certificates', { params: filter !== 'ALL' ? { status: filter } : {} }),
        api.get('/admin/events'),
      ]);
      setRows(certRes.data.certificates);
      setEvents(evRes.data.events || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const handleSelectEvent = (evId: string) => {
    const ev = events.find((e) => e._id === evId || e.eventId === evId);
    if (ev) {
      setForm((f) => ({
        ...f,
        eventId: ev._id,
        eventName: ev.title,
        eventDate: ev.date,
      }));
    } else {
      setForm((f) => ({ ...f, eventId: '', eventName: '', eventDate: '' }));
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.eventName || !form.eventDate) {
      toast.error('Event Name and Event Date are required.');
      return;
    }

    setBusy(true);
    try {
      const res = await api.post('/admin/certificates/generate', form);
      toast.success(res.data.message);
      setModal(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string, name: string) => {
    const reason = window.prompt(`Revoke certificate for ${name}? Enter a reason (optional):`) ?? '';
    if (reason === null) return;
    try {
      const res = await api.post(`/admin/certificates/${id}/revoke`, { reason });
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const restore = async (id: string) => {
    try {
      const res = await api.post(`/admin/certificates/${id}/restore`);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL certificates from the database? This action cannot be undone.')) return;
    try {
      const res = await api.delete('/admin/certificates/clear-all');
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!window.confirm(`Permanently delete certificate ${id}?`)) return;
    try {
      const res = await api.delete(`/admin/certificates/${id}`);
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const valid = rows.filter((r) => r.status === 'VALID').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates Dashboard"
        subtitle={`${rows.length} total issued · ${valid} valid`}
        actions={
          <div className="flex items-center gap-2">
            {rows.length > 0 && (
              <button onClick={handleClearAll} className="btn-outline text-g-red border-g-red/30 hover:bg-g-red/10">
                <Trash2 className="h-4 w-4" /> Clear All Data
              </button>
            )}
            <button onClick={() => setModal(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Generate Certificate
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {['ALL', 'VALID', 'REVOKED'].map((f) => (
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
        <PageLoader label="Loading certificates…" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Award className="h-7 w-7" />}
          title="No certificates issued yet"
          description="Click Generate Certificate to issue certificates for an event."
          action={
            <button onClick={() => setModal(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Generate Certificate
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-ink-faint">
                <th className="p-4 font-medium">Certificate ID</th>
                <th className="p-4 font-medium">Student Name</th>
                <th className="p-4 font-medium">Event Title</th>
                <th className="p-4 font-medium">Event Date</th>
                <th className="p-4 font-medium">Issued Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {rows.map((c) => (
                <tr key={c.certificateId} className={cn('transition hover:bg-navy-50/50', c.status === 'REVOKED' && 'opacity-70')}>
                  <td className="p-4 font-mono text-xs font-semibold text-navy-900">{c.certificateId}</td>
                  <td className="p-4">
                    <p className="font-semibold text-navy-900">{c.studentName}</p>
                    <p className="text-xs text-ink-muted">{c.studentEmail}</p>
                  </td>
                  <td className="p-4 font-semibold text-navy-900">{c.eventName || c.campaignName || '—'}</td>
                  <td className="p-4 text-ink-soft">{c.eventDateLabel || c.eventDate || '—'}</td>
                  <td className="p-4 text-ink-soft">{formatDotDate(c.issueDate)}</td>
                  <td className="p-4">
                    <span className={cn('chip', c.status === 'VALID' ? 'bg-g-green/10 text-green-700' : 'bg-g-red/10 text-g-red')}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <a
                        href={`/certificate/${c.certificateId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-2 text-ink-soft transition hover:bg-g-blue/10 hover:text-g-blue"
                        title="Verify page"
                      >
                        <Link2 className="h-4 w-4" />
                      </a>
                      {c.status === 'VALID' && (
                        <button onClick={() => downloadPdf(c.certificateId)} className="rounded-lg p-2 text-ink-soft transition hover:bg-g-green/10 hover:text-green-700" title="Download PDF">
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      {c.status === 'VALID' ? (
                        <button onClick={() => revoke(c.certificateId, c.studentName)} className="rounded-lg p-2 text-ink-soft transition hover:bg-g-red/10 hover:text-g-red" title="Revoke">
                          <ShieldX className="h-4 w-4" />
                        </button>
                      ) : (
                        <button onClick={() => restore(c.certificateId)} className="rounded-lg p-2 text-ink-soft transition hover:bg-g-green/10 hover:text-green-700" title="Restore to valid">
                          <ShieldCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => handleDeleteSingle(c.certificateId)} className="rounded-lg p-2 text-ink-soft transition hover:bg-g-red/10 hover:text-g-red" title="Permanently Delete">
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

      {/* Generate Certificate Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Generate & Issue Certificates">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="label">Select Event</label>
            <select
              className="input font-semibold"
              value={form.eventId}
              onChange={(e) => handleSelectEvent(e.target.value)}
            >
              <option value="">-- Custom Event --</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title} ({ev.date})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Event Title on Certificate <span className="text-g-red">*</span></label>
            <input
              className="input font-semibold"
              value={form.eventName}
              onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
              placeholder="e.g. AI Prompt Engineering Workshop"
            />
          </div>

          <div>
            <label className="label">Event Date on Certificate <span className="text-g-red">*</span></label>
            <input
              className="input font-mono"
              value={form.eventDate}
              onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
              placeholder="e.g. 18 August 2026"
            />
          </div>

          <div>
            <label className="label">Recipients Group</label>
            <select
              className="input"
              value={form.recipientGroup}
              onChange={(e) => setForm((f) => ({ ...f, recipientGroup: e.target.value }))}
            >
              <option value="registered">Registered Students for this Event (Default)</option>
              <option value="all">All Active Students</option>
            </select>
          </div>

          <div className="rounded-xl border border-navy-100 bg-navy-50/70 p-3 text-xs text-navy-800">
            <p className="font-bold">Official GDGoC GCEE Participation Certificate</p>
            <p className="mt-0.5 text-ink-muted">
              Certificates will be generated overlaying the Student Name, Event Title, Event Date, unique Certificate ID, and QR Code on the official certificate template.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? <ButtonSpinner /> : null}
              {busy ? 'Generating…' : 'Generate & Issue Certificates'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
