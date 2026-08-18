import type { Response } from 'express';
import { ContactMessage, GoogleForm, Registration, Attendance, EventModel } from '../models';
import { connectDB } from '../config/db';

// GET /api/admin/contact-messages
export async function adminListContactMessages(req: any, res: Response) {
  try {
    await connectDB();
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, messages });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PATCH /api/admin/contact-messages/:id/read
export async function adminMarkMessageRead(req: any, res: Response) {
  try {
    await connectDB();
    await ContactMessage.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true, message: 'Marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/admin/contact-messages/:id
export async function adminDeleteMessage(req: any, res: Response) {
  try {
    await connectDB();
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/google-forms
export async function adminListGoogleForms(req: any, res: Response) {
  try {
    await connectDB();
    const forms = await GoogleForm.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, forms });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/admin/google-forms
export async function adminCreateGoogleForm(req: any, res: Response) {
  try {
    await connectDB();
    const { title, description, formUrl, type } = req.body;
    if (!title || !formUrl || !type) {
      res.status(400).json({ success: false, message: 'Title, form URL and type are required.' });
      return;
    }
    if (!['registration', 'participation'].includes(type)) {
      res.status(400).json({ success: false, message: 'Type must be registration or participation.' });
      return;
    }
    const form = await GoogleForm.create({ title, description, formUrl, type });
    res.status(201).json({ success: true, message: 'Google Form created.', form });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/admin/google-forms/:id
export async function adminUpdateGoogleForm(req: any, res: Response) {
  try {
    await connectDB();
    const form = await GoogleForm.findById(req.params.id);
    if (!form) {
      res.status(404).json({ success: false, message: 'Form not found.' });
      return;
    }
    const { title, description, formUrl, type, isActive } = req.body;
    if (title !== undefined) form.title = title;
    if (description !== undefined) form.description = description;
    if (formUrl !== undefined) form.formUrl = formUrl;
    if (type !== undefined) form.type = type;
    if (isActive !== undefined) form.isActive = isActive;
    await form.save();
    res.json({ success: true, message: 'Form updated.', form });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/admin/google-forms/:id
export async function adminDeleteGoogleForm(req: any, res: Response) {
  try {
    await connectDB();
    await GoogleForm.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Form deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/registrations
export async function adminListRegistrations(req: any, res: Response) {
  try {
    await connectDB();
    const { eventId } = req.query;
    const filter: Record<string, unknown> = { status: 'REGISTERED' };
    if (eventId) {
      const event = await EventModel.findOne({ eventId });
      if (event) filter.eventId = event._id;
    }

    const registrations = await Registration.find(filter)
      .populate('studentId', 'name email rollNumber department year phone')
      .populate('eventId', 'eventId title date category')
      .sort({ registeredAt: -1 })
      .limit(500)
      .lean();

    res.json({
      success: true,
      registrations: registrations
        .filter((r) => r.studentId && r.eventId)
        .map((r) => {
          const student = r.studentId as any;
          const event = r.eventId as any;
          return {
            id: r._id,
            studentName: student.name,
            studentEmail: student.email,
            rollNumber: student.rollNumber,
            department: student.department,
            year: student.year,
            eventId: event.eventId,
            eventTitle: event.title,
            eventDate: event.date,
            eventCategory: event.category,
            registeredAt: r.registeredAt,
          };
        }),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/admin/attended
export async function adminListAttended(req: any, res: Response) {
  try {
    await connectDB();
    const { eventId } = req.query;
    const filter: Record<string, unknown> = { status: 'PRESENT' };
    if (eventId) {
      const event = await EventModel.findOne({ eventId });
      if (event) filter.eventId = event._id;
    }

    const records = await Attendance.find(filter)
      .populate('studentId', 'name email rollNumber department year')
      .populate('eventId', 'eventId title date category')
      .sort({ markedAt: -1 })
      .limit(500)
      .lean();

    res.json({
      success: true,
      records: records
        .filter((r) => r.studentId && r.eventId)
        .map((r) => {
          const student = r.studentId as any;
          const event = r.eventId as any;
          return {
            id: r._id,
            studentName: student.name,
            studentEmail: student.email,
            rollNumber: student.rollNumber,
            department: student.department,
            year: student.year,
            eventId: event.eventId,
            eventTitle: event.title,
            eventDate: event.date,
            eventCategory: event.category,
            method: r.method,
            markedAt: r.markedAt,
          };
        }),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/google-forms (public — students see active forms)
export async function publicGoogleForms(req: any, res: Response) {
  try {
    await connectDB();
    const forms = await GoogleForm.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, forms });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
