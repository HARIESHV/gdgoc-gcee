import type { Request, Response } from 'express';
import { GoogleFormRegistration, EventModel } from '../models';
import { connectDB } from '../config/db';

function extractField(data: Record<string, any>, keys: string[]): string {
  for (const search of keys) {
    const match = Object.keys(data).find((k) => k.toLowerCase().includes(search.toLowerCase()));
    if (match) {
      const val = data[match];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim();
      }
    }
  }
  return '';
}

function normalizePayload(body: any): Record<string, any> | null {
  if (!body || (typeof body !== 'object' && typeof body !== 'string')) return null;
  if (body.formData && typeof body.formData === 'object') return body.formData;
  if (typeof body === 'object') return body;
  return null;
}

// POST /api/registrations/webhook/:eventId
export async function eventWebhook(req: Request, res: Response) {
  try {
    await connectDB();
    const { eventId } = req.params;
    const event = await EventModel.findOne({ eventId }).lean();
    if (!event) {
      res.status(404).json({ success: false, message: `Event not found: ${eventId}` });
      return;
    }

    const formData = normalizePayload(req.body);
    if (!formData) {
      res.status(400).json({ success: false, message: 'Invalid payload.' });
      return;
    }

    const responseId = req.body.responseId || formData['Response ID'] || formData['responseId'] || null;
    const name = extractField(formData, ['full name', 'name', 'student name']);
    const email = extractField(formData, ['email', 'e-mail']);
    const phone = extractField(formData, ['phone', 'mobile', 'contact', 'whatsapp']);
    const rollNumber = extractField(formData, ['register', 'roll', 'reg no', 'roll no', 'roll number']);
    const department = extractField(formData, ['department', 'dept', 'branch']);
    const year = extractField(formData, ['year', 'semester', 'study year']);
    const college = extractField(formData, ['college', 'institution', 'university']);

    if (!name && !email) {
      res.status(400).json({ success: false, message: 'Name or email is required.' });
      return;
    }

    // Prevent duplicate registrations using eventId + email
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existing = await GoogleFormRegistration.findOne({
        eventId: event._id,
        email: normalizedEmail,
      });

      if (existing) {
        existing.name = name || existing.name;
        existing.phone = phone || existing.phone;
        existing.rollNumber = rollNumber || existing.rollNumber;
        existing.department = department || existing.department;
        existing.year = year || existing.year;
        existing.college = college || existing.college;
        existing.formData = formData;
        existing.submittedAt = new Date();
        await existing.save();

        console.log(`[webhook] Registration updated for ${normalizedEmail} on event ${eventId}`);
        res.json({ success: true, message: 'Registration updated.', updated: true, id: String(existing._id) });
        return;
      }
    }

    const registration = await GoogleFormRegistration.create({
      responseId: responseId || undefined,
      eventId: event._id,
      formData,
      name,
      email: email ? email.toLowerCase().trim() : '',
      phone,
      rollNumber,
      department,
      year,
      college: college || 'Government College of Engineering, Erode',
      source: 'webhook',
      submittedAt: new Date(),
    });

    console.log(`[webhook] Event registration saved: ${name} (${email}) for event ${eventId} — id=${registration._id}`);
    res.json({ success: true, message: 'Registration saved.', id: String(registration._id) });
  } catch (err: any) {
    console.error('[webhook] Error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// GET /api/admin/events/:eventId/registrations
export async function listEventRegistrations(req: any, res: Response) {
  try {
    await connectDB();
    const { eventId } = req.params;
    const event = await EventModel.findOne({ eventId }).lean();
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim().toLowerCase();

    const filter: Record<string, any> = { eventId: event._id };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      GoogleFormRegistration.find(filter).sort({ submittedAt: -1 }).skip(skip).limit(limit).lean(),
      GoogleFormRegistration.countDocuments(filter),
    ]);

    res.json({
      success: true,
      registrations: items.map((r) => ({
        _id: r._id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        rollNumber: r.rollNumber,
        department: r.department,
        year: r.year,
        college: r.college || 'GCEE',
        source: r.source,
        submittedAt: r.submittedAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      eventTitle: event.title,
      eventDate: event.date,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/events/:eventId/stats
export async function eventRegistrationStats(req: any, res: Response) {
  try {
    await connectDB();
    const { eventId } = req.params;
    const event = await EventModel.findOne({ eventId }).lean();
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const [total, recent, byDepartment, byYear, byCollege] = await Promise.all([
      GoogleFormRegistration.countDocuments({ eventId: event._id }),
      GoogleFormRegistration.find({ eventId: event._id }).sort({ submittedAt: -1 }).limit(5).lean(),
      GoogleFormRegistration.aggregate([
        { $match: { eventId: event._id } },
        { $group: { _id: { $ifNull: ['$department', 'Unspecified'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      GoogleFormRegistration.aggregate([
        { $match: { eventId: event._id } },
        { $group: { _id: { $ifNull: ['$year', 'Unspecified'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      GoogleFormRegistration.aggregate([
        { $match: { eventId: event._id } },
        { $group: { _id: { $ifNull: ['$college', 'Government College of Engineering, Erode'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        total,
        recent: recent.map((r) => ({
          _id: r._id,
          name: r.name,
          email: r.email,
          department: r.department,
          year: r.year,
          submittedAt: r.submittedAt,
        })),
        byDepartment,
        byYear,
        byCollege,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/events/:eventId/registration-count
export async function eventRegistrationCount(req: any, res: Response) {
  try {
    await connectDB();
    const { eventId } = req.params;
    const event = await EventModel.findOne({ eventId }).lean();
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const count = await GoogleFormRegistration.countDocuments({ eventId: event._id });
    res.json({
      success: true,
      count,
      registrationEnabled: event.registrationEnabled,
      lastSyncedAt: event.lastSyncedAt,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/events/:eventId/registrations/export
export async function exportEventRegistrationsAsCsv(req: any, res: Response) {
  try {
    await connectDB();
    const { eventId } = req.params;
    const event = await EventModel.findOne({ eventId }).lean();
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const items = await GoogleFormRegistration.find({ eventId: event._id }).sort({ submittedAt: -1 }).lean();

    const header = '#,Name,Email,Phone,College,Department,Year,Event,Source,Registered At\n';
    const rows = items.map((r, i) => {
      const d = r.submittedAt ? new Date(r.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '';
      return `${i + 1},"${(r.name || '').replace(/"/g, '""')}","${r.email || ''}","${r.phone || ''}","${(r.college || 'GCEE').replace(/"/g, '""')}","${r.department || ''}","${r.year || ''}","${event.title}","${r.source || 'webhook'}","${d}"`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${eventId}-registrations.csv"`);
    res.send(header + rows);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/admin/events/:eventId/registrations/bulk
export async function bulkAddRegistrations(req: any, res: Response) {
  try {
    await connectDB();
    const { eventId } = req.params;
    const event = await EventModel.findOne({ eventId }).lean();
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const { registrations } = req.body;
    if (!Array.isArray(registrations) || registrations.length === 0) {
      res.status(400).json({ success: false, message: 'Provide a registrations array.' });
      return;
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const r of registrations) {
      const email = (r.email || '').toLowerCase().trim();
      if (!email && !r.name) { skipped++; continue; }

      if (email) {
        const existing = await GoogleFormRegistration.findOne({ eventId: event._id, email });
        if (existing) {
          existing.name = r.name || existing.name;
          existing.phone = r.phone || existing.phone;
          existing.department = r.department || existing.department;
          existing.year = r.year || existing.year;
          existing.college = r.college || existing.college;
          await existing.save();
          updated++;
          continue;
        }
      }

      const responseId = r.responseId || `bulk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await GoogleFormRegistration.create({
        responseId,
        eventId: event._id,
        formData: r,
        name: r.name || '',
        email,
        phone: r.phone || '',
        rollNumber: r.rollNumber || '',
        department: r.department || '',
        year: r.year || '',
        college: r.college || 'Government College of Engineering, Erode',
        source: 'sheets-sync',
        submittedAt: r.submittedAt ? new Date(r.submittedAt) : new Date(),
      });
      added++;
    }

    await EventModel.findOneAndUpdate({ eventId }, { lastSyncedAt: new Date() });

    res.json({ success: true, message: `Synced ${added} new, updated ${updated} registration(s).`, added, updated, skipped });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/events-with-registrations
export async function listEventsWithRegistrationCounts(req: any, res: Response) {
  try {
    await connectDB();

    const events = await EventModel.find().sort({ date: -1 }).lean();

    const eventIds = events.map((e) => e._id);
    const counts = await GoogleFormRegistration.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    res.json({
      success: true,
      events: events.map((e) => ({
        eventId: e.eventId,
        title: e.title,
        date: e.date,
        category: e.category,
        handledBy: (e as any).handledBy || 'GDGoC GCEE Team',
        registrationEnabled: e.registrationEnabled,
        googleFormUrl: e.googleFormUrl || '',
        responseSheetId: e.responseSheetId || '',
        lastSyncedAt: e.lastSyncedAt,
        registrationCount: countMap.get(String(e._id)) || 0,
        status: e.status,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/admin/events/:eventId/registrations/:registrationId
export async function deleteEventRegistration(req: any, res: Response) {
  try {
    await connectDB();
    const { eventId, registrationId } = req.params;

    const event = await EventModel.findOne({ eventId }).lean();
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    const deleted = await GoogleFormRegistration.findOneAndDelete({
      _id: registrationId,
      eventId: event._id,
    });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Registration not found.' });
      return;
    }

    const newCount = await GoogleFormRegistration.countDocuments({ eventId: event._id });
    res.json({ success: true, message: 'Registration deleted successfully.', remainingCount: newCount });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
