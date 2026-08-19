import type { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { EventModel, GoogleFormRegistration, Registration, SendingHistory, Student } from '../models';
import { connectDB } from '../config/db';
import { emailIsConfigured, getEmailConfigStatus } from '../utils/email';
import { env } from '../config/env';

const NAVY = '#0b1b33';
const GRAY = '#5f6b7a';

function getFromAddress(): string {
  const status = getEmailConfigStatus();
  if (status.hasFromEmail) return `GDGoC GCEE <${status.fromEmail}>`;
  return 'GDGoC GCEE <onboarding@resend.dev>';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// GET /api/admin/events/:eventId/registration-list
export async function generateRegistrationListPDF(req: any, res: Response) {
  try {
    await connectDB();
    const { eventId } = req.params;
    const event = await EventModel.findOne({ eventId }).lean();
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    // Collect registrations from both Google Form webhook and direct registration
    const [formRegs, directRegs] = await Promise.all([
      GoogleFormRegistration.find({ eventId: event._id }).sort({ submittedAt: -1 }).lean(),
      Registration.find({ eventId: event._id, status: 'REGISTERED' }).populate('studentId').lean(),
    ]);

    const students = [
      ...formRegs.map((r) => ({
        name: r.name || '—',
        email: r.email || '—',
        phone: r.phone || '—',
        department: r.department || '—',
        year: r.year || '—',
        college: r.college || '—',
        source: r.source || 'webhook',
        registeredAt: r.submittedAt,
      })),
      ...directRegs
        .filter((r) => r.studentId)
        .map((r) => {
          const s = r.studentId as any;
          return {
            name: s.name || '—',
            email: s.email || '—',
            phone: s.phone || '—',
            department: s.department || '—',
            year: s.year || '—',
            college: s.college || '—',
            source: 'app',
            registeredAt: r.registeredAt,
          };
        }),
    ];

    if (students.length === 0) {
      res.status(404).json({ success: false, message: 'No registrations found for this event.' });
      return;
    }

    // Generate PDF
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'portrait',
      margin: 40,
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const W = doc.page.width - 80;

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill(NAVY);
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#ffffff').text('GDGoC GCEE', 40, 20, { width: W });
    doc.font('Helvetica').fontSize(10).fillColor('#ffffff').text('Registration List', 40, 44, { width: W });
    doc.font('Helvetica').fontSize(9).fillColor('#aaaaaa').text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 40, 58, { width: W });

    // Event info
    let y = 100;
    doc.font('Helvetica-Bold').fontSize(14).fillColor(NAVY).text(event.title, 40, y, { width: W });
    y += 22;
    doc.font('Helvetica').fontSize(10).fillColor(GRAY);
    doc.text(`Date: ${event.date}  |  Venue: ${event.venue || 'TBA'}  |  Total: ${students.length} registrations`, 40, y, { width: W });
    y += 24;
    doc.moveTo(40, y).lineTo(40 + W, y).lineWidth(1).stroke(NAVY);
    y += 10;

    // Table header
    doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY);
    const cols = [
      { label: '#', x: 40, w: 30 },
      { label: 'Name', x: 70, w: 150 },
      { label: 'Email', x: 220, w: 160 },
      { label: 'Phone', x: 380, w: 90 },
      { label: 'Dept', x: 470, w: 80 },
    ];
    doc.text(cols[0].label, cols[0].x, y, { width: cols[0].w });
    doc.text(cols[1].label, cols[1].x, y, { width: cols[1].w });
    doc.text(cols[2].label, cols[2].x, y, { width: cols[2].w });
    doc.text(cols[3].label, cols[3].x, y, { width: cols[3].w });
    doc.text(cols[4].label, cols[4].x, y, { width: cols[4].w });
    y += 14;
    doc.moveTo(40, y).lineTo(40 + W, y).lineWidth(0.5).stroke(GRAY);
    y += 4;

    // Table rows
    doc.font('Helvetica').fontSize(7.5).fillColor('#333333');
    for (let i = 0; i < students.length; i++) {
      if (y > 760) {
        doc.addPage();
        y = 40;
        doc.font('Helvetica-Bold').fontSize(8).fillColor(NAVY);
        doc.text(cols[0].label, cols[0].x, y, { width: cols[0].w });
        doc.text(cols[1].label, cols[1].x, y, { width: cols[1].w });
        doc.text(cols[2].label, cols[2].x, y, { width: cols[2].w });
        doc.text(cols[3].label, cols[3].x, y, { width: cols[3].w });
        doc.text(cols[4].label, cols[4].x, y, { width: cols[4].w });
        y += 14;
        doc.moveTo(40, y).lineTo(40 + W, y).lineWidth(0.5).stroke(GRAY);
        y += 4;
        doc.font('Helvetica').fontSize(7.5).fillColor('#333333');
      }

      const row = students[i];
      doc.text(String(i + 1), cols[0].x, y, { width: cols[0].w });
      doc.text(row.name.substring(0, 30), cols[1].x, y, { width: cols[1].w, ellipsis: true });
      doc.text(row.email.substring(0, 30), cols[2].x, y, { width: cols[2].w, ellipsis: true });
      doc.text(row.phone.substring(0, 15), cols[3].x, y, { width: cols[3].w, ellipsis: true });
      doc.text(row.department.substring(0, 15), cols[4].x, y, { width: cols[4].w, ellipsis: true });
      y += 16;

      if (i % 2 === 0) {
        doc.rect(40, y - 16, W, 16).fill('#f8f9fa');
        doc.font('Helvetica').fontSize(7.5).fillColor('#333333');
      }
    }

    // Footer
    y += 10;
    if (y > 750) {
      doc.addPage();
      y = 40;
    }
    doc.moveTo(40, y).lineTo(40 + W, y).lineWidth(1).stroke(NAVY);
    y += 8;
    doc.font('Helvetica').fontSize(8).fillColor(GRAY);
    doc.text(`Total registrations: ${students.length}`, 40, y);
    doc.text('GDGoC GCEE — Government College of Engineering, Erode', 40, y + 14);

    doc.end();
    const pdfBuffer = await done;

    // Log to sending history
    await SendingHistory.create({
      eventId: event._id,
      eventType: 'registration-list-pdf',
      recipientEmail: 'admin',
      recipientName: 'Admin',
      subject: `Registration List — ${event.title}`,
      status: 'sent',
      sentAt: new Date(),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${eventId}-registrations.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('[eventDistribution] generateRegistrationListPDF error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/admin/events/:eventId/send-emails
export async function sendEventEmails(req: any, res: Response) {
  try {
    await connectDB();

    if (!emailIsConfigured()) {
      res.status(400).json({ success: false, message: 'Email service is not configured. Add a Resend API key.' });
      return;
    }

    const { eventId } = req.params;
    const event = await EventModel.findOne({ eventId }).lean();
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const { subject, message, type } = req.body;
    if (!subject || !message) {
      res.status(400).json({ success: false, message: 'Subject and message are required.' });
      return;
    }

    // Collect all registered student emails
    const [formRegs, directRegs] = await Promise.all([
      GoogleFormRegistration.find({ eventId: event._id, email: { $ne: '' } }).lean(),
      Registration.find({ eventId: event._id, status: 'REGISTERED' }).populate('studentId').lean(),
    ]);

    const emailMap = new Map<string, { name: string; email: string }>();

    for (const r of formRegs) {
      if (r.email) emailMap.set(r.email.toLowerCase(), { name: r.name || 'Student', email: r.email });
    }
    for (const r of directRegs) {
      const s = r.studentId as any;
      if (s?.email) emailMap.set(s.email.toLowerCase(), { name: s.name || 'Student', email: s.email });
    }

    if (emailMap.size === 0) {
      res.status(404).json({ success: false, message: 'No registered students with emails found for this event.' });
      return;
    }

    // Send emails individually (never to admin)
    const Resend = (await import('resend')).Resend;
    const resend = new Resend(env.resend.apiKey);
    const fromAddress = getFromAddress();

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const [, student] of emailMap) {
      const safeName = escapeHtml(student.name);
      const safeSubject = escapeHtml(subject);
      const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

      const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background:#0b1b33; padding: 18px 24px; color:#fff;">
          <h2 style="margin:0; font-size:18px;">GDGoC GCEE</h2>
        </div>
        <div style="padding: 24px;">
          <p style="margin-top:0; color:#374151;">Dear <strong>${safeName}</strong>,</p>
          <p style="color:#374151;">${safeMessage}</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
          <p style="color:#9aa5b1;font-size:12px;">${escapeHtml(event.title)} — ${event.date}</p>
          <p style="color:#9aa5b1;font-size:12px;">GDGoC GCEE · Government College of Engineering, Erode</p>
        </div>
      </div>`;

      try {
        const { data, error } = await resend.emails.send({
          from: fromAddress,
          to: student.email,
          subject: `[GDGoC GCEE] ${subject}`,
          html,
        });

        if (error) {
          failed++;
          errors.push(`${student.email}: ${error.message}`);
          await SendingHistory.create({
            eventId: event._id,
            eventType: type || 'event-email',
            recipientEmail: student.email,
            recipientName: student.name,
            subject,
            status: 'failed',
            errorMessage: error.message || 'Send failed',
            sentAt: new Date(),
          });
        } else {
          sent++;
          await SendingHistory.create({
            eventId: event._id,
            eventType: type || 'event-email',
            recipientEmail: student.email,
            recipientName: student.name,
            subject,
            status: 'sent',
            resendId: data?.id || '',
            sentAt: new Date(),
          });
        }
      } catch (err: any) {
        failed++;
        errors.push(`${student.email}: ${err.message}`);
        await SendingHistory.create({
          eventId: event._id,
          eventType: type || 'event-email',
          recipientEmail: student.email,
          recipientName: student.name,
          subject,
          status: 'failed',
          errorMessage: err.message,
          sentAt: new Date(),
        });
      }
    }

    res.json({
      success: true,
      message: `Emails sent: ${sent} successful, ${failed} failed out of ${emailMap.size} total.`,
      sent,
      failed,
      total: emailMap.size,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (err: any) {
    console.error('[eventDistribution] sendEventEmails error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/events/:eventId/sending-history
export async function getEventSendingHistory(req: any, res: Response) {
  try {
    await connectDB();
    const { eventId } = req.params;
    const event = await EventModel.findOne({ eventId }).lean();
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [items, total, stats] = await Promise.all([
      SendingHistory.find({ eventId: event._id }).sort({ sentAt: -1 }).skip(skip).limit(limit).lean(),
      SendingHistory.countDocuments({ eventId: event._id }),
      SendingHistory.aggregate([
        { $match: { eventId: event._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statsMap = new Map(stats.map((s) => [s._id, s.count]));

    res.json({
      success: true,
      history: items.map((h) => ({
        _id: h._id,
        eventType: h.eventType,
        recipientEmail: h.recipientEmail,
        recipientName: h.recipientName,
        subject: h.subject,
        status: h.status,
        errorMessage: h.errorMessage,
        sentAt: h.sentAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        sent: statsMap.get('sent') || 0,
        failed: statsMap.get('failed') || 0,
        pending: statsMap.get('pending') || 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
