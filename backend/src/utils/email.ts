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
  return Boolean(env.resend.apiKey && env.resend.fromEmail);
};

export async function sendContactEmail(opts: {
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
}) {
  const resend = getResend();
  if (!resend || !env.resend.fromEmail) {
    console.log('[email] Resend not configured — skipping contact email');
    return;
  }

  const adminEmail = env.adminEmail || 'admin@gdgocgcee.in';
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background:#0b1b33; padding: 18px 24px; color:#fff;">
        <h2 style="margin:0; font-size:18px;">Student Contact Form Submission</h2>
      </div>
      <div style="padding: 24px;">
        <p style="margin-top:0; color:#374151;"><strong>From:</strong> ${opts.fromName}</p>
        <p style="color:#374151;"><strong>Email:</strong> ${opts.fromEmail}</p>
        <p style="color:#374151;"><strong>Subject:</strong> ${opts.subject}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
        <p style="color:#374151;white-space:pre-wrap;">${opts.message}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
        <p style="color:#9aa5b1;font-size:12px;">Submitted at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: env.resend.fromEmail,
      to: adminEmail,
      replyTo: opts.fromEmail,
      subject: `Student Contact: ${opts.subject}`,
      html: htmlBody,
    });
    console.log('[email] Contact email sent to', adminEmail);
  } catch (err) {
    console.error('[email] Failed to send contact email:', (err as Error).message);
    throw err;
  }
}

export async function sendCertificateEmail(opts: {
  to: string;
  studentName: string;
  certificateId: string;
  verificationUrl: string;
  downloadUrl: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !env.resend.fromEmail) {
    console.log('[email] Resend not configured — skipping certificate email for', opts.to);
    return;
  }

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
    <div style="background:#0b1b33; padding: 18px 24px; color:#fff;">
      <h2 style="margin:0; font-size:18px;">Your GDGoC GCEE Certificate is Ready</h2>
    </div>
    <div style="padding: 24px;">
      <p style="margin-top:0; color:#374151;">Hello <strong>${opts.studentName}</strong>,</p>
      <p style="color:#374151;">Your certificate of participation for the GDGoC GCEE community campaign has been issued.</p>
      <p style="color:#374151;"><strong>Certificate ID:</strong> ${opts.certificateId}</p>
      <p style="text-align:center; margin: 24px 0;">
        <a href="${opts.verificationUrl}" style="background:#4285F4; color:#fff; padding:10px 22px; border-radius:8px; text-decoration:none; margin-right:8px;">Verify Certificate</a>
        <a href="${opts.downloadUrl}" style="background:#34A853; color:#fff; padding:10px 22px; border-radius:8px; text-decoration:none;">Download PDF</a>
      </p>
      <p style="color:#9aa5b1; font-size:12px;">This is a GDGoC GCEE community participation certificate. It is not an official Google certification.</p>
    </div>
  </div>
  `;

  try {
    await resend.emails.send({
      from: env.resend.fromEmail,
      to: opts.to,
      subject: 'Your GDGoC GCEE Certificate is Ready',
      html,
    });
    console.log('[email] Certificate email sent to', opts.to);
  } catch (err) {
    console.error('[email] Failed to send certificate email:', (err as Error).message);
  }
}
