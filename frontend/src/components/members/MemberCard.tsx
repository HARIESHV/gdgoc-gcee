import { Linkedin, Github, Instagram, Twitter, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Member } from '../../types';

export function MemberCard({
  member,
  hideImageOnMobile = false,
}: {
  member: Member;
  hideImageOnMobile?: boolean;
}) {
  const socials = member.socialLinks || {};
  const hasSocials = socials.linkedin || socials.github || socials.instagram || socials.twitter;

  return (
    <div className="card group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-center shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <div>
        {/* Large portrait image area */}
        <div
          className={cn(
            'relative aspect-[4/5] w-full overflow-hidden bg-slate-100',
            hideImageOnMobile && 'hidden sm:block'
          )}
        >
          {member.photo ? (
            <img
              src={member.photo}
              alt={member.name}
              draggable={false}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105 pointer-events-none select-none"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-navy-900 to-navy-800 text-white/40">
              <User className="h-14 w-14 stroke-[1.5]" />
            </div>
          )}
        </div>

        {/* Member Details */}
        <div className="px-3 pt-3.5 pb-1">
          <h3 className="font-display text-sm font-bold tracking-tight text-navy-900 sm:text-base">
            {member.name}
          </h3>
          
          {/* Coordinator Role */}
          <div className="mt-1">
            <span className="inline-block rounded-full bg-g-blue/10 px-2.5 py-0.5 font-mono text-xs font-bold text-g-blue">
              {member.role || 'Team Member'}
            </span>
          </div>

          {/* Department & Year */}
          {(member.department || member.year) && (
            <p className="mt-1.5 truncate text-[11px] font-medium text-slate-500">
              {[member.department, member.year].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Social / Contact Links */}
      <div className="mt-2 flex items-center justify-center gap-2 pb-3.5">
        {socials.linkedin && (
          <a
            href={socials.linkedin}
            target="_blank"
            rel="noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-[#0A66C2] hover:text-white"
            title="LinkedIn"
          >
            <Linkedin className="h-3.5 w-3.5" />
          </a>
        )}
        {socials.github && (
          <a
            href={socials.github}
            target="_blank"
            rel="noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-black hover:text-white"
            title="GitHub"
          >
            <Github className="h-3.5 w-3.5" />
          </a>
        )}
        {socials.instagram && (
          <a
            href={socials.instagram}
            target="_blank"
            rel="noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-[#E4405F] hover:text-white"
            title="Instagram"
          >
            <Instagram className="h-3.5 w-3.5" />
          </a>
        )}
        {socials.twitter && (
          <a
            href={socials.twitter}
            target="_blank"
            rel="noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-[#1DA1F2] hover:text-white"
            title="Twitter"
          >
            <Twitter className="h-3.5 w-3.5" />
          </a>
        )}
        {!hasSocials && (
          <span className="text-[10px] font-mono text-slate-300">GDGoC GCEE</span>
        )}
      </div>
    </div>
  );
}
