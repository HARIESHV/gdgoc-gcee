import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, MapPin, Clock3, Send, ExternalLink } from 'lucide-react';
import { api, getErrorMessage } from '../../lib/api';

const MAPS_URL = 'https://www.google.com/maps/search/Government+College+of+Engineering+Erode+Vasavi+College+Post+Erode+638316+Tamil+Nadu+India';
const MAPS_EMBED = 'https://maps.google.com/maps?q=Government+College+of+Engineering+Erode+Vasavi+College+Post+Erode+638316+Tamil+Nadu+India&t=&z=15&ie=UTF8&iwloc=&output=embed';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill in all fields.');
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/contact', form);
      toast.success(res.data.message);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 pt-32 pb-16 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 left-1/3 h-64 w-64 rounded-full bg-g-green/20 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-g-blue/15 blur-3xl" />
        </div>
        <div className="container-x relative z-10">
          <span className="chip border border-white/15 bg-white/5 text-white/80">Contact</span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">Get in Touch</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            Questions about events, memberships or certificates? Reach out to the team.
          </p>
        </div>
        <div className="relative z-10 mt-10 flex h-1.5">
          <div className="flex-1 bg-g-blue" />
          <div className="flex-1 bg-g-green" />
          <div className="flex-1 bg-g-yellow" />
          <div className="flex-1 bg-g-red" />
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container-x grid gap-10 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-2">
            <div className="card flex items-start gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-navy-900">Email</p>
                <p className="mt-0.5 text-sm text-ink-soft">gdgocgcee@gmail.com</p>
                <p className="mt-0.5 text-xs text-ink-faint">For general inquiries</p>
              </div>
            </div>

            <div className="card overflow-hidden p-0">
              <div className="p-5 pb-3">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy-900">Location</p>
                    <p className="mt-0.5 text-sm text-ink-soft">Government College of Engineering, Erode</p>
                    <p className="mt-0.5 text-xs text-ink-faint">Vasavi College Post, Erode – 638316, Tamil Nadu, India</p>
                  </div>
                </div>
              </div>
              <div className="relative h-56 w-full overflow-hidden">
                <iframe
                  src={MAPS_EMBED}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Government College of Engineering, Erode"
                  className="absolute inset-0 h-full w-full"
                />
              </div>
              <div className="p-4">
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-navy-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Google Maps
                </a>
              </div>
            </div>

            <div className="card flex items-start gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-navy-900">Community hours</p>
                <p className="mt-0.5 text-sm text-ink-soft">Weekly meetups</p>
                <p className="mt-0.5 text-xs text-ink-faint">Check the events page for schedules</p>
              </div>
            </div>
          </div>

          <div className="card p-6 sm:p-8 lg:col-span-3">
            <h2 className="font-display text-xl font-bold text-navy-900">Send us a message</h2>
            <p className="mt-1 text-sm text-ink-muted">We usually respond within a couple of days.</p>
            <form onSubmit={submit} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="name">Full name</label>
                  <input id="name" className="input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label className="label" htmlFor="email">Email</label>
                  <input id="email" type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="subject">Subject</label>
                <input id="subject" className="input" value={form.subject} onChange={(e) => update('subject', e.target.value)} placeholder="What is this about?" />
              </div>
              <div>
                <label className="label" htmlFor="message">Message</label>
                <textarea
                  id="message"
                  rows={6}
                  className="input resize-y"
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  placeholder="Tell us what you need help with..."
                />
              </div>
              <button type="submit" disabled={sending} className="btn-primary !px-6 !py-3">
                <Send className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
