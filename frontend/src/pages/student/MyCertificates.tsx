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
            return (
              <div key={cert.certificateId} className={cn('card overflow-hidden', revoked && 'opacity-90')}>
                <div className={cn('p-5 text-white', revoked ? 'bg-gradient-to-br from-g-red to-red-700' : 'bg-gradient-to-br from-navy-900 to-navy-700')}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display text-lg font-bold">Certificate of Participation</p>
                      <p className="text-xs text-white/70">{cert.campaignName || 'GDGoC GCEE'}</p>
                    </div>
                    {revoked ? <ShieldX className="h-6 w-6 text-white/80" /> : <Award className="h-6 w-6 text-g-yellow" />}
                  </div>
                  <div className="mt-4 flex items-center justify-between font-mono text-[11px] text-white/70">
                    <span>{cert.firstEligibleEventDateLabel}</span>
                    <span>—</span>
                    <span>{cert.lastEligibleEventDateLabel}</span>
                  </div>
                </div>

                <div className="p-5">
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Events attended</dt>
                      <dd className="font-semibold text-navy-900">{cert.eventsAttended}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Attendance</dt>
                      <dd className="font-semibold text-navy-900">{cert.attendancePercentage}%</dd>
                    </div>
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
                      <Link to={`/verify/${cert.certificateId}`} className="btn-outline flex-1 !py-2">
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
            <div className="overflow-hidden rounded-2xl border border-navy-100">
              <div className="bg-gradient-to-br from-navy-900 to-navy-700 p-8 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display text-xl font-bold">GDGoC GCEE</p>
                    <p className="text-xs text-white/70">Google Developer Groups on Campus</p>
                    <p className="text-xs text-white/70">Government College of Engineering, Erode</p>
                  </div>
                  {preview.qrCode ? (
                    <img src={preview.qrCode} alt="QR" className="h-16 w-16 rounded bg-white p-1" />
                  ) : (
                    <FileText className="h-10 w-10 text-g-yellow" />
                  )}
                </div>
                <div className="mt-8 text-center">
                  <p className="text-base font-bold tracking-widest text-g-blue">CERTIFICATE OF PARTICIPATION</p>
                  <p className="mt-4 text-sm text-white/60">proudly presented to</p>
                  <p className="mt-1 font-display text-2xl font-bold">{preview.studentName}</p>
                  <p className="mt-4 font-mono text-sm text-g-green">{preview.firstEligibleEventDateLabel} — {preview.lastEligibleEventDateLabel}</p>
                  <p className="mt-2 text-xs text-white/70">Events Attended: {preview.eventsAttended} · Attendance: {preview.attendancePercentage}%</p>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link to={`/verify/${preview.certificateId}`} className="btn-outline flex-1">
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
