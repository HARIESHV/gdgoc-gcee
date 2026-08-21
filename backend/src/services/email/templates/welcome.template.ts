import { baseEmailHtml, escapeHtml } from './base.template';
import { env, CLUB } from '../../../config/env';

export interface WelcomeEmailOptions {
  studentName?: string;
}

export function generateWelcomeEmailHtml(opts: WelcomeEmailOptions): { subject: string; html: string; text: string } {
  const name = escapeHtml(opts.studentName || 'Student');
  const siteUrl = escapeHtml(env.clientUrl || env.appUrl || 'https://gdgoc-gcee.vercel.app');
  const subject = 'Welcome to GDGoC GCEE — Registration Successful';

  const content = `
    <tr>
      <td style="padding:32px 32px 12px 32px;">
        <p style="margin:0; color:#1e293b; font-size:16px; line-height:1.5;">Dear <strong>${name}</strong>,</p>
        <p style="margin:16px 0 0 0; color:#475569; font-size:14px; line-height:1.6;">
          Thank you for joining the <strong>${CLUB.name}</strong> community!
        </p>
        <p style="margin:12px 0 0 0; color:#475569; font-size:14px; line-height:1.6;">
          Your student account has been successfully created and your email is verified. You are now officially part of our developer community at Government College of Engineering, Erode.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 32px;">
        <div style="background-color:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:14px 18px;">
          <p style="margin:0; color:#166534; font-size:13px; font-weight:700;">
            &#10003; Account Activated &amp; Email Verified
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px 32px 32px;">
        <p style="margin:0; color:#475569; font-size:14px; line-height:1.6;">
          You can now explore upcoming workshops, hackathons, coding challenges, tech sessions, and community events on the portal:
        </p>
        <p style="margin:24px 0; text-align:center;">
          <a href="${siteUrl}/dashboard" style="background-color:#4285F4; color:#ffffff; font-weight:700; font-size:14px; padding:12px 28px; border-radius:8px; text-decoration:none; display:inline-block; box-shadow:0 2px 4px rgba(66,133,244,0.3);">
            Access Student Dashboard
          </a>
        </p>
        <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;" />
        <p style="margin:0; color:#64748b; font-size:13px; line-height:1.5;">
          Best regards,<br/>
          <strong>${CLUB.name} Team</strong><br/>
          ${CLUB.institution}
        </p>
      </td>
    </tr>
  `;

  const text = `Dear ${opts.studentName || 'Student'},

Thank you for joining the GDGoC GCEE community!

Your student account has been successfully created and your email is verified. You are now officially part of our developer community at Government College of Engineering, Erode.

Explore upcoming workshops, hackathons, and community events on the portal:
${env.clientUrl || env.appUrl || 'https://gdgoc-gcee.vercel.app'}

Best regards,
GDGoC GCEE Team
Government College of Engineering, Erode`;

  return {
    subject,
    html: baseEmailHtml(content, 'Welcome to GDGoC GCEE! Your account has been verified.'),
    text,
  };
}
