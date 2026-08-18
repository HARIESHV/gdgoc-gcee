import type { Request, Response } from 'express';
import { GoogleFormRegistration } from '../models';
import { connectDB } from '../config/db';
import { env } from '../config/env';
import { sendRegistrationNotificationEmail } from '../utils/email';

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
    if (!body || (typeof body !== 'object' && typeof body !== 'string')) {
      res.status(400).json({ success: false, message: 'Invalid payload.' });
      return;
    }

    // Normalize: Google Apps Script may send { formData: {...} }, flat object, or nested
    let formData: Record<string, any>;
    if (body.formData && typeof body.formData === 'object') {
      formData = body.formData;
    } else if (typeof body === 'object') {
      formData = body;
    } else {
      res.status(400).json({ success: false, message: 'Invalid payload format.' });
      return;
    }

    // Google Forms Apps Script often sends data with question titles as keys.
    // The responseId may be at top level or inside formData.
    const responseId =
      body.responseId ||
      formData['Response ID'] ||
      formData['responseId'] ||
      null;

    // Flexible field extraction — match any key that contains the search term (case-insensitive)
    const extractField = (data: Record<string, any>, keys: string[]): string => {
      const dataKeys = Object.keys(data);
      for (const search of keys) {
        const match = dataKeys.find((k) => k.toLowerCase().includes(search.toLowerCase()));
        if (match) {
          const val = data[match];
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            return String(val).trim();
          }
        }
      }
      return '';
    };

    const name = extractField(formData, ['full name', 'name', 'student name']);
    const email = extractField(formData, ['email', 'e-mail']);
    const phone = extractField(formData, ['phone', 'mobile', 'contact', 'whatsapp']);
    const rollNumber = extractField(formData, ['register', 'roll', 'reg no', 'roll no', 'roll number']);
    const department = extractField(formData, ['department', 'dept', 'branch']);
    const year = extractField(formData, ['year', 'semester', 'study year']);
    const college = extractField(formData, ['college', 'institution', 'university']);

    if (!name && !email) {
      console.warn('[webhook] Rejected: no name or email found in payload. Keys:', Object.keys(formData).join(', '));
      res.status(400).json({ success: false, message: 'Name or email is required.' });
      return;
    }

    // Duplicate prevention via responseId
    if (responseId) {
      const existing = await GoogleFormRegistration.findOne({ responseId }).lean();
      if (existing) {
        console.log(`[webhook] Duplicate ignored (responseId=${responseId})`);
        res.json({ success: true, message: 'Submission already recorded.', duplicate: true });
        return;
      }
    }

    // Also prevent duplicate by email within last 5 minutes (same form submitted twice quickly)
    if (email) {
      const recentDupe = await GoogleFormRegistration.findOne({
        email: email.toLowerCase(),
        submittedAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
      }).lean();
      if (recentDupe) {
        console.log(`[webhook] Duplicate ignored (recent email=${email})`);
        res.json({ success: true, message: 'Submission already recorded.', duplicate: true });
        return;
      }
    }

    const registration = await GoogleFormRegistration.create({
      responseId: responseId || undefined,
      formData,
      name,
      email: email ? email.toLowerCase() : '',
      phone,
      rollNumber,
      department,
      year,
      college,
      submittedAt: new Date(),
    });

    console.log(`[webhook] Registration saved: ${name} (${email}) — id=${registration._id}`);

    // Send admin email notification (non-blocking)
    try {
      const submittedAtIST = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
      await sendRegistrationNotificationEmail({
        studentName: name || 'Student',
        studentEmail: email || '',
        department,
        year,
        college,
        submittedAt: submittedAtIST,
      });
      console.log(`[webhook] Admin email sent for registration ${registration._id}`);
    } catch (emailErr: any) {
      console.error('[webhook] Registration email notification failed but registration saved:', emailErr.message);
    }

    res.json({ success: true, message: 'Registration saved.', id: String(registration._id) });
  } catch (err: any) {
    console.error('[webhook] Error:', err.message, err.stack);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

// POST /api/google-form/test — test the webhook with a sample payload
export async function googleFormTest(req: Request, res: Response) {
  try {
    await connectDB();

    const secret = req.headers['x-webhook-secret'] || req.query.secret;
    const expected = env.googleFormWebhookSecret;
    if (expected && secret !== expected) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    // Create a test registration with a unique responseId
    const testResponseId = `test-${Date.now()}`;
    const now = new Date();

    const formData = {
      'Full Name': 'Test Student',
      'Email': 'test.student@gdggcee.example.com',
      'Phone Number': '9876543210',
      'Register Number': '21CSE999',
      'Department': 'Computer Science',
      'Year': '3rd Year',
      'College': 'Government College of Engineering, Erode',
    };

    const registration = await GoogleFormRegistration.create({
      responseId: testResponseId,
      formData,
      name: 'Test Student',
      email: 'test.student@gdggcee.example.com',
      phone: '9876543210',
      rollNumber: '21CSE999',
      department: 'Computer Science',
      year: '3rd Year',
      college: 'Government College of Engineering, Erode',
      submittedAt: now,
    });

    console.log(`[webhook] Test registration created: id=${registration._id}`);
    res.json({
      success: true,
      message: 'Test registration created. Check the admin dashboard for the new registration.',
      id: String(registration._id),
      testPayload: formData,
    });
  } catch (err: any) {
    console.error('[webhook] Test error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}
