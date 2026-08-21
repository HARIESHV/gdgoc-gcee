import { useState } from 'react';
import { X, CheckCircle2, Loader2, User, Mail, Phone, Building2, GraduationCap, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../../lib/api';
import type { GEvent } from '../../types';

interface Props {
  event: GEvent;
  onClose: () => void;
}

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG - 1st Year', 'PG - 2nd Year', 'Other'];
const DEPARTMENTS = ['CSE', 'IT', 'CSDS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML', 'Other'];

export function EventRegistrationForm({ event, onClose }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    college: 'Government College of Engineering, Erode',
    department: '',
    year: '',
    rollNumber: '',
  });
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{ registrationId: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Full name is required.';
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.email.trim())) e.email = 'A valid email address is required.';
    if (!form.phone.trim() || form.phone.trim().length < 7) e.phone = 'Phone number is required.';
    if (!form.department) e.department = 'Department is required.';
    if (!form.year) e.year = 'Year of study is required.';
    return e;
  }

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setBusy(true);
    try {
      const res = await api.post(`/events/${event.eventId}/register-public`, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        college: form.college.trim() || 'Government College of Engineering, Erode',
        department: form.department,
        year: form.year,
        rollNumber: form.rollNumber.trim(),
      });
      setSuccess({ registrationId: res.data.registrationId });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-t-2xl border border-black/10 bg-white shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-black/30">Registration</p>
            <h2 className="mt-0.5 font-mono text-sm font-bold text-black line-clamp-1">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/40 transition hover:bg-black hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-mono text-lg font-bold text-black">Registration Successful!</h3>
              <p className="mt-2 text-sm text-black/50">
                A confirmation email has been sent to <strong>{form.email}</strong>.
              </p>
            </div>
            <div className="w-full rounded border border-black/10 bg-gray-50 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-black/30">Registration ID</p>
              <p className="mt-1 font-mono text-base font-bold text-black">{success.registrationId}</p>
            </div>
            <p className="text-xs text-black/40">Please keep your Registration ID handy for check-in.</p>
            <button
              onClick={onClose}
              className="w-full border border-black bg-black py-3 font-mono text-sm font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-black"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
            <div className="space-y-4 p-6">
              {/* Name */}
              <Field label="Full Name" error={errors.name} required>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Your full name"
                    className="w-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-black placeholder:text-black/30 focus:border-black focus:outline-none"
                  />
                </div>
              </Field>

              {/* Email */}
              <Field label="Student Email Address" error={errors.email} required>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="your@email.com"
                    className="w-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-black placeholder:text-black/30 focus:border-black focus:outline-none"
                  />
                </div>
              </Field>

              {/* Phone */}
              <Field label="Phone Number" error={errors.phone} required>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-black placeholder:text-black/30 focus:border-black focus:outline-none"
                  />
                </div>
              </Field>

              {/* College */}
              <Field label="College / Institution">
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
                  <input
                    type="text"
                    value={form.college}
                    onChange={(e) => handleChange('college', e.target.value)}
                    placeholder="Your college name"
                    className="w-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-black placeholder:text-black/30 focus:border-black focus:outline-none"
                  />
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                {/* Department */}
                <Field label="Department" error={errors.department} required>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
                    <select
                      value={form.department}
                      onChange={(e) => handleChange('department', e.target.value)}
                      className="w-full appearance-none border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-black focus:border-black focus:outline-none"
                    >
                      <option value="">Select</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </Field>

                {/* Year */}
                <Field label="Year of Study" error={errors.year} required>
                  <select
                    value={form.year}
                    onChange={(e) => handleChange('year', e.target.value)}
                    className="w-full appearance-none border border-black/10 bg-white px-3 py-2.5 text-sm text-black focus:border-black focus:outline-none"
                  >
                    <option value="">Select</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Roll Number */}
              <Field label="Student ID / Roll Number">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
                  <input
                    type="text"
                    value={form.rollNumber}
                    onChange={(e) => handleChange('rollNumber', e.target.value)}
                    placeholder="Optional"
                    className="w-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-black placeholder:text-black/30 focus:border-black focus:outline-none"
                  />
                </div>
              </Field>

              {/* Auto-filled info note */}
              <div className="rounded border border-black/5 bg-gray-50 px-4 py-3 text-xs text-black/40">
                Event: <span className="font-semibold text-black/60">{event.title}</span> · Date: <span className="font-semibold text-black/60">{event.date}</span>
                {event.venue && (<> · Venue: <span className="font-semibold text-black/60">{event.venue}</span></>)}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-black/10 px-6 py-4">
              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 border border-black bg-black py-3 font-mono text-sm font-bold uppercase tracking-wider text-white transition hover:bg-white hover:text-black disabled:opacity-50"
              >
                {busy ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Registering...</>
                ) : (
                  'Register Now'
                )}
              </button>
              <p className="mt-2 text-center text-[10px] text-black/30">
                A confirmation email will be sent to your email address.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, error, required }: { label: string; children: React.ReactNode; error?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-black/40">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
