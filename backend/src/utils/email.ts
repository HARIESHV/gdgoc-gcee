import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const { host, user, pass, secure } = env.email;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({ host, port: env.email.port, secure, auth: { user, pass } });
  return transporter;
}

export const emailIsConfigured = (): boolean => {
  const { host, user, pass } = env.email;
  return Boolean(host && user && pass);
};

export async function sendContactEmail(opts: { to: string; fromName: string; fromEmail: string; message: string }) {
  const t = getTransporter();
  if (!t) return;
  try {
    await t.sendMail({
      from: env.email.from,
      to: opts.to,
      subject: `Contact form message from ${opts.fromName}`,
      html: `<p><strong>Name:</strong> ${opts.fromName}</p><p><strong>Email:</strong> ${opts.fromEmail}</p><p>${opts.message}</p>`,
    });
  } catch (err) {
    console.error('[email] failed to send contact email:', (err as Error).message);
  }
}


export async function sendCertificateEmail(opts: {
  to: string;
  studentName: string;
  certificateId: string;
  verificationUrl: string;
  downloadUrl: string;
}): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.log('[email] not configured — skipping certificate email for', opts.to);
    return;
  }

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
    <div style="background:#0b1b33; padding: 18px 24px; color:#fff;">
      <h2 style="margin:0; font-size:18px;">🎓 Your GDGoC GCEE Certificate is Ready</h2>
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
    await t.sendMail({
      from: env.email.from,
      to: opts.to,
      subject: 'Your GDGoC GCEE Certificate is Ready',
      html,
    });
  } catch (err) {
    console.error('[email] failed to send certificate email:', (err as Error).message);
  }
}
