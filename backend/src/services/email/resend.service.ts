import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env, CLUB } from '../../config/env';
import { generateOtpEmailHtml, type OtpEmailOptions } from './templates/otp.template';
import { generateWelcomeEmailHtml, type WelcomeEmailOptions } from './templates/welcome.template';
import { generateEventRegistrationEmailHtml, type EventRegistrationEmailOptions } from './templates/eventRegistration.template';
import { generateAnnouncementEmailHtml, type AnnouncementEmailOptions } from './templates/announcement.template';
import { generateCertificateEmailHtml, type CertificateEmailOptions } from './templates/certificate.template';

let resendInstance: Resend | null = null;
function getResend(): Resend | null {
  if (env.resendApiKey) {
    if (!resendInstance) {
      resendInstance = new Resend(env.resendApiKey);
    }
    return resendInstance;
  }
  return null;
}

let smtpTransporter: Transporter | null = null;
function getSmtpTransporter(): Transporter | null {
  if (env.gmail.user && env.gmail.appPassword) {
    if (!smtpTransporter) {
      smtpTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: env.gmail.user,
          pass: env.gmail.appPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
    }
    return smtpTransporter;
  }
  return null;
}

export function isEmailConfigured(): boolean {
  return Boolean(env.resendApiKey || (env.gmail.user && env.gmail.appPassword));
}

export function getResendSender(): string {
  const fromName = env.resendFromName || CLUB.name;
  const fromEmail = env.resendFromEmail || 'onboarding@resend.dev';
  return `${fromName} <${fromEmail}>`;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer | string }>;
}

export interface SendMailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Centralized low-level email sender.
 * Tries Resend first if RESEND_API_KEY is set, or Gmail SMTP if configured.
 */
export async function sendEmail(opts: SendMailOptions): Promise<SendMailResult> {
  const cleanTo = (opts.to || '').trim().toLowerCase();
  if (!cleanTo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanTo)) {
    return { success: false, error: 'Invalid recipient email address format.' };
  }

  if (!isEmailConfigured()) {
    console.error('[email.service] Email service is not configured. Missing RESEND_API_KEY or Gmail SMTP credentials.');
    return { success: false, error: 'Email service is not configured on the server.' };
  }

  // 1. Send via Resend (primary)
  if (env.resendApiKey) {
    try {
      const resend = getResend()!;
      const from = getResendSender();

      const payload: any = {
        from,
        to: cleanTo,
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
        console.error('[email.service] Resend API rejected message:', {
          code: (res.error as any).statusCode || (res.error as any).name,
          message: res.error.message,
        });

        // If Gmail SMTP fallback exists, try it
        if (env.gmail.user && env.gmail.appPassword) {
          console.warn('[email.service] Falling back to Gmail SMTP...');
          return sendViaGmailSmtp(opts, cleanTo);
        }

        return { success: false, error: res.error.message || 'Resend delivery failed' };
      }

      return { success: true, id: res.data?.id };
    } catch (err: any) {
      console.error('[email.service] Resend unexpected error:', err.message);
      if (env.gmail.user && env.gmail.appPassword) {
        console.warn('[email.service] Falling back to Gmail SMTP after exception...');
        return sendViaGmailSmtp(opts, cleanTo);
      }
      return { success: false, error: err.message || 'Failed to send email via Resend' };
    }
  }

  // 2. Send via Gmail SMTP if Resend is not configured
  return sendViaGmailSmtp(opts, cleanTo);
}

async function sendViaGmailSmtp(opts: SendMailOptions, cleanTo: string): Promise<SendMailResult> {
  const transporter = getSmtpTransporter();
  if (!transporter) {
    return { success: false, error: 'No email service provider available.' };
  }

  try {
    const from = `${CLUB.name} <${env.gmail.user}>`;
    const info = await transporter.sendMail({
      from,
      to: cleanTo,
      replyTo: opts.replyTo,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      attachments: opts.attachments,
    });
    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error('[email.service] Gmail SMTP error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 1. Send OTP Email
 */
export async function sendOTPEmail(opts: {
  to: string;
  studentName?: string;
  otp: string;
}): Promise<SendMailResult> {
  const { subject, html, text } = generateOtpEmailHtml({
    studentName: opts.studentName,
    otp: opts.otp,
  });

  return sendEmail({
    to: opts.to,
    subject,
    html,
    text,
  });
}

/**
 * 2. Send Welcome Email upon successful registration / verification
 */
export async function sendWelcomeEmail(opts: {
  to: string;
  studentName?: string;
}): Promise<SendMailResult> {
  const { subject, html, text } = generateWelcomeEmailHtml({
    studentName: opts.studentName,
  });

  return sendEmail({
    to: opts.to,
    subject,
    html,
    text,
  });
}

/**
 * 3. Send Event Registration Confirmation Email
 */
export async function sendEventRegistrationEmail(opts: {
  to: string;
  studentName?: string;
  eventName: string;
  eventDate: string;
  eventTime?: string;
  venue?: string;
  registrationId: string;
  instructions?: string;
}): Promise<SendMailResult> {
  const { subject, html, text } = generateEventRegistrationEmailHtml(opts);

  return sendEmail({
    to: opts.to,
    subject,
    html,
    text,
  });
}

/**
 * 4. Send Workshop Announcement / Invitation Email
 */
export async function sendWorkshopEmail(opts: {
  to: string;
  studentName?: string;
  title: string;
  date?: string;
  time?: string;
  venue?: string;
  description?: string;
  customMessage?: string;
  posterUrl?: string;
  registrationLink?: string;
  deadline?: string;
}): Promise<SendMailResult> {
  const { subject, html, text } = generateAnnouncementEmailHtml({
    ...opts,
    type: 'Workshop',
    subject: `Workshop Invitation: ${opts.title} – ${CLUB.name}`,
  });

  return sendEmail({
    to: opts.to,
    subject,
    html,
    text,
  });
}

/**
 * 5. Send Hackathon Announcement / Invitation Email
 */
export async function sendHackathonEmail(opts: {
  to: string;
  studentName?: string;
  title: string;
  date?: string;
  time?: string;
  venue?: string;
  description?: string;
  customMessage?: string;
  posterUrl?: string;
  registrationLink?: string;
  deadline?: string;
}): Promise<SendMailResult> {
  const { subject, html, text } = generateAnnouncementEmailHtml({
    ...opts,
    type: 'Hackathon',
    subject: `Hackathon Announcement: ${opts.title} – ${CLUB.name}`,
  });

  return sendEmail({
    to: opts.to,
    subject,
    html,
    text,
  });
}

/**
 * 6. Send Certificate Ready Email
 */
export async function sendCertificateEmail(opts: {
  to: string;
  studentName?: string;
  eventName?: string;
  certificateId: string;
  verificationUrl: string;
  downloadUrl?: string;
}): Promise<SendMailResult> {
  const { subject, html, text } = generateCertificateEmailHtml(opts);

  return sendEmail({
    to: opts.to,
    subject,
    html,
    text,
  });
}

/**
 * 7. Send Admin Announcement Email
 */
export async function sendAdminAnnouncementEmail(opts: {
  to: string;
  studentName?: string;
  title: string;
  type?: string;
  date?: string;
  time?: string;
  venue?: string;
  description?: string;
  customMessage?: string;
  posterUrl?: string;
  registrationLink?: string;
  deadline?: string;
  subject?: string;
}): Promise<SendMailResult> {
  const { subject, html, text } = generateAnnouncementEmailHtml(opts);

  return sendEmail({
    to: opts.to,
    subject,
    html,
    text,
  });
}

/**
 * 8. Send Bulk Announcements
 */
export async function sendBulkAnnouncementEmails(opts: {
  recipients: Array<{ email: string; name?: string }>;
  title: string;
  type?: string;
  date?: string;
  time?: string;
  venue?: string;
  description?: string;
  customMessage?: string;
  posterUrl?: string;
  registrationLink?: string;
  deadline?: string;
  subject?: string;
  batchSize?: number;
  delayMs?: number;
}): Promise<{
  sentCount: number;
  failedCount: number;
  totalRecipients: number;
  failedEmails: string[];
}> {
  const { recipients, batchSize = 10, delayMs = 150 } = opts;
  let sentCount = 0;
  let failedCount = 0;
  const failedEmails: string[] = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (student) => {
        const res = await sendAdminAnnouncementEmail({
          to: student.email,
          studentName: student.name,
          title: opts.title,
          type: opts.type,
          date: opts.date,
          time: opts.time,
          venue: opts.venue,
          description: opts.description,
          customMessage: opts.customMessage,
          posterUrl: opts.posterUrl,
          registrationLink: opts.registrationLink,
          deadline: opts.deadline,
          subject: opts.subject,
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
