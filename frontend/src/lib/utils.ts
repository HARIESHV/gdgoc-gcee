export function todayIST(): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
  } catch {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }
}

export function normalizeDateToISO(dateStr?: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  const ymd = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymd) {
    const y = ymd[1];
    const m = ymd[2].padStart(2, '0');
    const d = ymd[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const dmy = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmy) {
    const d = dmy[1].padStart(2, '0');
    const m = dmy[2].padStart(2, '0');
    const y = dmy[3];
    return `${y}-${m}-${d}`;
  }

  try {
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(d);
      const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
      const year = get('year');
      const month = get('month');
      const day = get('day');
      if (year && month && day) {
        return `${year}-${month}-${day}`;
      }
    }
  } catch {
    // ignore
  }

  return '';
}

export function isEventRegistrationOpen(event?: {
  date?: string;
  registrationDeadline?: string;
  registrationEnabled?: boolean;
  isRegistrationOpen?: boolean;
  status?: string;
  effectiveStatus?: string;
}): boolean {
  if (!event) return false;
  if (event.isRegistrationOpen !== undefined) return Boolean(event.isRegistrationOpen);
  if (event.registrationEnabled === false) return false;
  const status = event.effectiveStatus || event.status;
  if (status === 'COMPLETED' || status === 'CANCELLED') return false;

  const eventDateISO = normalizeDateToISO(event.date);
  if (!eventDateISO) return false;

  const today = todayIST();
  if (today >= eventDateISO) {
    return false;
  }

  if (event.registrationDeadline) {
    const deadlineISO = normalizeDateToISO(event.registrationDeadline);
    if (deadlineISO && today >= deadlineISO) {
      return false;
    }
  }

  return true;
}

export function formatDotDate(dateStr?: string): string {
  if (!dateStr) return '';
  const iso = normalizeDateToISO(dateStr);
  if (iso) {
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }
  return dateStr;
}

export function formatHumanDate(dateStr?: string): string {
  if (!dateStr) return '';
  const iso = normalizeDateToISO(dateStr);
  if (!iso) return dateStr;
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' });
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
