import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Resend } from 'resend';
import { env, CLUB } from '../config/env';
import { formatFullDate } from '../utils/dates';

const FROM_NAME = 'GDGoC GCEE';

let resendInstance: Resend | null = null;
function getResendInstance(): Resend | null {
  if (env.resendApiKey) {
    if (!resendInstance) {
      resendInstance = new Resend(env.resendApiKey);
    }
    return resendInstance;
  }
  return null;
}

/** True when either Resend API Key or Gmail SMTP credentials are configured on the server. */
export function emailIsConfigured(): boolean {
  return Boolean(env.resendApiKey || (env.gmail.user && env.gmail.appPassword));
}

/** Public config status — never includes secrets, safe to return to the browser/admin UI. */
export function getEmailConfigStatus() {
  return {
    configured: emailIsConfigured(),
    provider: env.resendApiKey ? 'resend' : env.gmail.user ? 'gmail' : 'none',
    hasApiKey: Boolean(env.resendApiKey),
    hasUser: Boolean(env.gmail.user),
    hasFromEmail: Boolean(env.resendFromEmail || env.gmail.user),
    hasAppPassword: Boolean(env.gmail.appPassword),
    adminEmail: env.adminEmail || 'gdgocgcee@gmail.com',
    fromEmail: env.resendFromEmail || env.gmail.user || 'onboarding@resend.dev',
  };
}

let transporter: Transporter | null = null;

export function getTransport(): Transporter {
  if (transporter) return transporter;
  if (!env.gmail.user || !env.gmail.appPassword) {
    throw new Error('Gmail SMTP is not configured.');
  }
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: env.gmail.user,
      pass: env.gmail.appPassword,
    },
  });
  return transporter;
}

function getFromAddress(): string {
  if (env.resendFromEmail) {
    return `${env.resendFromName || FROM_NAME} <${env.resendFromEmail}>`;
  }
  return `${FROM_NAME} <${env.gmail.user || 'gdgocgcee@gmail.com'}>`;
}

export function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer | string }>;
}

export type SendMailResult = { success: boolean; id?: string; error?: string };

/** Send one email via Resend (or fallback to Gmail SMTP). Returns a result object. */
export async function sendMail(opts: SendMailOptions): Promise<SendMailResult> {
  if (!emailIsConfigured()) {
    console.error('[mailer] Email service is not configured (missing RESEND_API_KEY and GMAIL_USER/GMAIL_APP_PASSWORD).');
    return { success: false, error: 'Email service is not configured.' };
  }

  // 1. Send via Resend if RESEND_API_KEY is available
  if (env.resendApiKey) {
    try {
      const resend = getResendInstance()!;
      const from = getFromAddress();

      const payload: any = {
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      };
      if (opts.text) payload.text = opts.text;
      if (opts.replyTo) payload.reply_to = opts.replyTo;
      if (opts.attachments && opts.attachments.length > 0) {
        payload.attachments = opts.attachments.map((a) => ({
          filename: a.filename,
          content: Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content),
        }));
      }

      const res = await resend.emails.send(payload);
      if (res.error) {
        console.error('[mailer] Resend API error:', res.error);
        if (!env.gmail.user || !env.gmail.appPassword) {
          return { success: false, error: res.error.message || 'Resend delivery failed' };
        }
      } else {
        return { success: true, id: res.data?.id };
      }
    } catch (err: any) {
      console.error('[mailer] Resend error:', err.message);
      if (!env.gmail.user || !env.gmail.appPassword) {
        return { success: false, error: err.message };
      }
    }
  }

  // 2. Fallback to Gmail SMTP if configured
  if (env.gmail.user && env.gmail.appPassword) {
    try {
      const transport = getTransport();
      const info = await transport.sendMail({
        from: getFromAddress(),
        to: opts.to,
        replyTo: opts.replyTo,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        attachments: opts.attachments,
      });
      return { success: true, id: info.messageId };
    } catch (err: any) {
      console.error('[mailer] Gmail SMTP error:', err.message);
      return { success: false, error: err.message };
    }
  }

  return { success: false, error: 'Email service failed to deliver message.' };
}

function baseHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:24px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e2e8f0;">
        <tr>
          <td style="background-color:#0b1b33; padding:26px 28px; text-align:left;">
            <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:800; letter-spacing:-0.5px;">GDGoC GCEE</h1>
            <p style="margin:4px 0 0 0; color:#94a3b8; font-size:11px; text-transform:uppercase; letter-spacing:1.5px;">Google Developer Groups on Campus · ${CLUB.institution}</p>
          </td>
        </tr>
        ${content}
        <tr>
          <td style="background-color:#f8fafc; padding:18px 28px; border-top:1px solid #e2e8f0; text-align:center;">
            <p style="margin:0; color:#94a3b8; font-size:11px; line-height:1.6;">
              ${FROM_NAME} · ${CLUB.institution}<br/>
              <a href="${escapeHtml(env.clientUrl || env.appUrl || '')}" style="color:#4285F4; text-decoration:none;">${CLUB.websiteName} Website</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ─── Templates ────────────────────────────────────────────────────── */

export async function sendOtpEmail(opts: {
  to: string;
  studentName: string;
  otp: string;
}): Promise<SendMailResult> {
  const name = escapeHtml(opts.studentName || 'Student');
  const otp = escapeHtml(opts.otp);

  const html = baseHtml(`
    <tr><td style="padding:32px 32px 12px 32px;">
      <p style="margin:0; color:#1e293b; font-size:16px; line-height:1.5;">Hi <strong>${name}</strong>,</p>
      <p style="margin:20px 0 0 0; color:#475569; font-size:14px; line-height:1.6;">
        Thank you for signing up for the GDGoC GCEE community. Please use the one-time password below to verify your email address and complete your registration:
      </p>
    </td></tr>
    <tr><td style="padding:8px 32px;">
      <div style="background-color:#f8fafc; border:2px dashed #4285F4; border-radius:12px; padding:24px; text-align:center;">
        <p style="margin:0 0 8px 0; color:#64748b; font-size:11px; text-transform:uppercase; letter-spacing:1.5px;">Your One-Time Password</p>
        <p style="margin:0; color:#0b1b33; font-size:34px; font-weight:900; letter-spacing:10px; font-family:Consolas, Menlo, monospace;">${otp}</p>
      </div>
    </td></tr>
    <tr><td style="padding:16px 32px 32px 32px;">
      <p style="margin:0; color:#64748b; font-size:12px; line-height:1.6;">This OTP will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
    </td></tr>
  `);

  const result = await sendMail({
    to: opts.to,
    subject: 'Verify Your Email – GDGoC GCEE',
    html,
  });
  console.log(`[mailer] sendOtpEmail -> ${opts.to} (${result.success ? 'sent' : 'failed'})`);
  return result;
}

export async function sendThankYouEmail(opts: {
  to: string;
  studentName: string;
}): Promise<SendMailResult> {
  const name = escapeHtml(opts.studentName || 'Student');

  const html = baseHtml(`
    <tr><td style="padding:32px 32px 12px 32px;">
      <p style="margin:0; color:#1e293b; font-size:16px; line-height:1.5;">Dear <strong>${name}</strong>,</p>
      <p style="margin:20px 0 0 0; color:#475569; font-size:14px; line-height:1.6;">
        Thank you for joining the <strong>GDGoC GCEE</strong> community!
      </p>
      <p style="margin:16px 0 0 0; color:#475569; font-size:14px; line-height:1.6;">
        This email confirms that your community signup was <strong>successful</strong>. Your email address has been verified and you are now part of the Google Developer Groups family at Government College of Engineering, Erode.
      </p>
    </td></tr>
    <tr><td style="padding:12px 32px;">
      <div style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:14px 16px;">
        <p style="margin:0; color:#166534; font-size:13px; font-weight:700;">&#10003; Community signup confirmed &amp; email verified</p>
      </div>
    </td></tr>
    <tr><td style="padding:20px 32px 32px 32px;">
      <p style="margin:0; color:#475569; font-size:14px; line-height:1.6;">
        Keep an eye on your inbox for upcoming workshops, hackathons, technical talks and community events. You can also explore our website to learn more:
      </p>
      <p style="margin:24px 0 0 0; text-align:center;">
        <a href="${escapeHtml(env.clientUrl || env.appUrl || '')}" style="background-color:#4285F4; color:#ffffff; font-weight:700; font-size:14px; padding:12px 30px; border-radius:8px; text-decoration:none; display:inline-block;">Visit GDGoC GCEE</a>
      </p>
    </td></tr>
  `);

  const result = await sendMail({
    to: opts.to,
    subject: 'Thank You for Joining GDGoC GCEE',
    html,
  });
  console.log(`[mailer] sendThankYouEmail -> ${opts.to} (${result.success ? 'sent' : 'failed'})`);
  return result;
}

export async function sendEventEmail(opts: {
  to: string;
  studentName: string;
  event: {
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    poster?: string;
    registrationLink?: string;
  };
}): Promise<SendMailResult> {
  const name = escapeHtml(opts.studentName || 'Student');
  const eventTitle = escapeHtml(opts.event.title || 'GDGoC GCEE Event');
  const eventDescription = escapeHtml(opts.event.description || '');
  const eventDate = formatFullDate(opts.event.date) || 'TBA';
  const eventTime = escapeHtml(opts.event.time || 'TBA');
  const eventVenue = escapeHtml(opts.event.venue || CLUB.institution);
  const poster = opts.event.poster || '';
  const regUrl = opts.event.registrationLink && /^https?:\/\//.test(opts.event.registrationLink)
    ? opts.event.registrationLink
    : (env.clientUrl || env.appUrl || 'https://gdgoc-gcee.vercel.app') + '/events';

  const posterHtml = poster
    ? `<tr><td style="padding:0;">
        <img src="${escapeHtml(poster)}" alt="${eventTitle} poster" width="600" style="display:block; width:100%; max-width:600px; height:auto; border:none;" />
      </td></tr>`
    : '';

  const html = baseHtml(`
    ${posterHtml}
    <tr><td style="padding:28px 32px 0 32px;">
      <p style="margin:0 0 6px 0; color:#4285F4; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px;">You're Invited!</p>
      <h2 style="margin:0; color:#0b1b33; font-size:22px; font-weight:800; line-height:1.3;">${eventTitle}</h2>
      ${eventDescription ? `<p style="margin:12px 0 0 0; color:#475569; font-size:14px; line-height:1.65;">${eventDescription}</p>` : ''}
    </td></tr>
    <tr><td style="padding:18px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
        <tr>
          <td style="padding:12px 16px; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; width:35%; border-bottom:1px solid #e2e8f0;">Date</td>
          <td style="padding:12px 16px; color:#0b1b33; font-size:13px; font-weight:600; border-bottom:1px solid #e2e8f0;">${eventDate}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #e2e8f0;">Time</td>
          <td style="padding:12px 16px; color:#0b1b33; font-size:13px; border-bottom:1px solid #e2e8f0;">${eventTime}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Venue</td>
          <td style="padding:12px 16px; color:#0b1b33; font-size:13px;">${eventVenue}</td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding:6px 32px 26px 32px; text-align:center;">
      <a href="${escapeHtml(regUrl)}" style="background-color:#34A853; color:#ffffff; font-weight:700; font-size:15px; padding:14px 36px; border-radius:8px; text-decoration:none; display:inline-block;">REGISTER NOW</a>
    </td></tr>
    <tr><td style="padding:0 32px 32px 32px;">
      <p style="margin:0; color:#475569; font-size:14px; line-height:1.6;">We look forward to seeing you there!</p>
      <p style="margin:14px 0 0 0; color:#0b1b33; font-size:13px; font-weight:700;">${FROM_NAME} Team</p>
    </td></tr>
  `);

  const result = await sendMail({
    to: opts.to,
    subject: `You're Invited! ${eventTitle} – GDGoC GCEE`,
    html,
  });
  console.log(`[mailer] sendEventEmail -> ${opts.to} (${result.success ? 'sent' : 'failed'})`);
  return result;
}

export const sendWelcomeEmail = sendThankYouEmail;
export const sendEventRegistrationEmail = sendEventEmail;

export async function sendBulkEventRegistrationEmails(opts: {
  recipients: Array<{ email: string; name: string }>;
  event: {
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    poster?: string;
    registrationLink?: string;
  };
  batchSize?: number;
  delayMs?: number;
}): Promise<{
  sentCount: number;
  failedCount: number;
  totalRecipients: number;
  failedEmails: string[];
}> {
  const { recipients, event, batchSize = 10, delayMs = 200 } = opts;
  let sentCount = 0;
  let failedCount = 0;
  const failedEmails: string[] = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (student) => {
        const res = await sendEventEmail({
          to: student.email,
          studentName: student.name,
          event,
        });
        if (res.success) {
          sentCount++;
        } else {
          failedCount++;
          failedEmails.push(student.email);
        }
      })
    );
    if (i + batchSize < recipients.length && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    sentCount,
    failedCount,
    totalRecipients: recipients.length,
    failedEmails,
  };
}

/**
 * Resend-compatible shim so existing email utilities (utils/email.ts, email.service.ts,
 * eventDistribution.controller.ts) keep working unchanged but now send via Gmail SMTP.
 * Mimics `resend.emails.send()` returning `{ data: { id } }` or `{ error }`.
 */
export function getResendCompatibleMailer() {
  return {
    emails: {
      send: async (msg: {
        from?: string;
        to?: string;
        replyTo?: string;
        subject?: string;
        html?: string;
        text?: string;
        attachments?: Array<{ filename: string; content: Buffer | string }>;
      }): Promise<{ data?: { id: string } | null; error?: { message: string } | null }> => {
        const result = await sendMail({
          to: msg.to || '',
          subject: msg.subject || '',
          html: msg.html || '',
          text: msg.text,
          replyTo: msg.replyTo,
          attachments: msg.attachments,
        });
        if (result.success) {
          return { data: { id: result.id || '' }, error: null };
        }
        return { data: null, error: { message: result.error || 'Email send failed.' } };
      },
    },
  };
}

/** Return type compatible across the app (unused internally; kept for API completeness). */
export type ResendCompatibleMailer = ReturnType<typeof getResendCompatibleMailer>;