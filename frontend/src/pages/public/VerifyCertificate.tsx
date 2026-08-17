import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, ShieldX, CheckCircle2, Download, QrCode, FileText } from 'lucide-react';
import { PageLoader } from '../../components/ui/Spinner';
import { api, getErrorMessage, downloadPdf } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { Certificate } from '../../types';

export default function VerifyCertificate() {
  const { certificateId } = useParams();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 pt-16">
        <PageLoader label="Verifying certificate…" />
      </div>
    );
  }

  if (notFound || !cert) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 px-4 pt-16">
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

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20">
      <div className="container-x max-w-3xl">
        {/* Status banner */}
        <div
          className={cn(
            'flex items-center gap-4 rounded-2xl border p-5',
            revoked ? 'border-g-red/30 bg-g-red/10' : 'border-g-green/30 bg-g-green/10'
          )}
        >
          {revoked ? (
            <ShieldX className="h-10 w-10 shrink-0 text-g-red" />
          ) : (
            <ShieldCheck className="h-10 w-10 shrink-0 text-g-green" />
          )}
          <div>
            <h1 className={cn('font-display text-xl font-bold sm:text-2xl', revoked ? 'text-g-red' : 'text-green-700')}>
              {revoked ? 'Certificate Revoked' : 'Certificate Verified'}
            </h1>
            <p className="mt-0.5 text-sm text-ink-soft">
              {revoked
                ? 'This certificate is no longer valid.'
                : 'This certificate is authentic and issued by GDGoC GCEE.'}
            </p>
          </div>
          <span
            className={cn(
              'ml-auto hidden rounded-full px-3 py-1 text-xs font-bold tracking-wider sm:block',
              revoked ? 'bg-g-red text-white' : 'bg-green-600 text-white'
            )}
          >
            {cert.status}
          </span>
        </div>

        {/* Certificate card */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-lift">
          <div className="bg-gradient-to-br from-navy-900 to-navy-700 p-8 text-white sm:p-10">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row">
              <div>
                <p className="font-display text-xl font-bold">GDGoC GCEE</p>
                <p className="text-xs text-white/70">Google Developer Groups on Campus</p>
                <p className="text-xs text-white/70">Government College of Engineering, Erode</p>
              </div>
              <div className="hidden h-20 w-20 rounded-lg bg-white p-1.5 sm:block">
                {cert.qrCode ? (
                  <img src={cert.qrCode} alt="QR code" className="h-full w-full" />
                ) : (
                  <QrCode className="h-full w-full text-navy-900" />
                )}
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-lg font-bold tracking-widest text-g-blue">CERTIFICATE OF PARTICIPATION</p>
              <p className="mt-5 text-sm text-white/60">This certificate is proudly presented to</p>
              <p className="mt-1 font-display text-3xl font-bold text-white">{cert.studentName}</p>
            </div>
          </div>

          {/* Details */}
          <div className="p-8">
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Detail label="Certificate ID" value={cert.certificateId} mono />
              <Detail label="Status" value={cert.status} />
              <Detail label="Organization" value={cert.organization} />
              <Detail label="Institution" value={cert.institution} />
              <Detail label="Participation Period" value={`${cert.firstEligibleEventDateLabel} – ${cert.lastEligibleEventDateLabel}`} />
              <Detail label="Events Attended" value={`${cert.eventsAttended}`} />
              <Detail label="Attendance" value={`${cert.attendancePercentage}%`} />
              <Detail label="Issued On" value={cert.issueDateLabel} />
            </dl>

            {revoked && cert.revokedAt && (
              <p className="mt-6 rounded-lg bg-g-red/10 p-3 text-center text-sm font-medium text-g-red">
                Revoked on {new Date(cert.revokedAt).toLocaleDateString('en-IN')}. The record is preserved for audit.
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 border-t border-navy-50 pt-6 sm:flex-row">
              <Link to="/certificates" className="btn-outline flex-1">
                <FileText className="h-4 w-4" /> About certificates
              </Link>
              {!revoked && (
                <button onClick={() => downloadPdf(cert.certificateId)} className="btn-green flex-1">
                  <Download className="h-4 w-4" /> Download PDF
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">
          <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
          This is a GDGoC GCEE community participation certificate. It is not an official Google certification.
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className={cn('mt-1 text-sm font-semibold text-navy-900', mono && 'font-mono')}>{value}</dd>
    </div>
  );
}
