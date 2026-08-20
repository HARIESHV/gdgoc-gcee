import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UsersRound,
  Award,
  Settings,
  ClipboardList,
  MessageSquare,
  UserCog,
} from 'lucide-react';
import { DashboardShell } from './DashboardShell';
import { useAuth } from '../../context/AuthContext';

export function AdminLayout() {
  const { admin, logoutAdmin } = useAuth();

  const navItems = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, end: true },
    { label: 'Members', to: '/admin/members', icon: UsersRound },
    { label: 'Events', to: '/admin/events', icon: CalendarDays },
    { label: 'Event Registrations', to: '/admin/form-registrations', icon: ClipboardList },
    { label: 'Certificates', to: '/admin/certificates', icon: Award },
    { label: 'Team Members', to: '/admin/students', icon: UserCog },
    { label: 'Messages', to: '/admin/messages', icon: MessageSquare },
    { label: 'Settings', to: '/admin/settings', icon: Settings },
  ];

  return (
    <DashboardShell
      navItems={navItems}
      userLabel={admin?.name || 'Admin'}
      userSubLabel="GDGoC GCEE Admin"
      logout={logoutAdmin}
      basePath="/admin"
    />
  );
}
