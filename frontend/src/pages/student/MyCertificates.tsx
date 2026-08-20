import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Award, Eye, BadgeCheck, Download, FileText, ShieldX } from 'lucide-react';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { api, getErrorMessage, downloadPdf } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { Certificate } from '../../types';

export default function MyCertificates() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Certificate | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .get('/certificates/my')
      .then((res) => mounted && setCerts(res.data.certificates))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <PageLoader label="Loading certificates…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900 sm:text-3xl">My Certificates</h1>
        <p className="mt-1 text-sm text-ink-muted">Your participation certificates for GDGoC GCEE campaigns.</p>
      </div>

      {certs.length === 0 ? (
        <EmptyState
          icon={<Award className="h-7 w-7" />}
          title="No certificates yet"
          description="Attend certificate-eligible events and meet the campaign criteria to earn one."
          action={<Link to="/events" className="btn-primary">Explore eligible events</Link>}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {certs.map((cert) => {
            const revoked = cert.status === 'REVOKED';
            const eventName = cert.eventName || cert.campaignName || 'GDGoC GCEE';
            const dateLabel = cert.eventDateLabel || '';
            return (
              <div key={cert.certificateId} className={cn('card overflow-hidden', revoked && 'opacity-90')}>
                <div className={cn('p-5 text-white', revoked ? 'bg-gradient-to-br from-g-red to-red-700' : 'bg-gradient-to-br from-navy-900 to-navy-700')}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display text-lg font-bold">Certificate of Participation</p>
                      <p className="text-xs text-white/70">{eventName}</p>
                    </div>
                    {revoked ? <ShieldX className="h-6 w-6 text-white/80" /> : <Award className="h-6 w-6 text-g-yellow" />}
                  </div>
                  {dateLabel && (
                    <div className="mt-4 font-mono text-[11px] text-white/70">
                      <span>{dateLabel}</span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <dl className="space-y-2 text-sm">
                    {cert.eventName && (
                      <div className="flex justify-between">
                        <dt className="text-ink-muted">Event</dt>
                        <dd className="font-semibold text-navy-900">{cert.eventName}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Certificate ID</dt>
                      <dd className="font-mono text-xs font-semibold text-navy-900">{cert.certificateId}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-col gap-2">
                    <button onClick={() => setPreview(cert)} className="btn-dark w-full">
                      <Eye className="h-4 w-4" /> View
                    </button>
                    <div className="flex gap-2">
                      <Link to={`/certificate/${cert.certificateId}`} className="btn-outline flex-1 !py-2">
                        <BadgeCheck className="h-4 w-4" /> Verify
                      </Link>
                      {!revoked && (
                        <button onClick={() => downloadPdf(cert.certificateId)} className="btn-green flex-1 !py-2">
                          <Download className="h-4 w-4" /> PDF
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title="Certificate Preview" wide>
        {preview && (
          <div>
            <div className="overflow-hidden rounded-2xl border-4 border-[#c8902a] bg-white p-6 shadow-xl relative">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="font-display text-xs font-bold text-[#0b2559]">Google Developer Groups <span className="font-normal text-[10px] text-slate-500">on Campus</span></p>
                  <p className="font-mono text-[11px] font-bold text-[#c8902a]">GDGoC GCEE</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-[10px] font-bold text-[#0b2559]">GOVERNMENT COLLEGE OF ENGINEERING, ERODE</p>
                  <p className="font-mono text-[9px] text-[#c8902a]">LEARN • BUILD • IMPACT</p>
                </div>
              </div>

              <div className="py-6 text-center space-y-2">
                <h2 className="font-display text-xl font-extrabold tracking-tight text-[#0b2559]">
                  CERTIFICATE <span className="text-xs block font-semibold text-[#c8902a] tracking-widest mt-0.5">OF PARTICIPATION</span>
                </h2>

                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-1">
                  THIS IS PROUDLY PRESENTED TO
                </p>

                <p className="font-serif italic text-2xl font-bold text-[#0b2559]">
                  {preview.studentName}
                </p>

                <p className="text-[11px] text-slate-600">
                  for actively participating in the event
                </p>

                <p className="font-display text-sm font-bold text-[#0b2559]">
                  {preview.eventName || preview.campaignName || 'GDGoC GCEE Event'}
                </p>

                <p className="text-[11px] text-slate-500">
                  organized by <strong>GDGoC GCEE</strong>
                </p>

                <div className="pt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-[#0b2559]">
                  <span>📅</span> {preview.eventDateLabel || preview.issueDate || '2026'}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] font-mono text-[#0b2559]">
                <div>
                  <span className="font-bold">CERTIFICATE ID:</span> {preview.certificateId}
                </div>
                {preview.qrCode ? (
                  <img src={preview.qrCode} alt="QR Code" className="h-10 w-10 rounded border border-[#c8902a] bg-white p-0.5" />
                ) : null}
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link to={`/certificate/${preview.certificateId}`} className="btn-outline flex-1">
                <BadgeCheck className="h-4 w-4" /> Verify
              </Link>
              {preview.status !== 'REVOKED' && (
                <button onClick={() => downloadPdf(preview.certificateId)} className="btn-green flex-1">
                  <Download className="h-4 w-4" /> Download PDF
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
