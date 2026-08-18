import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UsersRound,
  Award,
  Megaphone,
  ImageIcon,
  BookOpen,
  Settings,
  ClipboardList,
  Bell,
} from 'lucide-react';
import { DashboardShell } from './DashboardShell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export function AdminLayout() {
  const { admin, logoutAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let interval: ReturnType<typeof setInterval>;

    async function fetchCount() {
      try {
        const res = await api.get('/admin/notifications?limit=1');
        if (mounted) setUnreadCount(res.data.unreadCount || 0);
      } catch { /* ignore */ }
    }

    fetchCount();
    interval = setInterval(fetchCount, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const navItems = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, end: true },
    { label: 'Events', to: '/admin/events', icon: CalendarDays },
    { label: 'Students', to: '/admin/students', icon: Users },
    { label: 'Form Registrations', to: '/admin/form-registrations', icon: ClipboardList, badge: unreadCount || undefined },
    { label: 'Notifications', to: '/admin/notifications', icon: Bell, badge: unreadCount || undefined },
    { label: 'Members', to: '/admin/members', icon: UsersRound },
    { label: 'Certificate Campaigns', to: '/admin/certificate-campaigns', icon: Megaphone },
    { label: 'Certificates', to: '/admin/certificates', icon: Award },
    { label: 'Gallery', to: '/admin/gallery', icon: ImageIcon },
    { label: 'Resources', to: '/admin/resources', icon: BookOpen },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ];

  return (
    <DashboardShell
      navItems={navItems}
      userLabel={admin?.name || 'Admin'}
      userSubLabel="Administrator"
      logout={logoutAdmin}
      basePath="/admin"
    />
  );
}
