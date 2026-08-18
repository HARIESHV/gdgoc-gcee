import { Resend } from 'resend';
import { env } from '../config/env';

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (resendClient) return resendClient;
  if (!env.resend.apiKey) return null;
  resendClient = new Resend(env.resend.apiKey);
  return resendClient;
}

export const emailIsConfigured = (): boolean => {
  return Boolean(env.resend.apiKey);
};

export function getEmailConfigStatus() {
  return {
    hasApiKey: Boolean(env.resend.apiKey),
    hasFromEmail: Boolean(env.resend.fromEmail),
    hasAdminEmail: Boolean(env.adminEmail),
    configured: emailIsConfigured(),
    adminEmail: env.adminEmail || 'gdgocgcee@gmail.com',
    fromEmail: env.resend.fromEmail || 'onboarding@resend.dev',
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getFromAddress(): string {
  const configured = env.resend.fromEmail;
  if (configured) return `GDGoC GCEE <${configured}>`;
  return 'GDGoC GCEE <onboarding@resend.dev>';
}

export async function sendContactEmail(opts: {
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
}): Promise<{ id: string }> {
  const resend = getResend();
  if (!resend) {
    console.error('[email] Resend API key not configured.');
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
    console.error('[email] Resend API error:', JSON.stringify(error));
    throw new Error(error.message || 'Resend rejected the email request.');
  }

  if (!data || !data.id) {
    console.error('[email] Resend returned no error but no email ID either.');
    throw new Error('Email was not accepted by the mail service.');
  }

  console.log(`[email] Contact email sent successfully. Resend ID: ${data.id} to ${adminEmail}`);
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
    console.log('[email] Resend not configured — skipping certificate email for', opts.to);
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

  console.log('[email] Certificate email sent to', opts.to, 'Resend ID:', data?.id);
}

export async function sendRegistrationNotificationEmail(opts: {
  studentName: string;
  studentEmail: string;
  department?: string;
  year?: string;
  college?: string;
  submittedAt: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log('[email] Resend not configured — skipping registration notification email');
    return;
  }

  const safeName = escapeHtml(opts.studentName);
  const safeEmail = escapeHtml(opts.studentEmail);
  const safeDept = escapeHtml(opts.department || '—');
  const safeYear = escapeHtml(opts.year || '—');
  const safeCollege = escapeHtml(opts.college || '—');

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
    <div style="background:#0b1b33; padding: 18px 24px; color:#fff;">
      <h2 style="margin:0; font-size:18px;">New Student Registration</h2>
    </div>
    <div style="padding: 24px;">
      <p style="margin-top:0; color:#374151;">A new student has submitted the GDGoC GCEE registration form.</p>
      <p style="color:#374151;"><strong>Student Name:</strong> ${safeName}</p>
      <p style="color:#374151;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
      <p style="color:#374151;"><strong>Department:</strong> ${safeDept}</p>
      <p style="color:#374151;"><strong>Year:</strong> ${safeYear}</p>
      <p style="color:#374151;"><strong>College:</strong> ${safeCollege}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      <p style="color:#9aa5b1;font-size:12px;">Submitted at ${opts.submittedAt} IST</p>
      <p style="color:#9aa5b1;font-size:12px;">View all registrations in the Admin Dashboard.</p>
    </div>
  </div>
  `;

  const fromAddress = getFromAddress();
  const adminEmail = env.adminEmail || 'gdgocgcee@gmail.com';

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: adminEmail,
    subject: `New GDGoC GCEE Registration: ${opts.studentName}`,
    html,
  });

  if (error) {
    console.error('[email] Registration notification email error:', JSON.stringify(error));
    return;
  }

  console.log('[email] Registration notification email sent to', adminEmail, 'Resend ID:', data?.id);
}

export async function sendStudentConfirmationEmail(opts: {
  to: string;
  studentName: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log('[email] Resend not configured — skipping student confirmation email for', opts.to);
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
      <p style="color:#374151;">We have successfully received your registration details. Our admin team will review your submission and contact you if any further information is required.</p>
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:12px 16px; margin:16px 0;">
        <p style="margin:0; color:#166534; font-weight:bold;">Your registration has been successfully submitted.</p>
      </div>
      <p style="color:#374151;">We appreciate your interest and look forward to having you with us.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
      <p style="color:#374151;">Best regards,<br/><strong>Admin Team</strong><br/>GDGoC GCEE</p>
      <p style="color:#9aa5b1;font-size:12px; margin-top:16px;">Google Developer Groups on Campus — Government College of Engineering, Erode</p>
    </div>
  </div>
  `;

  const fromAddress = getFromAddress();

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: opts.to,
    subject: 'Thank You for Registering!',
    html,
  });

  if (error) {
    console.error('[email] Student confirmation email error:', JSON.stringify(error));
    throw new Error(error.message || 'Failed to send confirmation email.');
  }

  if (!data || !data.id) {
    console.error('[email] Student confirmation email: no error but no ID returned.');
    throw new Error('Confirmation email was not accepted by the mail service.');
  }

  console.log('[email] Student confirmation email sent to', opts.to, 'Resend ID:', data?.id);
}
