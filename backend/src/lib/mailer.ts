import {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendEventRegistrationEmail,
  sendWorkshopEmail,
  sendHackathonEmail,
  sendCertificateEmail,
  sendAdminAnnouncementEmail,
  sendBulkAnnouncementEmails,
  isEmailConfigured,
  getResendSender,
  type SendMailOptions,
  type SendMailResult,
} from '../services/email/resend.service';
import { env, CLUB } from '../config/env';

export {
  sendEmail,
  sendEmail as sendMail,
  sendOTPEmail,
  sendOTPEmail as sendOtpEmail,
  sendWelcomeEmail,
  sendEventRegistrationEmail,
  sendWorkshopEmail,
  sendHackathonEmail,
  sendCertificateEmail,
  sendAdminAnnouncementEmail,
  sendBulkAnnouncementEmails,
  isEmailConfigured,
  isEmailConfigured as emailIsConfigured,
  getResendSender,
  type SendMailOptions,
  type SendMailResult,
};

export const sendThankYouEmail = sendWelcomeEmail;

/** Send single event email */
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
  return sendAdminAnnouncementEmail({
    to: opts.to,
    studentName: opts.studentName,
    title: opts.event.title,
    description: opts.event.description,
    date: opts.event.date,
    time: opts.event.time,
    venue: opts.event.venue,
    posterUrl: opts.event.poster,
    registrationLink: opts.event.registrationLink,
    subject: `You're Invited! ${opts.event.title} – ${CLUB.name}`,
  });
}

/** Bulk event registration emails */
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
}) {
  return sendBulkAnnouncementEmails({
    recipients: opts.recipients,
    title: opts.event.title,
    description: opts.event.description,
    date: opts.event.date,
    time: opts.event.time,
    venue: opts.event.venue,
    posterUrl: opts.event.poster,
    registrationLink: opts.event.registrationLink,
    subject: `You're Invited! ${opts.event.title} – ${CLUB.name}`,
    batchSize: opts.batchSize,
    delayMs: opts.delayMs,
  });
}

/** Public config status safe to return to client/admin UI */
export function getEmailConfigStatus() {
  const configured = isEmailConfigured();
  const gmailConfigured = Boolean(env.gmail.user && env.gmail.appPassword);
  return {
    configured,
    provider: env.resendApiKey ? 'resend' : gmailConfigured ? 'gmail' : 'none',
    hasApiKey: Boolean(env.resendApiKey),
    hasUser: Boolean(env.gmail.user),
    hasFromEmail: Boolean(env.resendFromEmail || env.gmail.user),
    hasAppPassword: Boolean(env.gmail.appPassword),
    adminEmail: env.adminEmail || 'gdgocgcee@gmail.com',
    fromEmail: (env.resendFromEmail || env.gmail.user) || '',
  };
}

export function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Resend-compatible shim for legacy call-sites.
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
        const result = await sendEmail({
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

export type ResendCompatibleMailer = ReturnType<typeof getResendCompatibleMailer>;