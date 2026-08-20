import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { api, getErrorMessage } from '../../lib/api';

interface EmailLog {
  _id: string;
  eventId?: string;
  eventTitle?: string;
  sender: string;
  recipientsCount: number;
  subject: string;
  message?: string;
  sentCount: number;
  failedCount: number;
  status: 'Success' | 'Partial' | 'Failure';
  failedEmails?: string[];
  createdAt: string;
}

export default function AdminEmailHistory() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/email-history');
      setLogs(res.data.logs || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email History & Logs"
        subtitle="Track sent event announcements, welcome emails, and recipient delivery outcomes."
      />

      {loading ? (
        <PageLoader label="Loading email logs..." />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-7 w-7" />}
          title="No email logs found"
          description="Sent event announcements and notifications will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 bg-gray-50/80 font-mono text-[11px] font-bold uppercase tracking-wider text-black/50">
                <th className="p-4">Subject & Event</th>
                <th className="p-4">Recipients</th>
                <th className="p-4">Sent</th>
                <th className="p-4">Failed</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date / Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {logs.map((log) => (
                <tr key={log._id} className="transition hover:bg-gray-50/50">
                  <td className="p-4">
                    <p className="font-semibold text-black">{log.subject}</p>
                    {log.eventTitle && (
                      <p className="mt-0.5 font-mono text-xs text-g-blue">Event: {log.eventTitle}</p>
                    )}
                  </td>
                  <td className="p-4 font-mono font-semibold text-black/70">{log.recipientsCount}</td>
                  <td className="p-4 font-mono font-bold text-emerald-600">{log.sentCount}</td>
                  <td className="p-4 font-mono font-bold text-red-600">{log.failedCount}</td>
                  <td className="p-4">
                    {log.status === 'Success' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-1 font-mono text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Success
                      </span>
                    ) : log.status === 'Partial' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2.5 py-1 font-mono text-xs font-bold text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> Partial ({log.failedCount} failed)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2.5 py-1 font-mono text-xs font-bold text-red-700">
                        <XCircle className="h-3.5 w-3.5" /> Failure
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-mono text-xs text-black/50">
                    {new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
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
