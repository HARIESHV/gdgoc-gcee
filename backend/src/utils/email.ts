import { env } from '../config/env';
import {
  emailIsConfigured as gmailConfigured,
  getEmailConfigStatus as gmailConfigStatus,
  getResendCompatibleMailer,
  type ResendCompatibleMailer,
} from '../lib/mailer';

let resendClient: ResendCompatibleMailer | null = null;

function getResend(): ResendCompatibleMailer | null {
  if (resendClient) return resendClient;
  if (!emailIsConfigured()) return null;
  resendClient = getResendCompatibleMailer();
  return resendClient;
}

export const emailIsConfigured = (): boolean => {
  return gmailConfigured();
};

export function getEmailConfigStatus() {
  const status = gmailConfigStatus();
  return {
    hasApiKey: status.configured,
    hasFromEmail: status.hasFromEmail,
    hasAdminEmail: Boolean(env.adminEmail),
    configured: status.configured,
    adminEmail: status.adminEmail,
    fromEmail: status.fromEmail,
  };
}

export {
  sendOtpEmail,
  sendThankYouEmail,
  sendEventEmail,
  sendWelcomeEmail,
  sendEventRegistrationEmail,
  sendBulkEventRegistrationEmails,
} from '../lib/mailer';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getFromAddress(): string {
  const configured = env.gmail.user;
  if (configured) return `GDGoC GCEE <${configured}>`;
  return 'GDGoC GCEE <gdgocgcee@gmail.com>';
}

export async function sendContactEmail(opts: {
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
}): Promise<{ id: string }> {
  const resend = getResend();
  if (!resend) {
    console.error('[email] Gmail SMTP not configured.');
    throw new Error('Email service is not configured.');
  }

  const adminEmail = env.adminEmail || 'gdgocgcee@gmail.com';
  const safeName = escapeHtml(opts.fromName);
  const safeEmail = escapeHtml(opts.fromEmail);
  const safeSubject = escapeHtml(opts.subject);
  const safeMessage = escapeHtml(opts.message);

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background:#0b1b33; padding: 18px 24px; color:#fff;">
        <h2 style="margin:0; font-size:18px;">New Contact Message</h2>
      </div>
      <div style="padding: 24px;">
        <p style="margin-top:0; color:#374151;"><strong>Student Name:</strong> ${safeName}</p>
        <p style="color:#374151;"><strong>Student Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <p style="color:#374151;"><strong>Subject:</strong> ${safeSubject}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
        <p style="color:#374151;"><strong>Message:</strong></p>
        <p style="color:#374151;white-space:pre-wrap;">${safeMessage}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
        <p style="color:#9aa5b1;font-size:12px;">Submitted at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
      </div>
    </div>
  `;

  const fromAddress = getFromAddress();
  console.log(`[email] Sending contact email from="${fromAddress}" to="${adminEmail}" replyTo="${opts.fromEmail}"`);

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: adminEmail,
    replyTo: opts.fromEmail,
    subject: `GDGoC GCEE Contact Form: ${opts.subject}`,
    html: htmlBody,
  });

  if (error) {
    console.error('[email] Email sending error:', JSON.stringify(error));
    throw new Error(error.message || 'Resend rejected the email request.');
  }

  if (!data || !data.id) {
    console.error('[email] No error returned but no message ID either.');
    throw new Error('Email was not accepted by the mail service.');
  }

  console.log(`[email] Contact email sent successfully. Message ID: ${data.id} to ${adminEmail}`);
  return { id: data.id };
}

export async function sendCertificateEmail(opts: {
  to: string;
  studentName: string;
  certificateId: string;
  verificationUrl: string;
  downloadUrl: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log('[email] Email not configured — skipping certificate email for', opts.to);
    return;
  }

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
    <div style="background:#0b1b33; padding: 18px 24px; color:#fff;">
      <h2 style="margin:0; font-size:18px;">Your GDGoC GCEE Certificate is Ready</h2>
    </div>
    <div style="padding: 24px;">
      <p style="margin-top:0; color:#374151;">Hello <strong>${escapeHtml(opts.studentName)}</strong>,</p>
      <p style="color:#374151;">Your certificate of participation for the GDGoC GCEE community campaign has been issued.</p>
      <p style="color:#374151;"><strong>Certificate ID:</strong> ${escapeHtml(opts.certificateId)}</p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="${opts.verificationUrl}" style="background:#4285F4; color:#fff; padding:10px 22px; border-radius:8px; text-decoration:none; margin-right:8px;">Verify Certificate</a>
        <a href="${opts.downloadUrl}" style="background:#34A853; color:#fff; padding:10px 22px; border-radius:8px; text-decoration:none;">Download PDF</a>
      </p>
      <p style="color:#9aa5b1; font-size:12px;">This is a GDGoC GCEE community participation certificate. It is not an official Google certification.</p>
    </div>
  </div>
  `;

  const fromAddress = getFromAddress();

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: opts.to,
    subject: 'Your GDGoC GCEE Certificate is Ready',
    html,
  });

  if (error) {
    console.error('[email] Resend certificate email error:', JSON.stringify(error));
    return;
  }

  console.log('[email] Certificate email sent to', opts.to, 'Message ID:', data?.id);
}

export async function sendEventRegistrationConfirmationEmail(opts: {
  to: string;
  studentName: string;
  eventName: string;
  eventDate: string;
  eventTime?: string;
  venue?: string;
  registrationId: string;
  instructions?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log('[email] Email not configured — skipping event confirmation email for', opts.to);
    return;
  }

  const safeName = escapeHtml(opts.studentName);
  const safeEvent = escapeHtml(opts.eventName);
  const safeDate = escapeHtml(opts.eventDate);
  const safeTime = escapeHtml(opts.eventTime || 'TBA');
  const safeVenue = escapeHtml(opts.venue || 'TBA');
  const safeRegId = escapeHtml(opts.registrationId);
  const safeInstructions = opts.instructions ? escapeHtml(opts.instructions) : '';

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Registration Confirmed – ${safeEvent}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding: 24px 0;">
      <tr>
        <td align="center">
          <table width="100%" style="max-width: 580px; background-color:#ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);" cellpadding="0" cellspacing="0">
            <!-- Header -->
            <tr>
              <td style="background-color:#0b1b33; padding: 28px 32px; text-align: left;">
                <h1 style="margin:0; color:#ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">GDGoC GCEE</h1>
                <p style="margin: 4px 0 0 0; color:#94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Google Developer Groups on Campus</p>
              </td>
            </tr>

            <!-- Status Banner -->
            <tr>
              <td style="background-color:#f0fdf4; border-bottom: 1px solid #bbf7d0; padding: 14px 32px;">
                <p style="margin:0; color:#166534; font-size: 14px; font-weight: 600;">
                  &#10003; Registration Confirmed
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 32px;">
                <p style="margin-top:0; color:#1e293b; font-size: 15px; line-height: 1.5;">
                  Dear <strong>${safeName}</strong>,
                </p>
                <p style="color:#475569; font-size: 14px; line-height: 1.6;">
                  You have successfully registered for <strong>${safeEvent}</strong>. Please find your registration details below:
                </p>

                <!-- Details Card -->
                <table width="100%" style="background-color:#f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;" cellpadding="12" cellspacing="0">
                  <tr>
                    <td style="color:#64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; width: 35%; border-bottom: 1px solid #e2e8f0;">Registration ID</td>
                    <td style="color:#0b1b33; font-size: 13px; font-weight: 700; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${safeRegId}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Event</td>
                    <td style="color:#0b1b33; font-size: 13px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${safeEvent}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Date</td>
                    <td style="color:#0b1b33; font-size: 13px; border-bottom: 1px solid #e2e8f0;">${safeDate}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Time</td>
                    <td style="color:#0b1b33; font-size: 13px; border-bottom: 1px solid #e2e8f0;">${safeTime}</td>
                  </tr>
                  <tr>
                    <td style="color:#64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Venue</td>
                    <td style="color:#0b1b33; font-size: 13px;">${safeVenue}</td>
                  </tr>
                </table>

                ${safeInstructions ? `
                <div style="background-color:#fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
                  <p style="margin:0 0 6px 0; color:#92400e; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Important Instructions</p>
                  <p style="margin:0; color:#78350f; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${safeInstructions}</p>
                </div>
                ` : ''}

                <p style="color:#475569; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
                  Please keep this email and your <strong>Registration ID (${safeRegId})</strong> handy for check-in at the venue.
                </p>

                <hr style="border:none; border-top:1px solid #e2e8f0; margin: 24px 0;" />

                <p style="margin:0; color:#64748b; font-size: 12px; line-height: 1.5;">
                  Best regards,<br/>
                  <strong>GDGoC GCEE Team</strong><br/>
                  Government College of Engineering, Erode
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="margin:0; color:#94a3b8; font-size: 11px;">
                  This is an automated confirmation sent to ${escapeHtml(opts.to)}.
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

  const fromAddress = getFromAddress();

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: opts.to,
    subject: `Registration Confirmed – ${opts.eventName}`,
    html,
  });

  if (error) {
    console.error('[email] Student registration confirmation error:', JSON.stringify(error));
    return;
  }

  console.log('[email] Student registration confirmation sent to', opts.to, 'Message ID:', data?.id);
}

export async function sendEventRegistrationPDFEmail(opts: {
  to: string;
  studentName: string;
  eventName: string;
  eventDate: string;
  venue?: string;
  pdfBuffer: Buffer;
  filename: string;
}): Promise<{ id?: string; error?: string }> {
  const resend = getResend();
  if (!resend) {
    return { error: 'Email service not configured.' };
  }

  const safeName = escapeHtml(opts.studentName);
  const safeEvent = escapeHtml(opts.eventName);
  const safeDate = escapeHtml(opts.eventDate);
  const safeVenue = escapeHtml(opts.venue || 'TBA');

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${safeEvent} – Student Registration List</title>
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
                <p style="margin-top:0; color:#1e293b; font-size: 15px; line-height: 1.5;">
                  Dear <strong>${safeName}</strong>,
                </p>
                <p style="color:#475569; font-size: 14px; line-height: 1.6;">
                  Please find attached the official registration list / event document for <strong>${safeEvent}</strong>.
                </p>
                <div style="background-color:#f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="margin:0 0 4px 0; color:#0b1b33; font-size: 14px; font-weight: 600;">${safeEvent}</p>
                  <p style="margin:0; color:#64748b; font-size: 12px;">Date: ${safeDate} &bull; Venue: ${safeVenue}</p>
                </div>
                <p style="color:#475569; font-size: 13px; line-height: 1.6;">
                  The complete PDF document containing the participant list is attached with this email for your reference.
                </p>
                <hr style="border:none; border-top:1px solid #e2e8f0; margin: 24px 0;" />
                <p style="margin:0; color:#64748b; font-size: 12px; line-height: 1.5;">
                  Best regards,<br/>
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

  const fromAddress = getFromAddress();

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: opts.to,
      subject: `${opts.eventName} – Student Registration List / Event Document`,
      html,
      attachments: [
        {
          filename: opts.filename,
          content: opts.pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('[email] PDF email sending error:', error);
      return { error: error.message };
    }

    return { id: data?.id };
  } catch (err: any) {
    console.error('[email] PDF email exception:', err.message);
    return { error: err.message };
  }
}

export async function sendStudentConfirmationEmail(opts: {
  to: string;
  studentName: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log('[email] Email not configured — skipping student confirmation email for', opts.to);
    return;
  }

  const safeName = escapeHtml(opts.studentName);

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
    <div style="background:#0b1b33; padding: 18px 24px; color:#fff;">
      <h2 style="margin:0; font-size:18px;">Thank You for Registering!</h2>
    </div>
    <div style="padding: 24px;">
      <p style="margin-top:0; color:#374151;">Dear <strong>${safeName}</strong>,</p>
      <p style="color:#374151;">Thank you for registering with us!</p>
      <p style="color:#374151;">We have successfully received your registration details. Our team will review your submission and contact you if any further information is required.</p>
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:12px 16px; margin:16px 0;">
        <p style="margin:0; color:#166534; font-weight:bold;">Your registration has been successfully submitted.</p>
      </div>
      <p style="color:#374151;">We appreciate your interest and look forward to having you with us.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
      <p style="color:#374151;">Best regards,<br/><strong>GDGoC GCEE Team</strong></p>
      <p style="color:#9aa5b1;font-size:12px; margin-top:16px;">Google Developer Groups on Campus — Government College of Engineering, Erode</p>
    </div>
  </div>
  `;

  const fromAddress = getFromAddress();

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: opts.to,
    subject: 'Thank You for Registering – GDGoC GCEE',
    html,
  });

  if (error) {
    console.error('[email] Student confirmation email error:', JSON.stringify(error));
    return;
  }

  console.log('[email] Student confirmation email sent to', opts.to, 'Message ID:', data?.id);
}

export async function sendBulkEmail(opts: {
  to: string;
  studentName: string;
  subject: string;
  message: string;
  htmlContent?: string;
}): Promise<{ id?: string; error?: string }> {
  const resend = getResend();
  if (!resend) {
    return { error: 'Email service is not configured.' };
  }

  const safeName = escapeHtml(opts.studentName);
  const safeSubject = escapeHtml(opts.subject);
  const safeMessage = opts.htmlContent || `<p style="white-space:pre-wrap;">${escapeHtml(opts.message)}</p>`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>${safeSubject}</title></head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding: 24px 0;">
      <tr>
        <td align="center">
          <table width="100%" style="max-width: 580px; background-color:#ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background-color:#0b1b33; padding: 24px 32px; text-align: left;">
                <h1 style="margin:0; color:#ffffff; font-size: 20px; font-weight: 700;">GDGoC GCEE</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <p style="margin-top:0; color:#1e293b; font-size: 15px;">Dear <strong>${safeName}</strong>,</p>
                <div style="color:#334155; font-size: 14px; line-height: 1.6;">${safeMessage}</div>
                <hr style="border:none; border-top:1px solid #e2e8f0; margin: 24px 0;" />
                <p style="margin:0; color:#64748b; font-size: 12px;">Best regards,<br/><strong>GDGoC GCEE Team</strong></p>
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
      subject: opts.subject,
      html,
    });

    if (error) {
      return { error: error.message };
    }
    return { id: data?.id };
  } catch (err: any) {
    return { error: err.message };
  }
}

