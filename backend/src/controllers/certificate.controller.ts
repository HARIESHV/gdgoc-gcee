import type { Response } from 'express';
import { Certificate, EventModel, Student, GoogleFormRegistration, Registration } from '../models';
import type { AuthRequest } from '../middleware/auth';
import { formatDotDate, todayIST } from '../utils/dates';
import { generateCertificatePDF } from '../utils/pdf';
import { generateQRCodeDataURL } from '../utils/qr';
import { nextCertificateId } from '../utils/ids';
import { env } from '../config/env';
import { connectDB } from '../config/db';

const PDF_MIME = 'application/pdf';

/** Public-safe certificate view */
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
    status: cert.status,
    revokedAt: cert.revokedAt,
    campaignName: cert.campaignName || cert.eventName || '',
    qrCode: cert.qrCode || '',
  };
}

// GET /api/certificates/verify/:certificateId (public)
export async function verifyCertificate(req: any, res: Response) {
  try {
    await connectDB();
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId }).lean();
    if (!cert) {
      res.status(404).json({ success: false, message: 'Certificate not found.' });
      return;
    }

    res.json({
      success: true,
      certificate: publicView(cert),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/certificates/:certificateId/download (public)
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

    let pdf: Buffer | null = null;

    if (cert.pdfBuffer) {
      if (Buffer.isBuffer(cert.pdfBuffer)) {
        pdf = cert.pdfBuffer;
      } else if ((cert.pdfBuffer as any).buffer) {
        pdf = Buffer.from((cert.pdfBuffer as any).buffer);
      } else if ((cert.pdfBuffer as any).data) {
        pdf = Buffer.from((cert.pdfBuffer as any).data);
      }
    }

    if (!pdf) {
      // Regenerate using official certificate design if buffer missing or invalid
      pdf = await generateCertificatePDF({
        certificateId: cert.certificateId,
        studentName: cert.studentName,
        eventName: cert.eventName || 'GDGoC GCEE Event',
        eventDate: cert.eventDate || todayIST(),
        issueDate: cert.issueDate || todayIST(),
        qrCodeDataURL: cert.qrCode || '',
        verificationUrl: cert.verificationUrl || `${env.appUrl}/certificate/${cert.certificateId}`,
      });
    }

    res.setHeader('Content-Type', PDF_MIME);
    res.setHeader('Content-Disposition', `attachment; filename="${cert.certificateId}.pdf"`);
    res.send(pdf);
  } catch (err: any) {
    console.error('[downloadCertificate error]:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/certificates/my (student)
export async function myCertificates(req: AuthRequest, res: Response) {
  try {
    await connectDB();
    const certs = await Certificate.find({ studentId: req.studentId }).sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      certificates: certs.map((c) => publicView(c)),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/certificates
export async function adminListCertificates(req: any, res: Response) {
  try {
    await connectDB();
    const { status } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const certs = await Certificate.find(filter).sort({ createdAt: -1 }).limit(2000).lean();

    res.json({
      success: true,
      certificates: certs.map((c) => ({
        certificateId: c.certificateId,
        studentName: c.studentName,
        studentEmail: c.studentEmail,
        campaignName: c.eventName || 'GDGoC GCEE Event',
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

// POST /api/admin/certificates/generate
export async function generateEventCertificates(req: any, res: Response) {
  try {
    await connectDB();
    const { eventId, eventName, eventDate, recipientGroup, studentIds } = req.body;

    if (!eventName || !eventName.trim() || !eventDate || !eventDate.trim()) {
      res.status(400).json({ success: false, message: 'Event Name and Event Date are required.' });
      return;
    }

    const trimmedEventName = eventName.trim();
    const trimmedEventDate = eventDate.trim();

    let targetStudents: Array<{ id: any; name: string; email: string }> = [];

    if (recipientGroup === 'specific' && Array.isArray(studentIds) && studentIds.length > 0) {
      const dbStudents = await Student.find({ _id: { $in: studentIds } }).lean();
      targetStudents = dbStudents.map((s) => ({ id: s._id, name: s.name, email: s.email }));
    } else if (eventId && recipientGroup !== 'all') {
      // Query both Registration (App) and GoogleFormRegistration (Form)
      const [appRegs, formRegs] = await Promise.all([
        Registration.find({ eventId, status: 'REGISTERED' }).populate('studentId').lean(),
        GoogleFormRegistration.find({ eventId }).lean(),
      ]);

      const studentMap = new Map<string, { id: any; name: string; email: string }>();

      // 1. App registrations
      for (const ar of appRegs) {
        if (ar.studentId && (ar.studentId as any).email) {
          const st = ar.studentId as any;
          studentMap.set(st.email.toLowerCase(), { id: st._id, name: st.name, email: st.email });
        }
      }

      // 2. Form registrations
      for (const fr of formRegs) {
        const normEmail = fr.email.toLowerCase().trim();
        if (normEmail && !studentMap.has(normEmail)) {
          let stub = await Student.findOne({ email: normEmail });
          if (!stub) {
            stub = await Student.create({
              name: fr.name || 'Student',
              email: normEmail,
              phone: fr.phone || '',
              department: fr.department || '',
              year: fr.year || '',
              college: fr.college || 'Government College of Engineering, Erode',
              passwordHash: 'GENERATED_CERTIFICATE_STUB',
            });
          }
          studentMap.set(normEmail, { id: stub._id, name: stub.name, email: stub.email });
        }
      }

      targetStudents = Array.from(studentMap.values());

      // Fallback: if no registrations found for this event, query all active students
      if (targetStudents.length === 0) {
        const dbStudents = await Student.find({ isActive: true }).lean();
        targetStudents = dbStudents.map((s) => ({ id: s._id, name: s.name, email: s.email }));
      }
    } else {
      // All active students
      const dbStudents = await Student.find({ isActive: true }).lean();
      targetStudents = dbStudents.map((s) => ({ id: s._id, name: s.name, email: s.email }));
    }

    if (targetStudents.length === 0) {
      res.status(400).json({ success: false, message: 'No eligible recipients found to generate certificates.' });
      return;
    }

    let generatedCount = 0;
    const skipped: string[] = [];

    for (const student of targetStudents) {
      try {
        // Check duplicate
        const exists = await Certificate.exists({
          studentId: student.id,
          eventName: trimmedEventName,
          status: 'VALID',
        });

        if (exists) {
          skipped.push(student.name);
          continue;
        }

        const certificateId = await nextCertificateId();
        const verificationUrl = `${env.appUrl}/certificate/${certificateId}`;
        const qrCode = await generateQRCodeDataURL(verificationUrl);
        const issueDate = todayIST();

        const pdfBuffer = await generateCertificatePDF({
          certificateId,
          studentName: student.name,
          eventName: trimmedEventName,
          eventDate: trimmedEventDate,
          issueDate,
          qrCodeDataURL: qrCode,
          verificationUrl,
        });

        await Certificate.create({
          certificateId,
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          organization: 'GDGoC GCEE',
          institution: 'Government College of Engineering, Erode',
          eventId: eventId || null,
          eventName: trimmedEventName,
          eventDate: trimmedEventDate,
          issueDate,
          verificationUrl,
          qrCode,
          pdfBuffer,
          status: 'VALID',
        });

        generatedCount++;
      } catch (itemErr: any) {
        console.error(`[generateEventCertificates] Error issuing for ${student.email}:`, itemErr.message);
      }
    }

    if (generatedCount === 0 && skipped.length > 0) {
      res.json({
        success: true,
        message: `All ${skipped.length} student(s) already have certificates issued for "${trimmedEventName}".`,
        generatedCount: 0,
        skippedCount: skipped.length,
      });
      return;
    }

    res.json({
      success: true,
      message: `Successfully generated ${generatedCount} certificate(s).${skipped.length > 0 ? ` (${skipped.length} already exist)` : ''}`,
      generatedCount,
      skippedCount: skipped.length,
    });
  } catch (err: any) {
    console.error('[generateEventCertificates error]:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to generate certificates.' });
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
    cert.status = 'REVOKED';
    cert.revokedAt = new Date();
    cert.revokedBy = `admin:${req.adminId}`;
    cert.revokeReason = req.body.reason || 'Revoked by administrator';
    await cert.save();
    res.json({ success: true, message: 'Certificate revoked.' });
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

    res.json({
      success: true,
      stats: { total, valid, revoked },
      issueDate: todayIST(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
