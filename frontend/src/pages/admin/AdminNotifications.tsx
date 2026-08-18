import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell, BellRing } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { api, getErrorMessage } from '../../lib/api';
import { formatHumanDateTime, cn } from '../../lib/utils';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/notifications?limit=50');
      setNotifications(res.data.notifications);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (n: any) => {
    if (n.isRead) return;
    try {
      await api.patch(`/admin/notifications/${n._id}/read`);
      setNotifications((prev) => prev.map((x) => x._id === n._id ? { ...x, isRead: true } : x));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleClick = async (n: any) => {
    await markRead(n);
    if (n.type === 'google_form_registration' && n.meta?.registrationId) {
      navigate('/admin/form-registrations');
    }
  };

  const markAllRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.isRead);
      await Promise.all(unread.map((n) => api.patch(`/admin/notifications/${n._id}/read`)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Admin alerts and updates"
        actions={
          notifications.some((n) => !n.isRead) ? (
            <button onClick={markAllRead} className="btn-outline">
              <Bell className="h-4 w-4" /> Mark all read
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <PageLoader label="Loading notifications…" />
      ) : notifications.length === 0 ? (
        <EmptyState label="No notifications yet." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className={cn(
                'card w-full p-4 text-left transition hover:shadow-lift flex items-start gap-4',
                !n.isRead && 'border-l-4 border-l-g-blue bg-g-blue/5'
              )}
            >
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                n.type === 'google_form_registration' ? 'bg-g-blue/10 text-g-blue' : 'bg-navy-900/5 text-navy-800'
              )}>
                <BellRing className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy-900">{n.title}</p>
                <p className="mt-0.5 text-sm text-ink-muted line-clamp-2">{n.message}</p>
                <p className="mt-1 text-xs text-ink-faint">{formatHumanDateTime(n.createdAt)}</p>
              </div>
              {!n.isRead && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-g-blue" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
