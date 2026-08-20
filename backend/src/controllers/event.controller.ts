import type { Response } from 'express';
import mongoose from 'mongoose';
import { EventModel, Registration, GoogleFormRegistration, Student } from '../models';
import type { AuthRequest } from '../middleware/auth';
import { nextEventId } from '../utils/ids';
import { todayIST, isDateBefore } from '../utils/dates';
import { connectDB } from '../config/db';
import { sendBulkEventAnnouncement } from '../services/email.service';

export function eventQuery(identifier: string) {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return { _id: identifier };
  }
  return { eventId: identifier };
}

function isValidGoogleFormUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'docs.google.com' &&
      parsed.pathname.includes('/forms/')
    );
  } catch {
    return false;
  }
}

export function serializeEvent(event: any) {
  const today = todayIST();
  let effectiveStatus = event.status;
  if (event.status !== 'CANCELLED') {
    if (isDateBefore(event.date, today)) effectiveStatus = 'COMPLETED';
    else if (event.date === today) effectiveStatus = 'ONGOING';
    else effectiveStatus = 'UPCOMING';
  }
  return {
    _id: event._id,
    eventId: event.eventId,
    title: event.title,
    description: event.description,
    shortDescription: event.shortDescription,
    banner: event.banner,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    venue: event.venue,
    speaker: event.speaker,
    speakerBio: event.speakerBio,
    category: event.category,
    technologies: event.technologies,
    registrationEnabled: event.registrationEnabled,
    registrationDeadline: event.registrationDeadline,
    capacity: event.capacity,
    googleFormUrl: event.googleFormUrl || '',
    registrationLink: event.registrationLink || '',
    manualRegistrationCount: event.manualRegistrationCount || 0,
    isCertificateEligible: event.isCertificateEligible,
    isInauguration: event.isInauguration,
    emailSent: event.emailSent || false,
    emailSentAt: event.emailSentAt || null,
    emailSentCount: event.emailSentCount || 0,
    emailFailedCount: event.emailFailedCount || 0,
    status: event.status,
    effectiveStatus,
    registeredCount: event.registeredCount ?? 0,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

// GET /api/events  (public)
export async function listEvents(req: AuthRequest, res: Response) {
  try {
    await connectDB();

    const { category, status, q, limit } = req.query;
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (status) filter.status = status;

    const today = todayIST();
    if (status === 'UPCOMING') {
      filter.date = { $gte: today };
      delete filter.status;
    } else if (status === 'COMPLETED') {
      filter.date = { $lte: today };
      delete filter.status;
    }

    if (q) {
      filter.$or = [
        { title: { $regex: String(q), $options: 'i' } },
        { description: { $regex: String(q), $options: 'i' } },
        { speaker: { $regex: String(q), $options: 'i' } },
      ];
    }

    const events = await EventModel.find(filter)
      .sort({ date: 1, startTime: 1 })
      .limit(Number(limit) || 100)
      .lean();

    const ids = events.map((e) => e._id);
    const regCounts = await Registration.aggregate([
      { $match: { eventId: { $in: ids }, status: 'REGISTERED' } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(regCounts.map((r) => [String(r._id), r.count]));

    res.json({
      success: true,
      events: events.map((e) => serializeEvent({ ...e, registeredCount: countMap.get(String(e._id)) || 0 })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/events/:eventId  (public)
export async function getEvent(req: AuthRequest, res: Response) {
  try {
    await connectDB();

    const event = await EventModel.findOne(eventQuery(req.params.eventId)).lean();

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const registeredCount = await Registration.countDocuments({ eventId: event._id, status: 'REGISTERED' });

    let isRegistered = false;
    if (req.studentId) {
      isRegistered = (await Registration.countDocuments({ eventId: event._id, studentId: req.studentId, status: 'REGISTERED' })) > 0;
    }

    res.json({
      success: true,
      event: serializeEvent({ ...event, registeredCount }),
      isRegistered,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/events/:eventId/register-public  (student registration form)
export async function registerPublicEvent(req: any, res: Response) {
  try {
    await connectDB();

    const event = await EventModel.findOne(eventQuery(req.params.eventId));
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    if (!event.registrationEnabled) {
      res.status(400).json({ success: false, message: 'Registration for this event is currently closed.' });
      return;
    }

    const { name, email, phone, college, department, year, rollNumber } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Full name is required.' });
      return;
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      res.status(400).json({ success: false, message: 'A valid student email address is required.' });
      return;
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 7) {
      res.status(400).json({ success: false, message: 'A valid contact phone number is required.' });
      return;
    }

    if (!department || typeof department !== 'string' || !department.trim()) {
      res.status(400).json({ success: false, message: 'Department is required.' });
      return;
    }

    if (!year || typeof year !== 'string' || !year.trim()) {
      res.status(400).json({ success: false, message: 'Year of study is required.' });
      return;
    }

    // Duplicate check
    const existing = await GoogleFormRegistration.findOne({
      eventId: event._id,
      email: cleanEmail,
    }).lean();

    if (existing) {
      res.status(400).json({
        success: false,
        message: 'This email is already registered for this event.',
        registrationId: existing.responseId,
      });
      return;
    }

    if (event.capacity > 0) {
      const currentCount = await GoogleFormRegistration.countDocuments({ eventId: event._id });
      if (currentCount >= event.capacity) {
        res.status(400).json({ success: false, message: 'This event has reached maximum capacity.' });
        return;
      }
    }

    const registrationId = `REG-${event.eventId.toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const reg = await GoogleFormRegistration.create({
      responseId: registrationId,
      eventId: event._id,
      formData: {
        'Full Name': name.trim(),
        'Email Address': cleanEmail,
        'Phone Number': phone.trim(),
        'College / Institution': (college || 'Government College of Engineering, Erode').trim(),
        'Department': department.trim(),
        'Year of Study': year.trim(),
        'Roll Number / Student ID': (rollNumber || '').trim(),
        'Event ID': event.eventId,
        'Event Name': event.title,
      },
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      rollNumber: (rollNumber || '').trim(),
      department: department.trim(),
      year: year.trim(),
      college: (college || 'Government College of Engineering, Erode').trim(),
      source: 'manual',
      submittedAt: new Date(),
    });

    // Send confirmation email ONLY to the student's email address (never to admin)
    try {
      const { sendEventRegistrationConfirmationEmail } = await import('../utils/email.js');
      await sendEventRegistrationConfirmationEmail({
        to: cleanEmail,
        studentName: name.trim(),
        eventName: event.title,
        eventDate: event.date,
        eventTime: event.startTime ? `${event.startTime} - ${event.endTime || 'TBA'}` : undefined,
        venue: event.venue,
        registrationId,
        instructions: event.description ? event.description.slice(0, 300) : undefined,
      });
    } catch (emailErr) {
      console.error('[registerPublicEvent] Confirmation email delivery failed:', emailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Confirmation email sent to your email address.',
      registrationId,
      event: {
        eventId: event.eventId,
        title: event.title,
        date: event.date,
        venue: event.venue,
      },
    });
  } catch (err: any) {
    console.error('[registerPublicEvent] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/events/:eventId/register  (logged-in student)
export async function registerForEvent(req: AuthRequest, res: Response) {
  try {
    await connectDB();

    const event = await EventModel.findOne(eventQuery(req.params.eventId));
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    if (!event.registrationEnabled) {
      res.status(400).json({ success: false, message: 'Registration for this event is closed.' });
      return;
    }

    const today = todayIST();
    if (event.registrationDeadline && event.registrationDeadline < today) {
      res.status(400).json({ success: false, message: 'The registration deadline has passed.' });
      return;
    }

    if (event.capacity > 0) {
      const count = await Registration.countDocuments({ eventId: event._id, status: 'REGISTERED' });
      if (count >= event.capacity) {
        res.status(400).json({ success: false, message: 'This event has reached its maximum capacity.' });
        return;
      }
    }

    const existing = await Registration.findOne({ studentId: req.studentId, eventId: event._id });
    if (existing) {
      if (existing.status === 'CANCELLED') {
        existing.status = 'REGISTERED';
        existing.registeredAt = new Date();
        await existing.save();
        res.json({ success: true, message: 'Registration restored. You are registered again!' });
        return;
      }
      res.status(400).json({ success: false, message: 'You are already registered for this event.' });
      return;
    }

    const reg = await Registration.create({ studentId: req.studentId, eventId: event._id, status: 'REGISTERED' });
    const regId = `REG-${event.eventId.toUpperCase()}-${String(reg._id).slice(-6).toUpperCase()}`;

    // Get student info to send confirmation email to student ONLY
    const { Student } = await import('../models/index.js');
    const student = await Student.findById(req.studentId).lean();
    if (student && student.email) {
      try {
        const { sendEventRegistrationConfirmationEmail } = await import('../utils/email.js');
        await sendEventRegistrationConfirmationEmail({
          to: student.email,
          studentName: student.name,
          eventName: event.title,
          eventDate: event.date,
          eventTime: event.startTime ? `${event.startTime} - ${event.endTime || 'TBA'}` : undefined,
          venue: event.venue,
          registrationId: regId,
          instructions: event.description ? event.description.slice(0, 300) : undefined,
        });
      } catch (e) {
        console.error('[registerForEvent] Email confirmation error:', e);
      }
    }

    res.status(201).json({
      success: true,
      message: 'You are registered for this event. Confirmation email has been sent!',
      registrationId: regId,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(400).json({ success: false, message: 'You are already registered for this event.' });
      return;
    }
    res.status(500).json({ success: false, message: err.message });
  }
}


// DELETE /api/events/:eventId/register  (student)
export async function unregisterFromEvent(req: AuthRequest, res: Response) {
  try {
    await connectDB();

    const event = await EventModel.findOne(eventQuery(req.params.eventId));
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }
    const today = todayIST();
    if (event.date < today) {
      res.status(400).json({ success: false, message: 'Cannot cancel registration after the event date.' });
      return;
    }

    const updated = await Registration.findOneAndUpdate(
      { studentId: req.studentId, eventId: event._id },
      { status: 'CANCELLED' },
      { new: true }
    );
    if (!updated) {
      res.status(400).json({ success: false, message: 'You are not registered for this event.' });
      return;
    }
    res.json({ success: true, message: 'Registration cancelled.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/events/my/registered  (student)
export async function myEvents(req: AuthRequest, res: Response) {
  try {
    await connectDB();

    const registrations = await Registration.find({ studentId: req.studentId, status: 'REGISTERED' })
      .populate('eventId')
      .sort({ registeredAt: -1 })
      .lean();

    const events = registrations
      .filter((r) => r.eventId)
      .map((r) => serializeEvent(r.eventId));

    res.json({ success: true, events });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ---------- ADMIN ----------

// GET /api/admin/events
export async function adminListEvents(_: any, res: Response) {
  try {
    await connectDB();

    const events = await EventModel.find().sort({ date: -1 }).lean();
    const ids = events.map((e) => e._id);
    const regCounts = await Registration.aggregate([
      { $match: { eventId: { $in: ids }, status: 'REGISTERED' } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(regCounts.map((r) => [String(r._id), r.count]));
    res.json({
      success: true,
      events: events.map((e) => serializeEvent({ ...e, registeredCount: countMap.get(String(e._id)) || 0 })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/events/:eventId
export async function adminGetEvent(req: any, res: Response) {
  try {
    await connectDB();

    const event = await EventModel.findOne(eventQuery(req.params.eventId)).lean();
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }
    const registeredCount = await Registration.countDocuments({ eventId: event._id, status: 'REGISTERED' });
    res.json({ success: true, event: serializeEvent({ ...event, registeredCount }) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/admin/events
export async function adminCreateEvent(req: any, res: Response) {
  try {
    await connectDB();

    const { title, date } = req.body;
    if (!title || !date) {
      res.status(400).json({ success: false, message: 'Title and date are required.' });
      return;
    }

    if (req.body.googleFormUrl && !isValidGoogleFormUrl(req.body.googleFormUrl)) {
      res.status(400).json({ success: false, message: 'Invalid Google Form URL. Must be a valid docs.google.com/forms/ link.' });
      return;
    }

    const eventId = await nextEventId();
    const event = await EventModel.create({
      eventId,
      title,
      description: req.body.description || '',
      shortDescription: req.body.shortDescription || '',
      banner: req.body.banner || '',
      date,
      startTime: req.body.startTime || '',
      endTime: req.body.endTime || '',
      venue: req.body.venue || '',
      speaker: req.body.speaker || '',
      speakerBio: req.body.speakerBio || '',
      category: req.body.category || 'Workshop',
      technologies: req.body.technologies || [],
      registrationEnabled: req.body.registrationEnabled ?? true,
      registrationDeadline: req.body.registrationDeadline || '',
      capacity: Number(req.body.capacity) || 0,
      googleFormUrl: req.body.googleFormUrl || '',
      registrationLink: req.body.registrationLink || '',
      manualRegistrationCount: Number(req.body.manualRegistrationCount) || 0,
      isCertificateEligible: Boolean(req.body.isCertificateEligible),
      isInauguration: Boolean(req.body.isInauguration),
      status: req.body.status || 'UPCOMING',
    });

    res.status(201).json({ success: true, message: 'Event created successfully.', event: serializeEvent(event) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/admin/events/:eventId
export async function adminUpdateEvent(req: any, res: Response) {
  try {
    await connectDB();

    const existing = await EventModel.findOne(eventQuery(req.params.eventId));
    if (!existing) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    if (req.body.googleFormUrl && !isValidGoogleFormUrl(req.body.googleFormUrl)) {
      res.status(400).json({ success: false, message: 'Invalid Google Form URL. Must be a valid docs.google.com/forms/ link.' });
      return;
    }

    const allowed = [
      'title', 'description', 'shortDescription', 'banner', 'date', 'startTime', 'endTime', 'venue',
      'speaker', 'speakerBio', 'category', 'technologies', 'registrationEnabled', 'registrationDeadline',
      'capacity', 'googleFormUrl', 'registrationLink', 'manualRegistrationCount', 'isCertificateEligible', 'isInauguration', 'status',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        (existing as any)[key] = (key === 'capacity' || key === 'manualRegistrationCount') ? Number(req.body[key]) || 0 : req.body[key];
      }
    }
    await existing.save();

    const registeredCount = await Registration.countDocuments({ eventId: existing._id, status: 'REGISTERED' });
    res.json({ success: true, message: 'Event updated successfully.', event: serializeEvent({ ...existing.toObject(), registeredCount }) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/admin/events/:eventId
export async function adminDeleteEvent(req: any, res: Response) {
  try {
    await connectDB();

    const event = await EventModel.findOne(eventQuery(req.params.eventId));
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }
    await Registration.deleteMany({ eventId: event._id });
    await EventModel.deleteOne({ _id: event._id });
    res.json({ success: true, message: 'Event deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/admin/events/:eventId/send-to-all
export async function sendEventToAllStudents(req: any, res: Response) {
  try {
    await connectDB();
    const { eventId } = req.params;

    const event = await EventModel.findOne({ eventId });
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    if (event.emailSent && !req.body.force) {
      res.json({
        success: true,
        alreadySent: true,
        message: `This event email was already sent to ${event.emailSentCount} student(s) on ${event.emailSentAt ? new Date(event.emailSentAt).toLocaleDateString('en-IN') : 'unknown date'}. Pass {"force": true} to resend.`,
        emailSentAt: event.emailSentAt,
        emailSentCount: event.emailSentCount,
      });
      return;
    }

    const allStudents = await Student.find({ isActive: true, isVerified: true }).lean();
    const recipients = allStudents
      .filter((s) => s.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email))
      .map((s) => ({ email: s.email, name: s.name }));

    if (recipients.length === 0) {
      res.status(400).json({ success: false, message: 'No verified students found to send emails to.' });
      return;
    }

    const regUrl = event.registrationLink || event.googleFormUrl || `https://gdgoc-gcee.vercel.app/events/${event.eventId}`;

    const result = await sendBulkEventAnnouncement({
      eventId: String(event._id),
      eventTitle: event.title,
      recipients,
      subject: `You're Invited! – ${event.title}`,
      message: event.description ? event.description.slice(0, 500) : '',
      eventDate: event.date,
      eventTime: event.startTime ? `${event.startTime} - ${event.endTime || ''}` : 'TBA',
      eventLocation: event.venue || 'Government College of Engineering, Erode',
      eventType: event.category || 'Workshop',
      registrationDeadline: event.registrationDeadline || 'Until Event Date',
      eventRegistrationLink: regUrl,
    });

    event.emailSent = true;
    event.emailSentAt = new Date();
    event.emailSentCount = result.sentCount;
    event.emailFailedCount = result.failedCount;
    await event.save();

    res.json({
      success: true,
      message: `Event email sent. Successfully sent: ${result.sentCount}, Failed: ${result.failedCount}.`,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      totalRecipients: recipients.length,
      status: result.status,
      failedEmails: result.failedEmails,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
