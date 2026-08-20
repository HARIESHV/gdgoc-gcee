import type { Response } from 'express';
import { EventModel, Registration, Attendance, Certificate, Member, Student } from '../models';
import { todayIST } from '../utils/dates';
import { connectDB } from '../config/db';
import { sendContactEmail, emailIsConfigured, getEmailConfigStatus } from '../utils/email';

// GET /api/stats  (public — homepage)
export async function publicStats(_: any, res: Response) {
  try {
    await connectDB();
    const today = todayIST();

    const [
      totalEvents,
      upcomingEvents,
      workshops,
      hackathons,
      totalStudents,
      members,
      attendanceRecords,
      certificates,
      totalRegistrations,
    ] = await Promise.all([
      EventModel.countDocuments(),
      EventModel.countDocuments({ status: { $ne: 'CANCELLED' }, date: { $gte: today } }),
      EventModel.countDocuments({ category: 'Workshop' }),
      EventModel.countDocuments({ category: 'Hackathon' }),
      Student.countDocuments({ isActive: true }),
      Member.countDocuments({ isActive: true }),
      Attendance.countDocuments({ status: 'PRESENT' }),
      Certificate.countDocuments({ status: 'VALID' }),
      Registration.countDocuments({ status: 'REGISTERED' }),
    ]);

    res.json({
      success: true,
      stats: {
        totalEvents,
        upcomingEvents,
        workshops,
        hackathons,
        totalStudents,
        members,
        attendanceRecords,
        certificates,
        totalRegistrations,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/email-status  (public — diagnostic, no secrets exposed)
export async function emailStatus(_req: any, res: Response) {
  try {
    const status = getEmailConfigStatus();
    res.json({ success: true, ...status });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/contact
export async function contactForm(req: any, res: Response) {
  try {
    await connectDB();
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      res.status(400).json({ success: false, message: 'Name, email, subject and message are required.' });
      return;
    }

    if (typeof name !== 'string' || name.length < 2 || name.length > 200) {
      res.status(400).json({ success: false, message: 'Name must be between 2 and 200 characters.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    if (typeof subject !== 'string' || subject.trim().length < 3 || subject.length > 200) {
      res.status(400).json({ success: false, message: 'Subject must be between 3 and 200 characters.' });
      return;
    }

    if (typeof message !== 'string' || message.length < 10 || message.length > 5000) {
      res.status(400).json({ success: false, message: 'Message must be between 10 and 5000 characters.' });
      return;
    }

    if (!emailIsConfigured()) {
      const status = getEmailConfigStatus();
      const missing = [
        !status.hasApiKey ? 'GMAIL_USER / GMAIL_APP_PASSWORD' : null,
        !status.hasFromEmail ? 'GMAIL_USER' : null,
      ].filter(Boolean);
      console.error(`[contact] Email not configured. Missing env vars: ${missing.join(', ') || 'unknown'}`);
      res.status(503).json({
        success: false,
        message: `Email service is not configured. Missing: ${missing.join(', ') || 'check server environment'}. Please contact the administrator.`,
      });
      return;
    }

    const sanitizedSubject = subject.trim();

    await sendContactEmail({
      fromName: name.trim(),
      fromEmail: email.trim().toLowerCase(),
      subject: sanitizedSubject,
      message: message.trim(),
    });

    res.json({ success: true, message: 'Message sent successfully. We will get back to you soon.' });
  } catch (err: any) {
    console.error('[contact] Failed to send contact email:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send your message. Please try again later.' });
  }
}
