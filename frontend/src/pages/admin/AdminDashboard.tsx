import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Award,
  BadgeCheck,
  Clock4,
  UsersRound,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { PageHeader, StatCard } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { api, getErrorMessage } from '../../lib/api';
import { formatDotDate } from '../../lib/utils';
import type { AdminStats } from '../../types';

const COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#1b3a66', '#3b6fc4'];

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .get('/admin/dashboard')
      .then((res) => mounted && setData(res.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <PageLoader label="Loading dashboard…" />;
  if (!data) return <div className="text-ink-muted">Unable to load dashboard data.</div>;

  const s: AdminStats = data.stats;
  const charts = data.charts;

  const registrationData = (charts.registrationTrends || []).map((r: any) => ({ name: r._id, Registrations: r.count }));
  const attendanceData = (charts.attendanceTrends || []).map((r: any) => ({ name: r._id, Attendance: r.count }));
  const categoryData = (charts.participationByCategory || []).map((r: any) => ({ name: r._id || 'Other', count: r.count }));
  const eventAttendance = (charts.attendanceByEvent || []).map((r: any) => ({ name: String(r._id || 'Other').slice(0, 22), Present: r.count }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of the GDGoC GCEE community platform."
        actions={
          <Link to="/admin/events/create" className="btn-primary">
            <Plus className="h-4 w-4" /> New event
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total Students" value={s.totalStudents} icon={<Users className="h-5 w-5" />} color="bg-g-blue/10 text-g-blue" />
        <StatCard label="Total Events" value={s.totalEvents} icon={<CalendarDays className="h-5 w-5" />} color="bg-navy-900/5 text-navy-800" />
        <StatCard label="Upcoming Events" value={s.upcomingEvents} icon={<CalendarClock className="h-5 w-5" />} color="bg-g-yellow/15 text-yellow-700" />
        <StatCard label="Completed Events" value={s.completedEvents} icon={<CheckCircle2 className="h-5 w-5" />} color="bg-g-green/10 text-green-700" />
        <StatCard label="Attendance Records" value={s.attendanceRecords} icon={<ClipboardCheck className="h-5 w-5" />} color="bg-g-red/10 text-g-red" />
        <StatCard label="Certificates Generated" value={s.certificates} icon={<Award className="h-5 w-5" />} color="bg-g-blue/10 text-g-blue" />
        <StatCard label="Certificates Valid" value={s.validCertificates} icon={<BadgeCheck className="h-5 w-5" />} color="bg-g-green/10 text-green-700" />
        <StatCard label="Community Members" value={s.members} icon={<UsersRound className="h-5 w-5" />} color="bg-g-yellow/15 text-yellow-700" />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-navy-900">
            <TrendingUp className="h-4 w-4 text-g-blue" /> Registration trends
          </h3>
          {registrationData.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">No registration data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={registrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="Registrations" stroke="#4285F4" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-navy-900">
            <ClipboardCheck className="h-4 w-4 text-g-green" /> Attendance trends
          </h3>
          {attendanceData.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">No attendance data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="Attendance" stroke="#34A853" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-4 font-display text-base font-bold text-navy-900">Participation by category</h3>
          {categoryData.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">No category data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1b3a66" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="mb-4 font-display text-base font-bold text-navy-900">Attendance by event</h3>
          {eventAttendance.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">No event attendance data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={eventAttendance} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
                <Tooltip />
                <Bar dataKey="Present" fill="#FBBC05" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Certificate pie */}
      <div className="card p-6">
        <h3 className="mb-4 font-display text-base font-bold text-navy-900">Certificate statistics</h3>
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={charts.certByStatus || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label>
                {(charts.certByStatus || []).map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 text-sm">
            <p className="text-ink-muted">Total certificates: <strong className="text-navy-900">{s.certificates}</strong></p>
            <p className="text-ink-muted">Valid: <strong className="text-green-700">{s.validCertificates}</strong></p>
            <p className="text-ink-muted">Pending / Revoked: <strong className="text-ink-soft">{s.pendingCertificates}</strong></p>
            <Link to="/admin/certificate-campaigns" className="inline-flex items-center gap-1 text-sm font-semibold text-g-blue hover:underline">
              Manage campaigns <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent campaigns */}
      {data.campaigns?.length > 0 && (
        <div className="card overflow-x-auto">
          <div className="border-b border-navy-50 p-5">
            <h3 className="font-display text-base font-bold text-navy-900">Certificate campaigns</h3>
          </div>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-xs uppercase tracking-wide text-ink-faint">
                <th className="p-4 font-medium">Campaign</th>
                <th className="p-4 font-medium">Period</th>
                <th className="p-4 font-medium">Min attendance</th>
                <th className="p-4 font-medium">Min events</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {data.campaigns.map((c: any) => (
                <tr key={c._id} className="transition hover:bg-navy-50/50">
                  <td className="p-4 font-semibold text-navy-900">{c.name}</td>
                  <td className="p-4 text-ink-soft">{formatDotDate(c.startDate)} → {formatDotDate(c.endDate)}</td>
                  <td className="p-4 text-ink-soft">{c.minimumAttendancePercentage}%</td>
                  <td className="p-4 text-ink-soft">{c.minimumEligibleEvents}</td>
                  <td className="p-4">
                    <span className={`chip ${c.status === 'ACTIVE' ? 'bg-g-green/10 text-green-700' : c.status === 'CLOSED' ? 'bg-navy-900/5 text-navy-800' : 'bg-g-yellow/15 text-yellow-700'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link to={`/admin/certificate-campaigns/${c._id}`} className="text-sm font-semibold text-g-blue hover:underline">
                      View
                    </Link>
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
