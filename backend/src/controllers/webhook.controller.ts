import type { Request, Response } from 'express';
import { GoogleFormRegistration, AdminNotification } from '../models';
import { connectDB } from '../config/db';
import { env } from '../config/env';

export async function googleFormWebhook(req: Request, res: Response) {
  try {
    await connectDB();

    const secret = req.headers['x-webhook-secret'] || req.query.secret;
    const expected = env.googleFormWebhookSecret;
    if (expected && secret !== expected) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ success: false, message: 'Invalid payload.' });
      return;
    }

    const formData = body.formData || body;
    const responseId = body.responseId || formData['Response ID'] || formData['responseId'] || null;

    const extractField = (data: Record<string, any>, keys: string[]): string => {
      for (const key of keys) {
        for (const k of Object.keys(data)) {
          if (k.toLowerCase().includes(key.toLowerCase())) return String(data[k] || '').trim();
        }
      }
      return '';
    };

    const name = extractField(formData, ['full name', 'name', 'student name']);
    const email = extractField(formData, ['email', 'e-mail']);
    const phone = extractField(formData, ['phone', 'mobile', 'contact']);
    const rollNumber = extractField(formData, ['register', 'roll', 'reg no', 'roll no', 'roll number']);
    const department = extractField(formData, ['department', 'dept', 'branch']);
    const year = extractField(formData, ['year', 'semester', 'study year']);
    const college = extractField(formData, ['college', 'institution', 'university']);

    if (!name && !email) {
      res.status(400).json({ success: false, message: 'Name or email is required.' });
      return;
    }

    if (responseId) {
      const existing = await GoogleFormRegistration.findOne({ responseId }).lean();
      if (existing) {
        res.json({ success: true, message: 'Submission already recorded.', duplicate: true });
        return;
      }
    }

    const registration = await GoogleFormRegistration.create({
      responseId: responseId || undefined,
      formData,
      name,
      email,
      phone,
      rollNumber,
      department,
      year,
      college,
      submittedAt: new Date(),
    });

    try {
      await AdminNotification.create({
        type: 'google_form_registration',
        title: 'New Student Registration',
        message: `${name || 'Student'} (${email || 'no email'}) submitted the GDGoC GCEE registration form.`,
        meta: {
          registrationId: String(registration._id),
          name,
          email,
          department,
          year,
        },
        isRead: false,
      });
    } catch (notifErr: any) {
      console.error('[webhook] Notification creation failed but registration saved:', notifErr.message);
    }

    console.log(`[webhook] New registration saved: ${name} (${email}) — ${registration._id}`);
    res.json({ success: true, message: 'Registration saved.', id: String(registration._id) });
  } catch (err: any) {
    console.error('[webhook] Error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}
