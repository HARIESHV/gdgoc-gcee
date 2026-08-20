import { Resend } from 'resend';
import { env } from '../config/env';
import { EmailLog } from '../models/EmailLog';

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (resendClient) return resendClient;
  const apiKey = env.resend.apiKey || process.env.EMAIL_API_KEY;
  if (!apiKey) return null;
  resendClient = new Resend(apiKey);
  return resendClient;
}

function getFromAddress(): string {
  const configured = env.resend.fromEmail || process.env.EMAIL_FROM;
  if (configured) return `GDGoC GCEE <${configured}>`;
  return 'GDGoC GCEE <onboarding@resend.dev>';
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 1. AUTOMATIC THANK-YOU / WELCOME EMAIL
 * Triggered ONLY AFTER successful student record save in MongoDB.
 */
export async function sendWelcomeEmail(opts: {
  to: string;
  studentName: string;
}): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.log('[email.service] Resend API key not set — skipping welcome email for', opts.to);
    return { success: false, error: 'Email service API key not configured.' };
  }

  const name = escapeHtml(opts.studentName || 'Student');
  const subject = 'Welcome to GDGoC GCEE';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to GDGoC GCEE</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 580px; background-color:#ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background-color:#0b1b33; padding: 28px 32px; text-align: left;">
              <h1 style="margin:0; color:#ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">GDGoC GCEE</h1>
              <p style="margin: 4px 0 0 0; color:#94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Google Developer Groups on Campus</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin-top:0; color:#1e293b; font-size: 16px; line-height: 1.5;">Hi <strong>${name}</strong>,</p>
              <p style="color:#475569; font-size: 14px; line-height: 1.6;">Thank you for registering with GDGoC GCEE.</p>
              <p style="color:#475569; font-size: 14px; line-height: 1.6;">Your student account has been successfully created.</p>
              <p style="color:#475569; font-size: 14px; line-height: 1.6;">You can now access the GDGoC GCEE website and stay updated about upcoming workshops, hackathons, coding events, seminars, webinars, technical sessions, and community activities.</p>
              <p style="color:#475569; font-size: 14px; line-height: 1.6;">We look forward to seeing you at our upcoming events.</p>
              <hr style="border:none; border-top:1px solid #e2e8f0; margin: 24px 0;" />
              <p style="margin:0; color:#64748b; font-size: 13px; line-height: 1.5;">
                Regards,<br/>
                <strong>GDGoC GCEE Team</strong><br/>
                Government College of Engineering, Erode
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin:0; color:#94a3b8; font-size: 11px;">
                This welcome email was sent to ${escapeHtml(opts.to)}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: opts.to,
      subject,
      html,
    });

    if (error) {
      console.error('[email.service] Welcome email error:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`[email.service] Welcome email delivered to ${opts.to}. Resend ID: ${data?.id}`);
    return { success: true };
  } catch (err: any) {
    console.error('[email.service] Exception sending welcome email:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 2. SINGLE / INDIVIDUAL EVENT ANNOUNCEMENT EMAIL
 */
export async function sendEventAnnouncementEmail(opts: {
  to: string;
  studentName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventType: string;
  registrationDeadline: string;
  eventRegistrationLink: string;
  customSubject?: string;
  customMessage?: string;
}): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    return { success: false, error: 'Email service API key not configured.' };
  }

  const name = escapeHtml(opts.studentName || 'Student');
  const eventTitle = escapeHtml(opts.eventName);
  const eventDate = escapeHtml(opts.eventDate);
  const eventTime = escapeHtml(opts.eventTime || 'TBA');
  const eventLocation = escapeHtml(opts.eventLocation || 'TBA');
  const eventType = escapeHtml(opts.eventType || 'Workshop');
  const registrationDeadline = escapeHtml(opts.registrationDeadline || 'Until Event Date');
  const regUrl = opts.eventRegistrationLink;

  const subject = opts.customSubject || `Registration Open – ${opts.eventName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 580px; background-color:#ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background-color:#0b1b33; padding: 28px 32px; text-align: left;">
              <h1 style="margin:0; color:#ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">GDGoC GCEE</h1>
              <p style="margin: 4px 0 0 0; color:#94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Google Developer Groups on Campus</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin-top:0; color:#1e293b; font-size: 15px; line-height: 1.5;">Hi <strong>${name}</strong>,</p>
              <p style="color:#475569; font-size: 14px; line-height: 1.6;">We are excited to announce an upcoming event organized by GDGoC GCEE.</p>
              
              <table width="100%" style="background-color:#f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;" cellpadding="12" cellspacing="0">
                <tr>
                  <td style="color:#64748b; font-size: 12px; text-transform: uppercase; width: 35%; border-bottom: 1px solid #e2e8f0;">Event</td>
                  <td style="color:#0b1b33; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${eventTitle}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Date</td>
                  <td style="color:#0b1b33; font-size: 13px; border-bottom: 1px solid #e2e8f0;">${eventDate}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Time</td>
                  <td style="color:#0b1b33; font-size: 13px; border-bottom: 1px solid #e2e8f0;">${eventTime}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0;">Venue</td>
                  <td style="color:#0b1b33; font-size: 13px; border-bottom: 1px solid #e2e8f0;">${eventLocation}</td>
                </tr>
                <tr>
                  <td style="color:#64748b; font-size: 12px; text-transform: uppercase;">Event Type</td>
                  <td style="color:#0b1b33; font-size: 13px;">${eventType}</td>
                </tr>
              </table>

              ${opts.customMessage ? `<p style="color:#475569; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(opts.customMessage)}</p>` : ''}

              <p style="color:#475569; font-size: 14px; line-height: 1.6;">Registration is now open.</p>
              
              <p style="text-align: center; margin: 28px 0;">
                <a href="${regUrl}" style="background-color:#4285F4; color:#ffffff; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none; display: inline-block;">REGISTER FOR EVENT</a>
              </p>

              <p style="color:#64748b; font-size: 12px; text-align: center; margin-bottom: 24px;">
                Registration Deadline: <strong>${registrationDeadline}</strong>
              </p>

              <hr style="border:none; border-top:1px solid #e2e8f0; margin: 24px 0;" />
              <p style="margin:0; color:#64748b; font-size: 13px; line-height: 1.5;">
                Regards,<br/>
                <strong>GDGoC GCEE Team</strong><br/>
                Government College of Engineering, Erode
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: opts.to,
      subject,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 3. BULK ANNOUNCEMENT DISPATCH WITH LOGGING
 */
export async function sendBulkEventAnnouncement(opts: {
  eventId?: string;
  eventTitle?: string;
  recipients: Array<{ email: string; name: string }>;
  subject: string;
  message?: string;
  eventDate?: string;
  eventTime?: string;
  eventLocation?: string;
  eventType?: string;
  registrationDeadline?: string;
  eventRegistrationLink?: string;
}): Promise<{
  sentCount: number;
  failedCount: number;
  status: 'Success' | 'Partial' | 'Failure';
  failedEmails: string[];
}> {
  let sentCount = 0;
  let failedCount = 0;
  const failedEmails: string[] = [];

  for (const student of opts.recipients) {
    if (!student.email) {
      failedCount++;
      continue;
    }

    const regLink = opts.eventRegistrationLink || 'https://gdgoc-gcee.vercel.app/events';
    const result = await sendEventAnnouncementEmail({
      to: student.email,
      studentName: student.name || 'Student',
      eventName: opts.eventTitle || 'GDGoC Event',
      eventDate: opts.eventDate || 'TBA',
      eventTime: opts.eventTime || 'TBA',
      eventLocation: opts.eventLocation || 'TBA',
      eventType: opts.eventType || 'Workshop',
      registrationDeadline: opts.registrationDeadline || 'Until Event Date',
      eventRegistrationLink: regLink,
      customSubject: opts.subject,
      customMessage: opts.message,
    });

    if (result.success) {
      sentCount++;
    } else {
      failedCount++;
      failedEmails.push(student.email);
    }
  }

  let status: 'Success' | 'Partial' | 'Failure' = 'Success';
  if (failedCount > 0 && sentCount > 0) status = 'Partial';
  if (sentCount === 0 && opts.recipients.length > 0) status = 'Failure';

  // Record EmailLog entry in MongoDB
  try {
    await EmailLog.create({
      eventId: opts.eventId || null,
      eventTitle: opts.eventTitle || '',
      sender: 'Admin',
      recipientsCount: opts.recipients.length,
      subject: opts.subject,
      message: opts.message || '',
      sentCount,
      failedCount,
      status,
      failedEmails,
    });
  } catch (logErr: any) {
    console.error('[email.service] Failed to create EmailLog record:', logErr.message);
  }

  return { sentCount, failedCount, status, failedEmails };
}
