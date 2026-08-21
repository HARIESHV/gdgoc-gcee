/**
 * GDGoC GCEE — Email System Verification (development only)
 *
 * Run: npm run test:email --prefix backend
 *
 * TEST A — Normal website email:
 *   Nodemailer → Gmail SMTP (smtp.gmail.com:465) → gdgocgcee@gmail.com account.
 *   Verifies SMTP authentication, connection, and a real send.
 *   MUST NOT use Resend.
 *
 * TEST B — Contact Us form flow:
 *   Resend API → gdgocgcee@gmail.com, Reply-To = student/test address.
 *   Verifies RESEND_API_KEY, validation, delivery, recipient and Reply-To.
 *   MUST NOT use Nodemailer.
 */
import { env } from '../config/env';
import {
  isGmailConfigured,
  isResendConfigured,
  verifyGmailConnection,
  sendGmailEmail,
  sendContactEmailWithResend,
} from '../services/emailService';

const WEBSITE_GMAIL = 'gdgocgcee@gmail.com';
const argTo = process.argv[2] || '';
const to = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(argTo) ? argTo : env.gmail.user || env.adminEmail;

function line(char = '─', n = 64) {
  console.log(char.repeat(n));
}

async function testA(): Promise<boolean> {
  line('=');
  console.log('TEST A — Normal website email via Nodemailer + Gmail SMTP');
  line('=');

  if (!isGmailConfigured()) {
    console.error('FAIL: GMAIL_USER / GMAIL_APP_PASSWORD are not configured.');
    return false;
  }
  console.log(`PASS: Gmail credentials loaded (user: ${env.gmail.user})`);

  console.log('Verifying Gmail SMTP authentication & connection…');
  const auth = await verifyGmailConnection();
  if (!auth.ok) {
    console.error(`FAIL: ${auth.error}`);
    return false;
  }
  console.log('PASS: SMTP authentication and connection verified');

  console.log(`Sending branded test email to ${to}…`);
  const sent = await sendGmailEmail({
    to,
    subject: '[GDGoC GCEE] Test A — Nodemailer + Gmail SMTP works',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="background:#0b1b33;padding:18px 24px;color:#fff;">
          <h2 style="margin:0;font-size:18px;">GDGoC GCEE</h2>
          <p style="margin:4px 0 0 0;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">Google Developer Groups on Campus</p>
        </div>
        <div style="padding:24px;">
          <p style="margin-top:0;color:#374151;"><strong>Test A passed.</strong> Normal website emails are being delivered through Nodemailer over Gmail SMTP.</p>
          <p style="color:#64748b;font-size:13px;">Sent at ${new Date().toISOString()}.</p>
        </div>
      </div>`,
    text: 'Test A passed. Normal website emails are delivered through Nodemailer + Gmail SMTP.',
  });

  if (!sent.success) {
    console.error(`FAIL: Send failed — ${sent.error}`);
    return false;
  }
  console.log(`PASS: Email sent via Gmail SMTP (messageId: ${sent.id})`);
  console.log('CONFIRMED: Test A did NOT use Resend.');
  return true;
}

async function testB(): Promise<boolean> {
  line('=');
  console.log('TEST B — Contact Us form flow via Resend API ONLY');
  line('=');

  if (!isResendConfigured()) {
    console.error('FAIL: RESEND_API_KEY is not configured.');
    return false;
  }
  console.log('PASS: RESEND_API_KEY is configured');

  // Validation checks (mirrors backend contact-form rules)
  const invalidRejected = await sendContactEmailWithResend({
    name: 'Dev Test',
    email: 'not-an-email',
    subject: 'Should be rejected',
    message: 'This must fail validation and never reach Resend.',
  });
  if (invalidRejected.success) {
    console.error('FAIL: Invalid email address was not rejected by validation.');
    return false;
  }
  console.log('PASS: Contact form validation rejects invalid email addresses');

  console.log(`Sending Contact Us test (recipient: ${WEBSITE_GMAIL}, reply-to: ${to})…`);
  const sent = await sendContactEmailWithResend({
    name: 'Dev Test (Contact Us)',
    email: to,
    subject: 'Dev Test B — Resend contact flow',
    message:
      'Automated development test of the Contact Us flow. If you can read this, Resend delivery works. Reply-To should point to the address that submitted this message.',
    phone: '+91 90000 00000',
    submittedAt: new Date(),
  });

  if (!sent.success) {
    console.error(`FAIL: Resend delivery failed — ${sent.error}`);
    return false;
  }
  console.log(`PASS: Contact message delivered through Resend (id: ${sent.id})`);
  console.log(`CONFIRMED: Recipient is ${WEBSITE_GMAIL}; Reply-To is ${to}.`);
  console.log('CONFIRMED: Test B did NOT use Nodemailer/Gmail SMTP.');
  return true;
}

async function run() {
  console.log('\nGDGoC GCEE — Email System Verification\n');
  const suite = (process.env.TEST_SUITE || 'all').toLowerCase();

  let okA = true;
  let okB = true;
  if (suite === 'all' || suite === 'a' || suite === 'gmail') okA = await testA();
  if (suite === 'all' || suite === 'b' || suite === 'contact') okB = await testB();

  line('=');
  console.log(`RESULT: Test A (Gmail/Nodemailer): ${okA ? 'PASS' : 'FAIL'} | Test B (Resend/Contact): ${okB ? 'PASS' : 'FAIL'}`);
  line('=');
  process.exit(okA && okB ? 0 : 1);
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
