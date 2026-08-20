import { QrCode } from 'lucide-react';

const NAVY = '#0b1b33';
const GOLD = '#c5a53a';
const GRAY = '#5f6b7a';

export interface CertificatePreviewData {
  participantName: string;
  eventName: string;
  eventDateLabel: string;
  certificateId: string;
  organization?: string;
  institution?: string;
  qrCode?: string;
}

/**
 * Visual template for the GDGoC GCEE Certificate of Participation.
 * Mirrors the whitespace / navy / gold / architectural design used in the
 * generated PDF so the admin preview matches the downloadable file.
 */
export function CertificatePreview({ data }: { data: CertificatePreviewData }) {
  const org = data.organization || 'GDGoC GCEE';
  const inst = data.institution || 'Government College of Engineering, Erode';

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-white shadow-xl"
      style={{ aspectRatio: '841.89 / 595.28' }}
    >
      {/* Outer gold + inner navy frame */}
      <div className="absolute inset-[1.2%] rounded-[3px] border-[2.5px]" style={{ borderColor: GOLD }} />
      <div className="absolute inset-[2.4%] rounded-[2px] border" style={{ borderColor: NAVY }} />

      {/* Corner decorations */}
      <Corner className="left-[1.2%] top-[1.2%]" flipX={false} flipY={false} />
      <Corner className="right-[1.2%] top-[1.2%]" flipX={true} flipY={false} />
      <Corner className="left-[1.2%] bottom-[1.2%]" flipX={false} flipY={true} />
      <Corner className="right-[1.2%] bottom-[1.2%]" flipX={true} flipY={true} />

      <div className="relative flex h-full w-full flex-col items-center px-[8%] py-[4.5%] text-center">
        {/* Branding */}
        <p className="font-display text-[clamp(14px,2.4vw,26px)] font-bold tracking-wide" style={{ color: NAVY }}>
          {org}
        </p>
        <p className="text-[clamp(7px,0.9vw,12px)] tracking-wide" style={{ color: GRAY }}>
          {inst}
        </p>

        {/* Heading */}
        <p className="mt-[1.6%] font-display text-[clamp(15px,2.6vw,30px)] font-bold leading-none" style={{ color: NAVY }}>
          CERTIFICATE OF PARTICIPATION
        </p>
        <div className="mt-[1%] h-[3px] w-[30%] rounded-full" style={{ backgroundColor: GOLD }} />
        <p className="mt-[2%] text-[clamp(8px,1vw,13px)]" style={{ color: GRAY }}>
          This certificate is proudly presented to
        </p>

        {/* Participant name */}
        <p
          className="mt-[1.5%] max-w-full truncate font-display text-[clamp(20px,4.4vw,42px)] font-bold uppercase leading-none"
          style={{ color: NAVY }}
        >
          {data.participantName}
        </p>

        {/* Architectural illustration */}
        <ArchitecturalIllustration className="mt-[2.2%] h-[clamp(28px,4.6vw,54px)] w-auto text-navy-900/70" />

        <p className="text-[clamp(8px,1vw,13px)]" style={{ color: GRAY }}>
          for outstanding participation in
        </p>
        <p className="mt-[0.8%] max-w-full truncate text-[clamp(11px,1.7vw,20px)] font-semibold" style={{ color: NAVY }}>
          {data.eventName}
        </p>
        <p className="mt-[0.6%] text-[clamp(9px,1.3vw,16px)] font-semibold" style={{ color: NAVY }}>
          {data.eventDateLabel}
        </p>

        {/* Bottom row: badge left, QR right */}
        <div className="mt-auto flex w-full items-end justify-between">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-[clamp(34px,5.6vw,64px)] w-[clamp(34px,5.6vw,64px)] items-center justify-center rounded-full border-[3px]" style={{ borderColor: GOLD }}>
              <div className="flex h-[72%] w-[72%] items-center justify-center rounded-full border" style={{ borderColor: GOLD }}>
                <StarBadge />
              </div>
            </div>
            <p className="text-[clamp(6.5px,0.8vw,10px)] font-bold" style={{ color: NAVY }}>
              {org}
            </p>
            <p className="-mt-1 text-[clamp(5.5px,0.65vw,8px)]" style={{ color: GRAY }}>
              Certificate of Participation
            </p>
          </div>

          <div className="flex flex-col items-center gap-1">
            {data.qrCode ? (
              <img src={data.qrCode} alt="QR code" className="h-[clamp(40px,6.4vw,74px)] w-[clamp(40px,6.4vw,74px)] rounded border border-navy-100 bg-white p-1" />
            ) : (
              <div className="flex h-[clamp(40px,6.4vw,74px)] w-[clamp(40px,6.4vw,74px)] items-center justify-center rounded border border-black/10 bg-white text-black/20">
                <QrCode className="h-1/2 w-1/2" />
              </div>
            )}
            <p className="text-[clamp(5.5px,0.65vw,8px)] font-bold tracking-wide" style={{ color: NAVY }}>
              {data.certificateId}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Corner({ className, flipX, flipY }: { className: string; flipX: boolean; flipY: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute h-[6%] w-[6%] ${className}`}
      style={{ transform: `${flipX ? 'scaleX(-1)' : ''} ${flipY ? 'scaleY(-1)' : ''}` }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" fill="none">
        <path d="M0 100 L0 0 L100 0" stroke={GOLD} strokeWidth="6" />
        <path d="M8 100 L8 8 L100 8" stroke={NAVY} strokeWidth="3" />
      </svg>
    </div>
  );
}

function StarBadge() {
  return (
    <svg viewBox="0 0 24 24" className="h-[60%] w-[60%]" style={{ fill: GOLD }}>
      <path d="M12 2l2.7 6.3 6.8.6-5.2 4.4 1.6 6.7L12 16.9l-5.9 3.1 1.6-6.7L2.5 8.9l6.8-.6L12 2z" />
    </svg>
  );
}

function ArchitecturalIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 70" className={className} fill="none" aria-hidden="true">
      {/* Building base */}
      <path
        d="M20 62 L20 28 L60 8 L100 24 L100 62 Z"
        stroke="#0b1b33"
        strokeWidth="2.5"
        strokeOpacity="0.55"
        fill="none"
      />
      {/* Front body */}
      <path
        d="M60 62 L60 30 L100 24 L140 30 L140 62 Z"
        stroke="#0b1b33"
        strokeWidth="2"
        strokeOpacity="0.4"
        fill="none"
      />
      {/* Right wing */}
      <path
        d="M140 62 L140 30 L180 22 L220 30 L220 62 Z"
        stroke="#0b1b33"
        strokeWidth="2.5"
        strokeOpacity="0.55"
        fill="none"
      />
      {/* Columns */}
      {[68, 82, 96, 110, 124].map((x) => (
        <path key={x} d={`M${x} 62 L${x} 32`} stroke="#0b1b33" strokeWidth="1.6" strokeOpacity="0.45" />
      ))}
      {/* Pediment / dome */}
      <path d="M92 14 L112 6 L132 14" stroke="#c5a53a" strokeWidth="2" strokeOpacity="0.8" fill="none" />
      {/* Flag */}
      <path d="M112 6 L112 2" stroke="#c5a53a" strokeWidth="1.6" />
      <path d="M112 2 L122 4 L112 6 Z" fill="#c5a53a" fillOpacity="0.8" />
      {/* Ground line */}
      <path d="M16 62 L224 62" stroke="#c5a53a" strokeWidth="2" strokeOpacity="0.7" />
    </svg>
  );
}