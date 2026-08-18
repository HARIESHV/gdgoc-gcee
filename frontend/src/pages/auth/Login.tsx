import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogIn, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { ButtonSpinner } from '../../components/ui/Spinner';
import { useAuth, getErrorMessage } from '../../context/AuthContext';

export default function Login() {
  const { loginStudent } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password.');
      return;
    }
    setBusy(true);
    try {
      await loginStudent(email, password);
      toast.success('Welcome back!');
      navigate(redirect);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pt-24 pb-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-7 sm:p-9">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white">
              <LogIn className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold text-navy-900">Student Login</h1>
            <p className="mt-1 text-sm text-ink-muted">Access your dashboard, events and certificates.</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  className="input pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-navy-900" aria-label="Toggle password visibility">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
              {busy ? <ButtonSpinner /> : <LogIn className="h-4 w-4" />}
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-navy-100" />
            <span className="text-xs text-ink-faint">or</span>
            <span className="h-px flex-1 bg-navy-100" />
          </div>

          <div className="mt-6 space-y-3 text-center">
            <Link to="/register" className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90" style={{ backgroundColor: '#0D6EFD' }}>
              Join Community
            </Link>
            <p className="flex items-center justify-center gap-1 text-xs text-ink-faint">
              <GraduationCap className="h-3.5 w-3.5" />
              Open to all GCEE students
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
