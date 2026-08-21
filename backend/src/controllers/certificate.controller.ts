import type { Response } from 'express';
import { Certificate } from '../models/Certificate';
import { CertificateCampaign } from '../models/CertificateCampaign';
import type { AuthRequest } from '../middleware/auth';
import { formatDotDate, todayIST } from '../utils/dates';
import { generateCertificatePDF } from '../utils/pdf';
import { connectDB } from '../config/db';

const PDF_MIME = 'application/pdf';

/** Public-safe certificate view — never expose sensitive fields. */
function publicView(cert: any) {
  return {
    certificateId: cert.certificateId,
    studentName: cert.studentName,
    organization: cert.organization,
    institution: cert.institution,
    eventDate: cert.eventDate || '',
    eventName: cert.eventName || '',
    eventDateLabel: formatDotDate(cert.eventDate || ''),
    issueDate: cert.issueDate,
    issueDateLabel: formatDotDate(cert.issueDate),
    participationStatus: cert.participationStatus || 'PARTICIPATED',
    issuedBy: cert.issuedBy || 'admin',
    status: cert.status,
    revokedAt: cert.revokedAt,
    campaignName: cert.campaignName || '',
    qrCode: cert.qrCode || '',
  };
}

// GET /api/certificates/verify/:certificateId  (public)
export async function verifyCertificate(req: any, res: Response) {
  try {
    await connectDB();

    const cert = await Certificate.findOne({ certificateId: req.params.certificateId }).lean();
    if (!cert) {
      res.status(404).json({ success: false, message: 'Certificate not found.' });
      return;
    }

    const campaign = await CertificateCampaign.findById(cert.campaignId).select('name').lean();
    res.json({
      success: true,
      certificate: publicView({ ...cert, campaignName: campaign?.name || '' }),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/certificates/:certificateId/download  (public)
export async function downloadCertificate(req: any, res: Response) {
  try {
    await connectDB();

    const cert = await Certificate.findOne({ certificateId: req.params.certificateId }).lean();
    if (!cert) {
      res.status(404).json({ success: false, message: 'Certificate not found.' });
      return;
    }
    if (cert.status === 'REVOKED') {
      res.status(403).json({ success: false, message: 'This certificate has been revoked and cannot be downloaded.' });
      return;
    }

    // Serve the stored PDF buffer (generated once during certificate creation).
    if (cert.pdfBuffer) {
      res.setHeader('Content-Type', PDF_MIME);
      res.setHeader('Content-Disposition', `attachment; filename="${cert.certificateId}.pdf"`);
      res.send(Buffer.from(cert.pdfBuffer));
      return;
    }

    // Fallback: regenerate if pdfBuffer is missing (backward compat with old certificates).
    const pdf = await generateCertificatePDF({
      certificateId: cert.certificateId,
      studentName: cert.studentName,
      eventName: cert.eventName || '',
      eventDate: cert.eventDate || '',
      issueDate: cert.issueDate,
      qrCodeDataURL: cert.qrCode,
      verificationUrl: cert.verificationUrl,
    });

    res.setHeader('Content-Type', PDF_MIME);
    res.setHeader('Content-Disposition', `attachment; filename="${cert.certificateId}.pdf"`);
    res.send(pdf);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/certificates/my  (student)
export async function myCertificates(req: AuthRequest, res: Response) {
  try {
    await connectDB();

    const certs = await Certificate.find({ studentId: req.studentId }).sort({ createdAt: -1 }).lean();
    const campaigns = await CertificateCampaign.find({ _id: { $in: certs.map((c) => c.campaignId) } }).select('name').lean();
    const campMap = new Map(campaigns.map((c) => [String(c._id), c.name]));

    res.json({
      success: true,
      certificates: certs.map((c) => publicView({ ...c, campaignName: campMap.get(String(c.campaignId)) || '' })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/certificates
export async function adminListCertificates(req: any, res: Response) {
  try {
    await connectDB();

    const { status, campaignId } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (campaignId) filter.campaignId = campaignId;

    const certs = await Certificate.find(filter).sort({ createdAt: -1 }).limit(2000).lean();
    const campaigns = await CertificateCampaign.find({ _id: { $in: [...new Set(certs.map((c) => c.campaignId))] } }).select('name').lean();
    const campMap = new Map(campaigns.map((c) => [String(c._id), c.name]));

    res.json({
      success: true,
      certificates: certs.map((c) => ({
        certificateId: c.certificateId,
        studentName: c.studentName,
        studentEmail: c.studentEmail,
        campaignName: campMap.get(String(c.campaignId)) || '',
        campaignId: c.campaignId,
        eventName: c.eventName || '',
        eventDate: c.eventDate || '',
        eventDateLabel: formatDotDate(c.eventDate || ''),
        issueDate: c.issueDate,
        status: c.status,
        revokedAt: c.revokedAt,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/admin/certificates/:certificateId/revoke
export async function revokeCertificate(req: any, res: Response) {
  try {
    await connectDB();

    const cert = await Certificate.findOne({ certificateId: req.params.certificateId });
    if (!cert) {
      res.status(404).json({ success: false, message: 'Certificate not found.' });
      return;
    }
    if (cert.status === 'REVOKED') {
      res.status(400).json({ success: false, message: 'Certificate is already revoked.' });
      return;
    }

    cert.status = 'REVOKED';
    cert.revokedAt = new Date();
    cert.revokedBy = `admin:${req.adminId}`;
    cert.revokeReason = req.body.reason || 'Revoked by administrator';
    await cert.save();

    res.json({ success: true, message: 'Certificate revoked. History is preserved for audit.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/admin/certificates/:certificateId/restore
export async function restoreCertificate(req: any, res: Response) {
  try {
    await connectDB();

    const cert = await Certificate.findOne({ certificateId: req.params.certificateId });
    if (!cert) {
      res.status(404).json({ success: false, message: 'Certificate not found.' });
      return;
    }
    cert.status = 'VALID';
    cert.revokedAt = null;
    cert.revokeReason = '';
    await cert.save();
    res.json({ success: true, message: 'Certificate restored to VALID.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/certificates/stats
export async function adminCertificateStats(_: any, res: Response) {
  try {
    await connectDB();

    const [total, valid, revoked] = await Promise.all([
      Certificate.countDocuments(),
      Certificate.countDocuments({ status: 'VALID' }),
      Certificate.countDocuments({ status: 'REVOKED' }),
    ]);

    const byStatus = await Certificate.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: { total, valid, revoked },
      byStatus,
      issueDate: todayIST(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
