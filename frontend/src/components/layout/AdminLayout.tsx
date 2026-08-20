import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UsersRound,
  Megaphone,
  ImageIcon,
  BookOpen,
  Settings,
  ClipboardList,
  Mail,
} from 'lucide-react';
import { DashboardShell } from './DashboardShell';
import { useAuth } from '../../context/AuthContext';

export function AdminLayout() {
  const { admin, logoutAdmin } = useAuth();

  const navItems = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, end: true },
    { label: 'Events', to: '/admin/events', icon: CalendarDays },
    { label: 'Students', to: '/admin/students', icon: Users },
    { label: 'Form Registrations', to: '/admin/form-registrations', icon: ClipboardList },
    { label: 'Members', to: '/admin/members', icon: UsersRound },
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
