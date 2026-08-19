import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Code2,
  Cpu,
  GitBranch,
  GraduationCap,
  HeartHandshake,
  Cloud,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Award,
  Ticket,
  Zap,
  Globe,
  Terminal,
  CalendarDays,
  Clock,
  ChevronRight,
  Mail,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { Hero } from '../../components/home/Hero';
import { EventCard } from '../../components/events/EventCard';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { Reveal } from '../../components/ui/Reveal';
import { CountUp } from '../../components/ui/CountUp';
import { PageLoader } from '../../components/ui/Spinner';
import { api, getErrorMessage } from '../../lib/api';
import { formatHumanDate, cn } from '../../lib/utils';
import type { GEvent, GalleryItem, Member, LeaderboardEntry } from '../../types';

const whyJoin = [
  { icon: GraduationCap, title: 'Hands-on Learning', desc: 'Workshops and labs where you build real projects, not just theory.' },
  { icon: Trophy, title: 'Hackathons & Contests', desc: 'Compete in build sprints, sharpen problem-solving and win recognition.' },
  { icon: HeartHandshake, title: 'Mentorship', desc: 'Guidance from seniors, faculty and industry developers throughout the year.' },
  { icon: Users, title: 'Community Network', desc: 'Connect with driven students across departments and batches.' },
  { icon: Award, title: 'Certificates', desc: 'Earn participation certificates for active involvement in eligible events.' },
  { icon: Zap, title: 'Career Readiness', desc: 'Developer skills, tooling and a portfolio that recruiters notice.' },
];

const technologies = [
  { icon: Code2, name: 'Web Development', color: 'text-g-blue' },
  { icon: Cpu, name: 'AI / ML', color: 'text-g-green' },
  { icon: Cloud, name: 'Cloud Computing', color: 'text-g-yellow' },
  { icon: GitBranch, name: 'Git & GitHub', color: 'text-g-red' },
  { icon: Smartphone, name: 'Android', color: 'text-g-green' },
  { icon: ShieldCheck, name: 'Cybersecurity', color: 'text-g-blue' },
  { icon: Terminal, name: 'Dev Tools', color: 'text-g-red' },
  { icon: Globe, name: 'Open Source', color: 'text-g-yellow' },
];

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<GEvent[]>([]);
  const [past, setPast] = useState<GEvent[]>([]);
  const [featured, setFeatured] = useState<GEvent | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [statsRes, eventsRes, membersRes, galleryRes, boardRes] = await Promise.all([
          api.get('/stats'),
          api.get('/events?limit=20'),
          api.get('/members'),
          api.get('/gallery?limit=8'),
          api.get('/leaderboard?limit=5'),
        ]);

        if (!mounted) return;
        setStats(statsRes.data.stats);
        const events = eventsRes.data.events as GEvent[];
        setUpcoming(events.filter((e) => e.effectiveStatus !== 'COMPLETED' && e.effectiveStatus !== 'CANCELLED').slice(0, 3));
        setPast(events.filter((e) => e.effectiveStatus === 'COMPLETED').slice(0, 3));
        setFeatured(events.find((e) => e.isInauguration) || events[0] || null);
        setMembers(membersRes.data.members.slice(0, 6));
        setGallery(galleryRes.data.items.slice(0, 6));
        setLeaders(boardRes.data.leaderboard.slice(0, 5));
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <>
        <Hero />
        <PageLoader label="Loading community data…" />
      </>
    );
  }

  return (
    <>
      <Hero />

      {/* About */}
      <section className="bg-white py-20">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-g-green" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-g-green">About GDGoC</span>
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
                A student developer community at GCEE
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink-muted">
                GDGoC on Campus brings together students passionate about technology — from web and AI/ML to cloud,
                open source and developer tools. We learn together, build together and grow into confident developers.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Student-run events: workshops, hackathons, tech talks and meetups',
                  'Learn modern technologies used by developers worldwide',
                  'Network with peers, faculty and industry mentors',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-ink-soft">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-g-green/10 text-g-green">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/about" className="btn-primary mt-8">
                Learn more about us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-g-blue/10 via-g-green/10 to-g-yellow/10 blur-xl" />
              <div className="relative grid grid-cols-2 gap-4">
                {[
                  { icon: Code2, label: 'Workshops', color: 'bg-g-blue/10 text-g-blue' },
                  { icon: Trophy, label: 'Hackathons', color: 'bg-g-red/10 text-g-red' },
                  { icon: Users, label: 'Tech Talks', color: 'bg-g-green/10 text-g-green' },
                  { icon: GitBranch, label: 'Open Source', color: 'bg-g-yellow/10 text-yellow-700' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="card flex flex-col items-center gap-3 p-6 text-center">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-navy-900">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="bg-slate-50 py-20">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow="What's happening"
              title="Upcoming Events"
              subtitle="Mark your calendar — workshops, hackathons and meetups are always around the corner."
            />
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event, i) => (
              <Reveal key={event._id} delay={i * 90}>
                <EventCard event={event} />
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-10 text-center">
              <Link to="/events" className="btn-outline">
                View all events
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Past events */}
      {past.length > 0 && (
        <section className="bg-white py-20 border-t border-slate-100">
          <div className="container-x">
            <Reveal>
              <SectionHeading
                eyebrow="Community Highlights"
                title="Past Events"
                subtitle="Explore our completed workshops, hackathons, and developer sessions."
              />
            </Reveal>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {past.map((event, i) => (
                <Reveal key={event._id} delay={i * 90}>
                  <div className="card group overflow-hidden border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:shadow-lift">
                    {/* Event Banner */}
                    <div className="relative h-48 w-full overflow-hidden bg-navy-950">
                      {event.banner ? (
                        <img
                          src={event.banner}
                          alt={event.title}
                          draggable={false}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none select-none"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 text-white/30">
                          <CalendarDays className="h-12 w-12" />
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded-full bg-slate-900/80 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-white backdrop-blur-xs">
                        Past Event
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-g-blue">{event.category}</span>
                        <h3 className="mt-1 font-display text-base font-bold text-navy-900 truncate">
                          {event.title}
                        </h3>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>Date: {formatHumanDate(event.date)}</span>
                        </div>
                        {event.startTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>Time: {event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}</span>
                          </div>
                        )}
                        {event.venue && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">Venue: {event.venue}</span>
                          </div>
                        )}
                      </div>

                      {(event.shortDescription || event.description) && (
                        <p className="line-clamp-2 text-xs text-slate-500">
                          {event.shortDescription || event.description}
                        </p>
                      )}

                      <div className="border-t border-slate-100 pt-3 space-y-1 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400 font-medium">Handled By:</span>
                          <span className="font-semibold text-navy-900">{(event as any).handledBy || 'GDGoC GCEE Team'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400 font-medium">Students Registered:</span>
                          <span className="font-bold text-g-blue">{event.registeredCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <div className="mt-10 text-center">
                <Link to="/events" className="btn-outline">
                  Browse all past events
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Featured event */}
      {featured && (
        <section className="bg-white py-20">
          <div className="container-x">
            <Reveal>
              <div className="overflow-hidden rounded-3xl border border-navy-100 shadow-lift">
                <div className="grid lg:grid-cols-5">
                  <div className="relative min-h-[260px] lg:col-span-2">
                    {featured.banner ? (
                      <img src={featured.banner} alt={featured.title} draggable={false} className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-g-blue to-navy-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
                    <span className="absolute left-5 top-5 chip border border-white/20 bg-white/10 text-white backdrop-blur-sm">
                      <Sparkles className="h-3 w-3" /> Featured Event
                    </span>
                  </div>
                  <div className="flex flex-col justify-center p-8 lg:col-span-3 lg:p-12">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="chip bg-g-blue/10 text-blue-700">{featured.category}</span>
                      <span className="chip bg-navy-900/5 text-navy-700">{formatHumanDate(featured.date)}</span>
                      {featured.isInauguration && <span className="chip bg-g-yellow/15 text-yellow-700">Inauguration</span>}
                      {featured.isCertificateEligible && <span className="chip bg-g-green/10 text-green-700">Certificate eligible</span>}
                    </div>
                    <h3 className="font-display text-2xl font-bold text-navy-900 sm:text-3xl">{featured.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">{featured.description || featured.shortDescription}</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {featured.technologies?.map((t) => (
                        <span key={t} className="chip border border-navy-100 bg-white font-mono text-xs text-ink-soft">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-8">
                      <Link to={`/events/${featured.eventId}`} className="btn-primary">
                        View event
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Statistics */}
      <section className="bg-navy-950 py-20">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow="Our impact"
              title="The community in numbers"
              align="center"
              className="[&_h2]:text-white [&_.mx-auto]:text-white/60"
            />
          </Reveal>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
            {[
              { label: 'Community Members', value: stats?.members ?? stats?.totalStudents ?? 0, icon: Users },
              { label: 'Events Hosted', value: stats?.totalEvents ?? 0, icon: CalendarDays },
              { label: 'Hackathons & Workshops', value: (stats?.workshops ?? 0) + (stats?.hackathons ?? 0), icon: Trophy },
              { label: 'Certificates Issued', value: stats?.certificates ?? 0, icon: Award },
            ].map(({ label, value, icon: Icon }, i) => (
              <Reveal key={label} delay={i * 80}>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
                  <Icon className="mx-auto mb-3 h-7 w-7 text-g-blue" />
                  <p className="font-display text-3xl font-bold text-white sm:text-4xl">
                    <CountUp value={value} suffix="+" />
                  </p>
                  <p className="mt-1 text-sm text-white/60">{label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why join */}
      <section className="bg-white py-20">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow="Why GDGoC GCEE"
              title="Why join the community?"
              subtitle="Build skills, ship projects and grow with people who love to build."
            />
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {whyJoin.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 70}>
                <div className="card group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-g-blue/10 text-g-blue transition-colors group-hover:bg-g-blue group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-navy-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="bg-slate-50 py-20">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow="Technologies & workshops"
              title="What we learn and build with"
              subtitle="Practical sessions on the technologies powering today's developer world."
            />
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {technologies.map(({ icon: Icon, name, color }, i) => (
              <Reveal key={name} delay={i * 60}>
                <div className="card group flex flex-col items-center gap-3 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <Icon className={cn('h-8 w-8 transition-transform group-hover:scale-110', color)} />
                  <p className="text-sm font-semibold text-navy-900">{name}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Community members */}
      <section className="bg-white py-20">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow="Meet the community"
              title="Community members"
              subtitle="A few of the passionate developers behind GDGoC GCEE."
            />
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member, i) => (
              <Reveal key={member._id} delay={i * 80}>
                <div className="card group flex items-center gap-4 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-navy-950 flex items-center justify-center">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} draggable={false} className="h-full w-full object-contain p-0.5 pointer-events-none select-none" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-g-blue to-g-green text-xl font-bold text-white">
                        {member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy-900">{member.name}</p>
                    <p className="truncate text-sm text-ink-muted">{member.role}</p>
                    <p className="truncate text-xs text-ink-faint">{member.department}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="mt-10 text-center">
              <Link to="/members" className="btn-outline">
                Meet everyone
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Recent activities / leaderboard */}
      <section className="bg-slate-50 py-20">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <Reveal>
            <SectionHeading align="left" eyebrow="Community activity" title="Leaderboard leaders" subtitle="Top contributors this year by community participation points." />
            <div className="card divide-y divide-navy-50">
              {leaders.map((entry, i) => (
                <div key={entry.studentId} className="flex items-center gap-4 p-4">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      i === 0 ? 'bg-g-yellow/20 text-yellow-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-navy-50 text-ink-muted'
                    )}
                  >
                    {entry.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-900">{entry.name}</p>
                    <p className="truncate text-xs text-ink-muted">{entry.department || 'GCEE'} · {entry.eventsAttended} events</p>
                  </div>
                  <p className="flex items-center gap-1 font-mono text-sm font-bold text-g-blue">
                    <Zap className="h-4 w-4" /> {entry.points}
                  </p>
                </div>
              ))}
            </div>
            <Link to="/dashboard/leaderboard" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-g-blue hover:underline">
              Full leaderboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Reveal delay={100}>
            <SectionHeading align="left" eyebrow="Certificates" title="Get recognized for participating" subtitle="Active members receive consolidated participation certificates for eligible events." />
            <div className="card group overflow-hidden border border-navy-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lift">
              <div className="relative overflow-hidden bg-navy-950">
                <img
                  src="/certificate-sample.jpg"
                  alt="GDGoC GCEE Certificate of Participation Preview"
                  draggable={false}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-102 pointer-events-none select-none"
                />
              </div>
              <div className="flex flex-col gap-3 p-6 sm:flex-row">
                <Link to="/register" className="btn-primary flex-1">
                  Join to earn yours
                  <Ticket className="h-4 w-4" />
                </Link>
                <Link to="/certificates" className="btn-outline flex-1">
                  Verify a certificate
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Gallery preview */}
      {gallery.length > 0 && (
        <section className="bg-white py-20">
          <div className="container-x">
            <Reveal>
              <SectionHeading
                eyebrow="Gallery"
                title="Moments from the community"
                subtitle="A glimpse of our workshops, hackathons and meetups."
              />
            </Reveal>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {gallery.map((item, i) => (
                <Reveal key={item.id} delay={i * 60} className={cn(i === 0 && 'md:row-span-2')}>
                  <Link to="/gallery" className="group relative block h-44 overflow-hidden rounded-2xl md:h-56">
                    <img src={item.image} alt={item.title} draggable={false} className="h-full w-full object-cover transition duration-500 group-hover:scale-105 pointer-events-none select-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="absolute bottom-3 left-3 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {item.title || item.category}
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <div className="mt-10 text-center">
                <Link to="/gallery" className="btn-outline">
                  Open gallery
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Contact Us */}
      <section className="bg-white py-20">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              eyebrow="Get in touch"
              title="Contact Us"
              subtitle="Have questions about events, membership, or certificates? We'd love to hear from you."
            />
          </Reveal>
          <Reveal delay={100}>
            <div className="mx-auto max-w-2xl">
              <div className="card p-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-g-blue/10 text-g-blue">
                  <Mail className="h-8 w-8" />
                </div>
                <h3 className="font-display text-xl font-bold text-navy-900">Let's connect</h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Whether you have a question about our events, want to collaborate, or just want to say hello — reach out to us.
                </p>
                <div className="mt-6 flex flex-col items-center gap-3 text-sm text-ink-soft sm:flex-row sm:justify-center">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-g-blue" />
                    <span>gdgocgcee@gmail.com</span>
                  </div>
                  <div className="hidden h-1 w-1 rounded-full bg-ink-faint sm:block" />
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-g-green" />
                    <span>Government College of Engineering, Erode</span>
                  </div>
                </div>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link to="/contact" className="btn-primary">
                    Contact us
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="mailto:gdgocgcee@gmail.com" className="btn-outline">
                    <Mail className="h-4 w-4" />
                    Send email
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-navy-950 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-g-blue/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-g-green/15 blur-3xl" />
        </div>
        <div className="container-x relative z-10 text-center">
          <Reveal>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Ready to build with us?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
              Join GDGoC GCEE and be part of a community that learns, builds and innovates together.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary !px-6 !py-3 text-base">
                Join Community
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/events" className="btn !px-6 !py-3 border border-white/20 bg-white/5 text-base text-white hover:bg-white/10">
                Explore Events
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
