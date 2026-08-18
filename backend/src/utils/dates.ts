import { CLUB } from '../config/env';

const TZ = CLUB.timezone;

function toPadded(n: number): string {
  return String(n).padStart(2, '0');
}

/** Return the calendar date string (YYYY-MM-DD) in Asia/Kolkata. */
export function todayIST(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Current time HH:mm in Asia/Kolkata. */
export function nowISTTime(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('hour')}:${get('minute')}`;
}

export function isISTToday(dateStr: string): boolean {
  return normalizeDate(dateStr) === todayIST();
}

export function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}

/** Convert YYYY-MM-DD to DD.MM.YYYY */
export function formatDotDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = normalizeDate(dateStr).split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}.${m}.${y}`;
}

/** Convert YYYY-MM-DD to "18 August 2026" */
export function formatFullDate(dateStr: string): string {
  const iso = normalizeDate(dateStr);
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Convert YYYY-MM-DD to a human readable label e.g. "20 Aug 2026" */
export function formatHumanDate(dateStr: string): string {
  const iso = normalizeDate(dateStr);
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatHumanDateTime(dateStr: string, time = ''): string {
  const label = formatHumanDate(dateStr);
  if (!time) return label;
  return `${label} · ${time}`;
}

export function isDateBefore(a: string, b: string): boolean {
  return normalizeDate(a) < normalizeDate(b);
}

export function isDateAfter(a: string, b: string): boolean {
  return normalizeDate(a) > normalizeDate(b);
}
