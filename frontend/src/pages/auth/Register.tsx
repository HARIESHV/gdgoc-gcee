import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { ButtonSpinner } from '../../components/ui/Spinner';
import { useAuth, getErrorMessage } from '../../context/AuthContext';
import { DEPARTMENTS, YEARS } from '../../lib/utils';

export default function Register() {
  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    rollNumber: '',
    department: '',
    year: '',
    password: '',
    confirmPassword: '',
  });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in the required fields.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const result = await registerStudent(form);
      if (result.emailSent) {
        toast.success('Registration successful! A confirmation email has been sent to your registered Gmail address.');
      } else {
        toast.success('Registration successful, but we could not send the confirmation email. Please check your email address or contact the admin team.', { duration: 6000 });
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 pt-24 pb-16">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-7 sm:p-9">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-g-green text-white">
              <UserPlus className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold text-navy-900">Join the Community</h1>
            <p className="mt-1 text-sm text-ink-muted">Create your student account to register for events.</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label" htmlFor="name">Full name <span className="text-g-red">*</span></label>
              <input id="name" className="input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your full name" autoComplete="name" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="email">Email <span className="text-g-red">*</span></label>
                <input id="email" type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" autoComplete="email" />
              </div>
              <div>
                <label className="label" htmlFor="phone">Phone</label>
                <input id="phone" type="tel" className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="rollNumber">Roll number</label>
                <input id="rollNumber" className="input" value={form.rollNumber} onChange={(e) => update('rollNumber', e.target.value)} placeholder="e.g. 21CSE001" />
              </div>
              <div>
                <label className="label" htmlFor="year">Year</label>
                <select id="year" className="input" value={form.year} onChange={(e) => update('year', e.target.value)}>
                  <option value="">Select year</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="department">Department</label>
              <select id="department" className="input" value={form.department} onChange={(e) => update('department', e.target.value)}>
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="password">Password <span className="text-g-red">*</span></label>
                <div className="relative">
                  <input
                    id="password"
                    type={show ? 'text' : 'password'}
                    className="input pr-11"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-navy-900" aria-label="Toggle password visibility">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="confirmPassword">Confirm password <span className="text-g-red">*</span></label>
                <input
                  id="confirmPassword"
                  type={show ? 'text' : 'password'}
                  className="input"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
              {busy ? <ButtonSpinner /> : <UserPlus className="h-4 w-4" />}
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-g-blue hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
