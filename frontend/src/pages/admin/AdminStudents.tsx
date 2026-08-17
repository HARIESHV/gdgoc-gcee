import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users, Search, UserX, UserCheck, Trash2, Zap, Download } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { api, getErrorMessage } from '../../lib/api';
import { cn, downloadBlob } from '../../lib/utils';

interface Row {
  id: string;
  name: string;
  email: string;
  phone?: string;
  rollNumber?: string;
  department?: string;
  year?: string;
  isActive: boolean;
  eventsAttended: number;
  eventsRegistered: number;
  points: number;
}

export default function AdminStudents() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/students', { params: { q: query || undefined } });
      setRows(res.data.students);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [query]);

  const toggleStatus = async (id: string, name: string, isActive: boolean) => {
    try {
      const res = await api.patch(`/admin/students/${id}/status`);
      toast.success(res.data.message);
      setRows((r) => r.map((x) => (x.id === id ? { ...x, isActive: !isActive } : x)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const setPoints = async (id: string, points: number) => {
    try {
      const res = await api.patch(`/admin/students/${id}/points`, { points });
      toast.success(res.data.message);
      setRows((r) => r.map((x) => (x.id === id ? { ...x, points } : x)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Delete student "${name}"? Attendance and registration history will also be removed.`)) return;
    try {
      const res = await api.delete(`/admin/students/${id}`);
      toast.success(res.data.message);
      setRows((r) => r.filter((x) => x.id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const activeCount = rows.filter((r) => r.isActive).length;

  const exportStudents = async () => {
    try {
      const res = await api.get('/admin/students/export', { responseType: 'blob' });
      downloadBlob(res.data as Blob, `students-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Students exported successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        subtitle={`${rows.length} accounts · ${activeCount} active`}
        actions={
          rows.length > 0 ? (
            <button onClick={exportStudents} className="btn-outline">
              <Download className="h-4 w-4" /> Export Excel
            </button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-2 rounded-xl border border-navy-200 bg-white px-3">
        <Search className="h-4 w-4 shrink-0 text-ink-faint" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email or roll number…" className="w-full bg-transparent py-2.5 text-sm focus:outline-none" />
      </div>

      {loading ? (
        <PageLoader label="Loading students…" />
      ) : rows.length === 0 ? (
        <EmptyState icon={<Users className="h-7 w-7" />} title="No students found" description="Students who register on the platform will appear here." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-ink-faint">
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Department</th>
                <th className="p-4 font-medium">Registered</th>
                <th className="p-4 font-medium">Attended</th>
                <th className="p-4 font-medium">Points</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {rows.map((s) => (
                <tr key={s.id} className={cn('transition hover:bg-navy-50/50', !s.isActive && 'opacity-60')}>
                  <td className="p-4">
                    <p className="font-semibold text-navy-900">{s.name}</p>
                    <p className="text-xs text-ink-muted">{s.email} · {s.rollNumber || '—'}</p>
                  </td>
                  <td className="p-4 text-ink-soft">{s.department || '—'}</td>
                  <td className="p-4 text-ink-soft">{s.eventsRegistered}</td>
                  <td className="p-4 text-ink-soft">{s.eventsAttended}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-g-yellow" />
                      <input
                        type="number"
                        value={s.points}
                        onBlur={(e) => setPoints(s.id, Number(e.target.value) || 0)}
                        onChange={(e) => setRows((r) => r.map((x) => (x.id === s.id ? { ...x, points: Number(e.target.value) } : x)))}
                        className="w-20 rounded-lg border border-navy-200 px-2 py-1 text-sm focus:border-g-blue focus:outline-none"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn('chip', s.isActive ? 'bg-g-green/10 text-green-700' : 'bg-slate-100 text-slate-500')}>
                      {s.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => toggleStatus(s.id, s.name, s.isActive)}
                        className="rounded-lg p-2 text-ink-soft transition hover:bg-g-yellow/15 hover:text-yellow-700"
                        title={s.isActive ? 'Disable account' : 'Enable account'}
                      >
                        {s.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button onClick={() => remove(s.id, s.name)} className="rounded-lg p-2 text-ink-soft transition hover:bg-g-red/10 hover:text-g-red" title="Delete">
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
