import type { Response } from 'express';
import { EventModel, Registration, Attendance, Certificate, Member, Student, ContactMessage } from '../models';
import { todayIST } from '../utils/dates';
import { env } from '../config/env';
import { emailIsConfigured } from '../utils/email';
import { connectDB } from '../config/db';

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

// POST /api/contact
export async function contactForm(req: any, res: Response) {
  try {
    await connectDB();
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      res.status(400).json({ success: false, message: 'Name, email and message are required.' });
      return;
    }

    await ContactMessage.create({ name, email, subject: subject || 'General Inquiry', message });

    if (emailIsConfigured()) {
      const { sendContactEmail } = await import('../utils/email');
      sendContactEmail({
        to: env.email.from.split('<')[1]?.replace('>', '') || 'admin@gdgocgcee.in',
        fromName: name,
        fromEmail: email,
        message,
      });
    }

    res.json({ success: true, message: 'Thank you! We will get back to you soon.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
