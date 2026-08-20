import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Award, BadgeCheck, FileText, QrCode, ArrowRight, Search } from 'lucide-react';
import { Reveal } from '../../components/ui/Reveal';
import { SectionHeading } from '../../components/ui/SectionHeading';

const steps = [
  { icon: Award, title: 'Participate', desc: 'Register for and attend certificate-eligible events during the campaign period.' },
  { icon: BadgeCheck, title: 'Meet the criteria', desc: 'Maintain the required minimum attendance percentage and eligible events.' },
  { icon: FileText, title: 'Get your certificate', desc: 'Once the campaign closes, certificates are issued to eligible students.' },
  { icon: QrCode, title: 'Verify anywhere', desc: 'Each certificate carries a unique ID and QR code for instant verification.' },
];

export default function Certificates() {
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    const id = value.trim();
    if (!id) return;
    navigate(`/verify/${id}`);
  };

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 pt-32 pb-16 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 left-1/3 h-64 w-64 rounded-full bg-g-yellow/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-g-green/15 blur-3xl" />
        </div>
        <div className="container-x relative z-10">
          <span className="chip border border-white/15 bg-white/5 text-white/80">Certificates</span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">Participation Certificates</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            Recognition for active participation in the GDGoC GCEE community. Each certificate is unique and verifiable.
          </p>
          <form onSubmit={verify} className="mx-auto mt-8 flex max-w-lg items-center gap-2 rounded-xl border border-white/15 bg-white/5 p-1.5 backdrop-blur-sm">
            <Search className="ml-2 h-4 w-4 shrink-0 text-white/50" />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter certificate ID (e.g. GDG-GCEE-2026-000001)"
              className="w-full bg-transparent py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
            <button type="submit" className="btn-primary !py-2">
              Verify
            </button>
          </form>
        </div>
        <div className="relative z-10 mt-10 flex h-1.5">
          <div className="flex-1 bg-g-blue" />
          <div className="flex-1 bg-g-green" />
          <div className="flex-1 bg-g-yellow" />
          <div className="flex-1 bg-g-red" />
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow="How it works"
              title="Your journey to a certificate"
              subtitle="Certificates are awarded per consolidated campaign for eligible technical events."
            />
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="card h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-g-blue/10 text-g-blue">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-ink-faint">Step {i + 1}</p>
                  <h3 className="font-display text-base font-bold text-navy-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Sample certificate + important notes */}
      <section className="bg-slate-50 py-16">
        <div className="container-x grid items-start gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="overflow-hidden rounded-2xl border-4 border-[#c8902a] bg-white p-6 shadow-2xl relative">
              {/* Header Logos */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="font-display text-sm font-bold text-[#0b2559]">Google Developer Groups <span className="font-normal text-xs text-slate-500">on Campus</span></p>
                  <p className="font-mono text-xs font-bold text-[#c8902a]">GDGoC GCEE</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xs font-bold text-[#0b2559]">GOVERNMENT COLLEGE OF ENGINEERING, ERODE</p>
                  <p className="font-mono text-[10px] text-[#c8902a]">LEARN • BUILD • IMPACT</p>
                </div>
              </div>

              {/* Main Content */}
              <div className="py-8 text-center space-y-3">
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0b2559]">
                  CERTIFICATE <span className="text-sm block font-semibold text-[#c8902a] tracking-widest mt-1">OF PARTICIPATION</span>
                </h2>

                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400 pt-2">
                  THIS IS PROUDLY PRESENTED TO
                </p>

                <p className="font-serif italic text-2xl sm:text-3xl font-bold text-[#0b2559] py-1">
                  Student Name
                </p>

                <p className="text-xs text-slate-600">
                  for actively participating in the event
                </p>

                <p className="font-display text-base sm:text-lg font-bold text-[#0b2559]">
                  AI Prompt Engineering Workshop
                </p>

                <p className="text-xs text-slate-500">
                  organized by <strong>GDGoC GCEE</strong>
                </p>

                <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-[#0b2559]">
                  <span>📅</span> 18 August 2026
                </div>
              </div>

              {/* Footer ID and QR Code */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] font-mono text-[#0b2559]">
                <div>
                  <span className="font-bold">CERTIFICATE ID:</span> GDGCEE-20260818-A123
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase text-slate-400 text-right leading-tight">Scan to<br/>verify</span>
                  <div className="h-9 w-9 rounded border border-[#c8902a] bg-slate-900 flex items-center justify-center text-[8px] font-bold text-white">
                    QR
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="space-y-5">
              <div className="card p-6">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold text-navy-900">
                  <ShieldCheck className="h-5 w-5 text-g-green" /> Important notes
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-ink-soft">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-g-blue" />
                    Certificates are issued per campaign based on attendance across eligible events.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-g-green" />
                    Inauguration events do not count toward certificate eligibility.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-g-yellow" />
                    The participation period shown is from the first to the last eligible event attended.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-g-red" />
                    This is a GDGoC GCEE community certificate — not an official Google certification.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-g-blue" />
                    Every certificate can be verified publicly using its ID or QR code.
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl bg-navy-950 p-7">
                <h3 className="font-display text-lg font-bold text-white">Have a certificate?</h3>
                <p className="mt-2 text-sm text-white/70">
                  Log in to view your certificates, download PDFs and share verification links.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link to="/login?redirect=/dashboard/certificates" className="btn-primary flex-1">
                    Login to view <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/verify" className="btn flex-1 !border-white/20 !bg-white/5 !text-white hover:!bg-white/10">
                    Verify a certificate
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
