import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, QrCode, Check, X, AlertTriangle, User2, Download } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { api, getErrorMessage } from '../../lib/api';
import { cn, formatHumanDate, downloadBlob } from '../../lib/utils';

interface AttendanceStudent {
  studentId: string;
  name: string;
  email: string;
  rollNumber: string;
  department: string;
  year: string;
  status: 'PRESENT' | 'ABSENT' | null;
  method: string | null;
}

export default function AdminAttendance() {
  const { eventId } = useParams();
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/events/${eventId}/attendance`);
      setStudents(res.data.students);
      setMeta(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const markAll = async (status: 'PRESENT' | 'ABSENT') => {
    const pending = students.filter((s) => s.status !== status);
    if (pending.length === 0) {
      toast('No changes needed.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.post(`/admin/events/${eventId}/attendance`, {
        entries: pending.map((s) => ({ studentId: s.studentId, status })),
      });
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const markOne = async (studentId: string, status: 'PRESENT' | 'ABSENT') => {
    setBusy(true);
    try {
      const res = await api.post(`/admin/events/${eventId}/attendance`, {
        entries: [{ studentId, status }],
      });
      toast.success(res.data.message);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const openQr = async () => {
    setQrOpen(true);
    setQrLoading(true);
    try {
      const res = await api.get(`/admin/events/${eventId}/attendance/qr-token`);
      setQrData(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setQrOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  const exportRegistrations = async () => {
    try {
      const res = await api.get(`/admin/events/${eventId}/export`, { responseType: 'blob' });
      downloadBlob(res.data as Blob, `registrations-${eventId}.xlsx`);
      toast.success('Registrations exported successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const presentCount = students.filter((s) => s.status === 'PRESENT').length;

  if (loading) return <PageLoader label="Loading attendance…" />;
  if (!meta) return <EmptyState title="Event not found" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Attendance — ${meta.event?.title || ''}`}
        subtitle={
          meta.event
            ? `${formatHumanDate(meta.event.date)} · ${meta.event.isInauguration ? 'Inauguration (excluded from certificates)' : 'Certificate-eligible event'}`
            : ''
        }
        actions={
          <>
            <Link to={`/admin/events/${eventId}`} className="btn-outline">
              <ArrowLeft className="h-4 w-4" /> Edit event
            </Link>
            {students.length > 0 && (
              <button onClick={exportRegistrations} className="btn-outline">
                <Download className="h-4 w-4" /> Export Excel
              </button>
            )}
            <button onClick={openQr} className="btn-dark" disabled={!meta.attendanceOpen}>
              <QrCode className="h-4 w-4" /> QR attendance
            </button>
          </>
        }
      />

      {/* Date validation status */}
      {!meta.attendanceOpen ? (
        <div className="flex items-start gap-3 rounded-xl border border-g-yellow/40 bg-g-yellow/10 p-4 text-sm text-yellow-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Attendance is not available right now</p>
            <p className="mt-0.5">{meta.attendanceError || 'Attendance can only be marked on the actual event date (Asia/Kolkata).'}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-g-green/30 bg-g-green/10 p-4 text-sm text-green-800">
          <Check className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Attendance window is open</p>
            <p className="mt-0.5">Today is the event date. You may mark present/absent or use the QR scanner.</p>
          </div>
        </div>
      )}

      {/* Summary + bulk actions */}
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-6 text-sm">
          <p className="text-ink-muted">Registered: <strong className="text-navy-900">{students.length}</strong></p>
          <p className="text-ink-muted">Present: <strong className="text-green-700">{presentCount}</strong></p>
          <p className="text-ink-muted">Absent: <strong className="text-ink-soft">{students.length - presentCount}</strong></p>
        </div>
        {meta.attendanceOpen && students.length > 0 && (
          <div className="flex gap-2">
            <button onClick={() => markAll('PRESENT')} disabled={busy} className="btn-green !py-2">
              <Check className="h-4 w-4" /> Mark all present
            </button>
            <button onClick={() => markAll('ABSENT')} disabled={busy} className="btn-danger !py-2">
              <X className="h-4 w-4" /> Mark all absent
            </button>
          </div>
        )}
      </div>

      {/* Student list */}
      {students.length === 0 ? (
        <EmptyState
          icon={<User2 className="h-7 w-7" />}
          title="No registered students"
          description="Students must register for this event before attendance can be marked."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-ink-faint">
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Department</th>
                <th className="p-4 font-medium">Year</th>
                <th className="p-4 font-medium">Status</th>
                {meta.attendanceOpen && <th className="p-4 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {students.map((s) => (
                <tr key={s.studentId} className="transition hover:bg-navy-50/50">
                  <td className="p-4">
                    <p className="font-semibold text-navy-900">{s.name}</p>
                    <p className="font-mono text-[11px] text-ink-faint">{s.rollNumber || s.email}</p>
                  </td>
                  <td className="p-4 text-ink-soft">{s.department || '—'}</td>
                  <td className="p-4 text-ink-soft">{s.year || '—'}</td>
                  <td className="p-4">
                    {s.status ? (
                      <span className={cn('chip', s.status === 'PRESENT' ? 'bg-g-green/10 text-green-700' : 'bg-g-red/10 text-g-red')}>
                        {s.status}
                      </span>
                    ) : (
                      <span className="chip bg-slate-100 text-slate-500">Not marked</span>
                    )}
                  </td>
                  {meta.attendanceOpen && (
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => markOne(s.studentId, 'PRESENT')}
                          disabled={busy || s.status === 'PRESENT'}
                          className={cn('btn !px-3 !py-1.5 text-xs', s.status === 'PRESENT' ? 'bg-g-green/10 text-green-700' : 'btn-green')}
                        >
                          <Check className="h-3.5 w-3.5" /> Present
                        </button>
                        <button
                          onClick={() => markOne(s.studentId, 'ABSENT')}
                          disabled={busy || s.status === 'ABSENT'}
                          className={cn('btn !px-3 !py-1.5 text-xs', s.status === 'ABSENT' ? 'bg-g-red/10 text-g-red' : 'btn-danger')}
                        >
                          <X className="h-3.5 w-3.5" /> Absent
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QR modal */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="QR Attendance Code">
        {qrLoading ? (
          <PageLoader label="Generating QR code…" />
        ) : qrData ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-2xl border border-navy-100 bg-white p-4">
              <img src={qrData.qr} alt="Attendance QR" className="h-56 w-56" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">{qrData.event?.title}</p>
              <p className="mt-1 text-xs text-ink-muted">
                Students scan this code to mark themselves present. It expires in 15 minutes.
              </p>
            </div>
            <p className="flex items-center gap-2 rounded-lg bg-g-green/10 px-4 py-2 text-xs font-medium text-green-700">
              <Check className="h-4 w-4" /> Only valid today ({formatHumanDate(qrData.event?.date)})
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
