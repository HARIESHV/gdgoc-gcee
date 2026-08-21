export function formatDotDate(dateStr?: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.slice(0, 10).split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}.${m}.${y}`;
}

export function formatHumanDate(dateStr?: string): string {
  if (!dateStr) return '';
  const iso = dateStr.slice(0, 10);
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatHumanDateTime(dateStr?: string, time?: string): string {
  const label = formatHumanDate(dateStr);
  if (!time) return label;
  return `${label} · ${time}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function downloadBlob(data: Blob, filename: string) {
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadPdf(certificateId: string) {
  const base = import.meta.env.VITE_API_URL || '/api';
  window.open(`${base}/certificates/${certificateId}/download`, '_blank');
}

export const EVENT_CATEGORIES = [
  'Workshop',
  'Hackathon',
  'Technical Talk',
  'Seminar',
  'Coding Session',
  'Hands-on Session',
  'Project Showcase',
  'Community Meetup',
  'Other',
];

export const GALLERY_CATEGORIES = ['All', 'Workshops', 'Hackathons', 'Meetups', 'Team'];

export const RESOURCE_CATEGORIES = [
  'Web Development',
  'AI/ML',
  'Cloud',
  'Git & GitHub',
  'Android',
  'Cybersecurity',
  'Open Source',
  'Programming',
];

export const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Instrumentation and Control Engineering',
  'Other',
];

export const TEAMS = [
  'Core Team',
  'Student Coordinators',
  'Technical Team',
  'Design Team',
  'Event Team',
  'Community Members',
];

export const YEARS = ['I', 'II', 'III', 'IV'];
