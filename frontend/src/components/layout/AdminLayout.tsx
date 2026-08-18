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
  CheckCircle,
  Link2,
  Mail,
} from 'lucide-react';
import { DashboardShell } from './DashboardShell';
import { useAuth } from '../../context/AuthContext';

export function AdminLayout() {
  const { admin, logoutAdmin } = useAuth();

  const navItems = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, end: true },
    { label: 'Events', to: '/admin/events', icon: CalendarDays },
    { label: 'Event Registration', to: '/admin/registrations', icon: ClipboardList },
    { label: 'Event Attended', to: '/admin/attended', icon: CheckCircle },
    { label: 'Attendance', to: '/admin/events', icon: ClipboardCheckIcon },
    { label: 'Google Forms', to: '/admin/google-forms', icon: Link2 },
    { label: 'Students', to: '/admin/students', icon: Users },
    { label: 'Members', to: '/admin/members', icon: UsersRound },
    { label: 'Certificate Campaigns', to: '/admin/certificate-campaigns', icon: Megaphone },
    { label: 'Certificates', to: '/admin/certificates', icon: Award },
    { label: 'Contact Messages', to: '/admin/contact-messages', icon: Mail },
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

function ClipboardCheckIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="18"
      height="18"
      {...props}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}
