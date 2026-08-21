import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Award, ShieldX, ShieldCheck, Download, Link2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { api, getErrorMessage, downloadPdf } from '../../lib/api';
import { cn, formatDotDate } from '../../lib/utils';

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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/certificates', { params: filter !== 'ALL' ? { status: filter } : {} });
      setRows(res.data.certificates);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

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

  const valid = rows.filter((r) => r.status === 'VALID').length;

  return (
    <div className="space-y-6">
      <PageHeader title="Certificates" subtitle={`${rows.length} shown · ${valid} valid`} />

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
          title="No certificates yet"
          description="Generate certificates from a certificate campaign."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-ink-faint">
                <th className="p-4 font-medium">Certificate</th>
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Campaign</th>
                <th className="p-4 font-medium">Event</th>
                <th className="p-4 font-medium">Issued</th>
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
                  <td className="p-4 text-ink-soft">{c.campaignName || '—'}</td>
                  <td className="p-4">
                    {c.eventName ? (
                      <div>
                        <p className="font-medium text-navy-900">{c.eventName}</p>
                        {c.eventDateLabel && <p className="text-xs text-ink-muted">{c.eventDateLabel}</p>}
                      </div>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
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
