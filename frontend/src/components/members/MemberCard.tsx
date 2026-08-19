import { Linkedin, User } from 'lucide-react';
import type { Member } from '../../types';

export function MemberCard({ member }: { member: Member }) {
  const socials = member.socialLinks || {};
  const linkedinUrl = socials.linkedin || (socials.github || '#');

  return (
    <div className="card group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <div>
        {/* Large portrait image area */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100">
          {member.photo ? (
            <img
              src={member.photo}
              alt={member.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 text-slate-400">
              <User className="h-12 w-12 stroke-[1.5]" />
            </div>
          )}
        </div>

        {/* Member Info */}
        <div className="px-3 pt-3">
          <h3 className="font-display text-sm font-bold tracking-tight text-navy-900 sm:text-base">
            {member.name}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {member.role || 'Board Member'}
          </p>
          {member.department && (
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              {member.department}
            </p>
          )}
        </div>
      </div>

      {/* LinkedIn Button at bottom */}
      <div className="mt-3 flex justify-center pb-3">
        <a
          href={linkedinUrl}
          target={linkedinUrl !== '#' ? '_blank' : '_self'}
          rel="noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-navy-900 transition-colors hover:bg-[#0A66C2] hover:text-white"
          aria-label={`${member.name} LinkedIn Profile`}
        >
          <Linkedin className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
