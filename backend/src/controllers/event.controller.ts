import type { Response } from 'express';
import mongoose from 'mongoose';
import { EventModel, Registration, GoogleFormRegistration, Student } from '../models';
import type { AuthRequest } from '../middleware/auth';
import { nextEventId } from '../utils/ids';
import { todayIST, isDateBefore } from '../utils/dates';
import { connectDB } from '../config/db';
import { sendEventRegistrationConfirmationEmail } from '../utils/email';

export function eventQuery(identifier: string) {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return { _id: identifier };
  }
  return { eventId: identifier };
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
    googleFormUrl: event.googleFormUrl || '',
    handledBy: event.handledBy || 'GDGoC GCEE Team',
    isCertificateEligible: event.isCertificateEligible,
    isInauguration: event.isInauguration,
    status: event.status,
    effectiveStatus,
    registeredCount: event.registeredCount ?? 0,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

async function getRegistrationCountMap(eventIds: mongoose.Types.ObjectId[]): Promise<Map<string, number>> {
  const [formCounts, appCounts] = await Promise.all([
    GoogleFormRegistration.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } },
    ]),
    Registration.aggregate([
      { $match: { eventId: { $in: eventIds }, status: 'REGISTERED' } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } },
    ]),
  ]);

  const map = new Map<string, number>();
  for (const c of formCounts) map.set(String(c._id), c.count);
  for (const c of appCounts) {
    const key = String(c._id);
    const existing = map.get(key) || 0;
    if (c.count > existing) map.set(key, c.count);
  }
  return map;
}

async function getEventRegCount(eventId: mongoose.Types.ObjectId): Promise<number> {
  const [formCount, appCount] = await Promise.all([
    GoogleFormRegistration.countDocuments({ eventId }),
    Registration.countDocuments({ eventId, status: 'REGISTERED' }),
  ]);
  return Math.max(formCount, appCount);
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

    const ids = events.map((e) => e._id as mongoose.Types.ObjectId);
    const countMap = await getRegistrationCountMap(ids);

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

    const registeredCount = await getEventRegCount(event._id as mongoose.Types.ObjectId);

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

// POST /api/events/:eventId/register-public
export async function registerPublicEvent(req: any, res: Response) {
  try {
    await connectDB();
    const event = await EventModel.findOne(eventQuery(req.params.eventId));
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }
    const { name, email, phone, college, department, year, rollNumber } = req.body;
    if (!name || !email) {
      res.status(400).json({ success: false, message: 'Name and email are required.' });
      return;
    }
    const normalizedEmail = email.toLowerCase().trim();

    // Prevent duplicate registrations using eventId + email
    const existing = await GoogleFormRegistration.findOne({ eventId: event._id, email: normalizedEmail });
    if (existing) {
      existing.name = name;
      existing.phone = phone || existing.phone;
      existing.department = department || existing.department;
      existing.year = year || existing.year;
      existing.college = college || existing.college;
      await existing.save();
      res.json({ success: true, message: 'Registration updated.', updated: true });
      return;
    }

    await GoogleFormRegistration.create({
      eventId: event._id,
      name,
      email: normalizedEmail,
      phone: phone || '',
      rollNumber: rollNumber || '',
      department: department || '',
      year: year || '',
      college: college || 'GCEE',
      source: 'webhook',
      formData: req.body,
      submittedAt: new Date(),
    });

    try {
      await sendEventRegistrationConfirmationEmail({
        to: normalizedEmail,
        studentName: name,
        eventName: event.title,
        eventDate: event.date,
        venue: event.venue || 'GCEE',
        registrationId: 'REG-CONFIRMED',
      });
    } catch (e: any) {
      console.error('[email] Error sending registration email:', e.message);
    }

    res.json({ success: true, message: 'Registration successful.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/events/:eventId/register  (student)
export async function registerForEvent(req: AuthRequest, res: Response) {
  try {
    await connectDB();
    const studentId = req.studentId;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }
    const event = await EventModel.findOne(eventQuery(req.params.eventId));
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }
    const student = await Student.findById(studentId).lean();
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const existing = await Registration.findOne({ eventId: event._id, studentId });
    if (existing && existing.status === 'REGISTERED') {
      res.status(400).json({ success: false, message: 'You are already registered for this event.' });
      return;
    }

    if (existing) {
      existing.status = 'REGISTERED';
      await existing.save();
    } else {
      await Registration.create({
        eventId: event._id,
        studentId,
        status: 'REGISTERED',
        registeredAt: new Date(),
      });
    }

    // Also mirror to GoogleFormRegistration to keep counts unified
    const normalizedEmail = student.email.toLowerCase().trim();
    const dupe = await GoogleFormRegistration.findOne({ eventId: event._id, email: normalizedEmail });
    if (!dupe) {
      await GoogleFormRegistration.create({
        eventId: event._id,
        name: student.name,
        email: normalizedEmail,
        phone: student.phone || '',
        department: student.department || '',
        year: student.year || '',
        college: student.college || 'GCEE',
        source: 'webhook',
        formData: { name: student.name, email: normalizedEmail },
        submittedAt: new Date(),
      });
    }

    try {
      await sendEventRegistrationConfirmationEmail({
        to: student.email,
        studentName: student.name,
        eventName: event.title,
        eventDate: event.date,
        venue: event.venue || 'GCEE',
        registrationId: 'REG-CONFIRMED',
      });
    } catch (e: any) {
      console.error('[email] Error sending registration confirmation:', e.message);
    }

    res.json({ success: true, message: 'Successfully registered for event.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/events/:eventId/register  (student)
export async function unregisterFromEvent(req: AuthRequest, res: Response) {
  try {
    await connectDB();
    const studentId = req.studentId;
    const event = await EventModel.findOne(eventQuery(req.params.eventId));
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }
    await Registration.deleteOne({ eventId: event._id, studentId });
    res.json({ success: true, message: 'Registration cancelled.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/events/my/registered  (student)
export async function myEvents(req: AuthRequest, res: Response) {
  try {
    await connectDB();
    const studentId = req.studentId;
    const registrations = await Registration.find({ studentId, status: 'REGISTERED' })
      .populate('eventId')
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
    const ids = events.map((e) => e._id as mongoose.Types.ObjectId);
    const countMap = await getRegistrationCountMap(ids);

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
    const registeredCount = await getEventRegCount(event._id as mongoose.Types.ObjectId);
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
      googleFormUrl: req.body.googleFormUrl || '',
      handledBy: req.body.handledBy || 'GDGoC GCEE Team',
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

    const allowed = [
      'title', 'description', 'shortDescription', 'banner', 'date', 'startTime', 'endTime', 'venue',
      'speaker', 'speakerBio', 'category', 'technologies', 'registrationEnabled', 'registrationDeadline',
      'googleFormUrl', 'handledBy', 'isCertificateEligible', 'isInauguration', 'status',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        (existing as any)[key] = req.body[key];
      }
    }
    await existing.save();

    const registeredCount = await getEventRegCount(existing._id as mongoose.Types.ObjectId);
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
    await GoogleFormRegistration.deleteMany({ eventId: event._id });
    await EventModel.deleteOne({ _id: event._id });
    res.json({ success: true, message: 'Event deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
