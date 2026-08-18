import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, ShieldX, QrCode } from 'lucide-react';
import { PageLoader } from '../../components/ui/Spinner';
import { api, getErrorMessage } from '../../lib/api';
import { downloadPdf, cn } from '../../lib/utils';
import type { Certificate } from '../../types';

export default function VerifyCertificate() {
  const { certificateId } = useParams();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get(`/certificates/verify/${certificateId}`)
      .then((res) => {
        if (mounted) setCert(res.data.certificate);
      })
      .catch((err) => {
        if (mounted) {
          setNotFound(true);
          toast.error(getErrorMessage(err));
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [certificateId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 pt-28">
        <PageLoader label="Verifying certificate…" />
      </div>
    );
  }

  if (notFound || !cert) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pt-28">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-g-red/10 text-g-red">
            <ShieldX className="h-8 w-8" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-navy-900">Certificate Not Found</h1>
          <p className="mt-2 text-sm text-ink-muted">
            We could not find a certificate with ID <span className="font-mono text-navy-900">{certificateId}</span>.
            Check the ID and try again.
          </p>
          <Link to="/certificates" className="btn-primary mt-6">
            Back to certificates
          </Link>
        </div>
      </div>
    );
  }

  const revoked = cert.status === 'REVOKED';
  const eventName = cert.eventName || cert.campaignName || 'GDGoC GCEE';
  const eventDate = cert.eventDateLabel || cert.firstEligibleEventDateLabel || '';

  const handleDownload = async () => {
    setDownloading(true);
    downloadPdf(cert.certificateId);
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20">
      <div className="container-x max-w-3xl">
        <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-lift">
          <div className="bg-gradient-to-br from-navy-900 to-navy-700 p-8 text-white sm:p-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="font-display text-xl font-bold">GDGoC GCEE</p>
                <p className="text-xs text-white/70">Government College of Engineering, Erode</p>
              </div>
              <div className="hidden h-20 w-20 shrink-0 rounded-lg bg-white p-1.5 sm:block">
                {cert.qrCode ? (
                  <img src={cert.qrCode} alt="QR code" className="h-full w-full" />
                ) : (
                  <QrCode className="h-full w-full text-navy-900" />
                )}
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-base font-bold tracking-widest" style={{ color: '#c5a53a' }}>CERTIFICATE OF PARTICIPATION</p>
              <div className="mx-auto mt-3 h-0.5 w-32 rounded bg-g-yellow" />
              <p className="mt-5 text-sm text-white/60">presented to</p>
              <p className="mt-1 font-display text-3xl font-bold text-white">{cert.studentName}</p>
              <p className="mt-4 text-sm text-white/80">{eventName}</p>
              {eventDate && <p className="mt-1 text-sm text-white/80">{eventDate}</p>}
            </div>

            <div className="mt-8 text-center">
              <p className="text-[10px] font-mono tracking-wide text-white/50">Certificate ID: {cert.certificateId}</p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'mt-6 flex items-center gap-4 rounded-2xl border p-5',
            revoked ? 'border-g-red/30 bg-g-red/10' : 'border-g-green/30 bg-g-green/10'
          )}
        >
          {revoked ? (
            <ShieldX className="h-10 w-10 shrink-0 text-g-red" />
          ) : (
            <ShieldCheck className="h-10 w-10 shrink-0 text-g-green" />
          )}
          <div className="flex-1">
            <h1 className={cn('font-display text-xl font-bold sm:text-2xl', revoked ? 'text-g-red' : 'text-green-700')}>
              {revoked ? 'Certificate Revoked' : 'Certificate Verified'}
            </h1>
            <p className="mt-0.5 text-sm text-ink-soft">
              {revoked ? 'This certificate is no longer valid.' : 'Certificate of Participation'}
            </p>
          </div>
          {revoked && (
            <span className="hidden rounded-full bg-g-red px-3 py-1 text-xs font-bold tracking-wider text-white sm:block">
              {cert.status}
            </span>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
          <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Student Name</dt>
              <dd className="mt-1 font-semibold text-navy-900">{cert.studentName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Event</dt>
              <dd className="mt-1 font-semibold text-navy-900">{eventName}</dd>
            </div>
            {eventDate && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-faint">Event Date</dt>
                <dd className="mt-1 font-semibold text-navy-900">{eventDate}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Organized By</dt>
              <dd className="mt-1 font-semibold text-navy-900">GDGoC GCEE</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Certificate ID</dt>
              <dd className="mt-1 font-mono font-semibold text-navy-900">{cert.certificateId}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Status</dt>
              <dd className="mt-1 flex items-center gap-1.5 font-semibold text-navy-900">
                <ShieldCheck className="h-4 w-4 text-g-green" /> Verified Certificate
              </dd>
            </div>
          </dl>

          {revoked && cert.revokedAt && (
            <p className="mt-6 rounded-lg bg-g-red/10 p-3 text-center text-sm font-medium text-g-red">
              Revoked on {new Date(cert.revokedAt).toLocaleDateString('en-IN')}. The record is preserved for audit.
            </p>
          )}

          {!revoked && (
            <div className="mt-6 border-t border-navy-50 pt-6">
              <button onClick={handleDownload} disabled={downloading} className="btn-green w-full">
                {downloading ? 'downloading...' : 'Download Certificate PDF'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
