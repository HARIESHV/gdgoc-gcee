import { Github, Linkedin, Instagram, Twitter } from 'lucide-react';
import type { Member } from '../../types';

export function MemberCard({ member }: { member: Member }) {
  const socials = member.socialLinks || {};
  return (
    <div className="card group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-navy-800 to-navy-950">
        {member.photo ? (
          <img src={member.photo} alt={member.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-6xl font-bold text-white/20">{member.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 p-3 opacity-0 transition-opacity group-hover:opacity-100">
          {socials.github && (
            <a href={socials.github} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-navy-900 transition hover:bg-g-blue hover:text-white" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </a>
          )}
          {socials.linkedin && (
            <a href={socials.linkedin} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-navy-900 transition hover:bg-g-blue hover:text-white" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </a>
          )}
          {socials.instagram && (
            <a href={socials.instagram} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-navy-900 transition hover:bg-g-blue hover:text-white" aria-label="Instagram">
              <Instagram className="h-4 w-4" />
            </a>
          )}
          {socials.twitter && (
            <a href={socials.twitter} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-navy-900 transition hover:bg-g-blue hover:text-white" aria-label="Twitter">
              <Twitter className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
      <div className="p-5 text-center">
        <h3 className="font-display text-base font-bold text-navy-900">{member.name}</h3>
        <p className="mt-0.5 text-sm font-medium text-g-blue">{member.role}</p>
        <p className="mt-1 text-xs text-ink-muted">
          {[member.department, member.year].filter(Boolean).join(' · ') || 'GCEE'}
        </p>
      </div>
    </div>
  );
}
