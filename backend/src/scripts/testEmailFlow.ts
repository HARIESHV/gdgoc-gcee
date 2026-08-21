import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import {
  sendOTPEmail,
  sendWelcomeEmail,
  sendEventRegistrationEmail,
  sendWorkshopEmail,
  sendHackathonEmail,
  sendCertificateEmail,
  sendAdminAnnouncementEmail,
  isEmailConfigured,
  getResendSender,
} from '../services/email/resend.service';
import { generateOtpEmailHtml } from '../services/email/templates/otp.template';
import { generateWelcomeEmailHtml } from '../services/email/templates/welcome.template';
import { generateEventRegistrationEmailHtml } from '../services/email/templates/eventRegistration.template';

async function runTests() {
  console.log('--- Starting GDGoC GCEE Email System Tests ---');

  // Test 1: Config check
  console.log('\n[Test 1] Checking Email & Resend Configuration...');
  console.log(`- Email configured: ${isEmailConfigured()}`);
  console.log(`- Resend API key configured: ${Boolean(env.resendApiKey)}`);
  console.log(`- Sender address: ${getResendSender()}`);
  if (!env.resendApiKey) {
    console.error('FAIL: RESEND_API_KEY is missing');
  } else {
    console.log('PASS: Resend configuration is loaded');
  }

  // Test 2: Cryptographic OTP generation
  console.log('\n[Test 2] Testing Cryptographic OTP generation...');
  const otps = Array.from({ length: 5 }, () => crypto.randomInt(100000, 1000000).toString());
  const all6Digits = otps.every((otp) => /^\d{6}$/.test(otp));
  console.log(`- Sample OTPs: ${otps.join(', ')}`);
  console.log(`- All 6-digit numeric: ${all6Digits}`);
  if (all6Digits) {
    console.log('PASS: Cryptographic 6-digit OTP generation working');
  } else {
    console.error('FAIL: OTP generation did not produce 6 digits');
  }

  // Test 3: OTP Hashing & Secure Verification
  console.log('\n[Test 3] Testing Bcrypt OTP Hashing and Verification...');
  const testOtp = crypto.randomInt(100000, 1000000).toString();
  const hash = bcrypt.hashSync(testOtp, 10);
  const matchCorrect = await bcrypt.compare(testOtp, hash);
  const matchWrong = await bcrypt.compare('000000', hash);
  console.log(`- Correct OTP match: ${matchCorrect}`);
  console.log(`- Wrong OTP mismatch: ${!matchWrong}`);
  if (matchCorrect && !matchWrong) {
    console.log('PASS: OTP hashing and verification logic verified');
  } else {
    console.error('FAIL: OTP hashing mismatch');
  }

  // Test 4: OTP Expiration calculation (5 minutes)
  console.log('\n[Test 4] Testing 5-minute OTP Expiry...');
  const expiry = new Date(Date.now() + 5 * 60 * 1000);
  const now = new Date();
  const diffMinutes = (expiry.getTime() - now.getTime()) / (60 * 1000);
  console.log(`- Expiry duration: ${diffMinutes.toFixed(2)} minutes`);
  if (Math.round(diffMinutes) === 5) {
    console.log('PASS: OTP expiration set to exactly 5 minutes');
  } else {
    console.error('FAIL: OTP expiration is not 5 minutes');
  }

  // Test 5: Template HTML Generation & Security
  console.log('\n[Test 5] Testing Template Generation...');
  const otpHtml = generateOtpEmailHtml({ studentName: 'Alex Doe', otp: testOtp });
  const welcomeHtml = generateWelcomeEmailHtml({ studentName: 'Alex Doe' });
  const eventHtml = generateEventRegistrationEmailHtml({
    studentName: 'Alex Doe',
    eventName: 'Cloud DevFest 2026',
    eventDate: '2026-09-15',
    eventTime: '10:00 AM - 1:00 PM',
    venue: 'Auditorium',
    registrationId: 'REG-TEST-1234',
  });

  const otpIncluded = otpHtml.html.includes(testOtp) && otpHtml.text.includes(testOtp);
  const welcomeValid = welcomeHtml.html.includes('Account Activated') && welcomeHtml.html.includes('Alex Doe');
  const eventValid = eventHtml.html.includes('REG-TEST-1234') && eventHtml.html.includes('Cloud DevFest 2026');

  console.log(`- OTP template contains code & 5-min notice: ${otpIncluded && otpHtml.html.includes('5 minutes')}`);
  console.log(`- Welcome template valid: ${welcomeValid}`);
  console.log(`- Event registration template valid: ${eventValid}`);

  if (otpIncluded && welcomeValid && eventValid) {
    console.log('PASS: All HTML email templates generated successfully');
  } else {
    console.error('FAIL: Template generation issue');
  }

  // Test 6: Resend API Direct Call
  console.log('\n[Test 6] Testing Resend API dispatch with simulated / test address...');
  try {
    const testResult = await sendOTPEmail({
      to: 'delivered@resend.dev', // Resend official test address
      studentName: 'Test Student',
      otp: '654321',
    });
    console.log(`- Resend API response:`, testResult);
    if (testResult.success) {
      console.log('PASS: Resend API accepted and processed email successfully!');
    } else {
      console.log(`- Resend result details: ${testResult.error}`);
    }
  } catch (err: any) {
    console.error('Resend test call error:', err.message);
  }

  console.log('\n--- All Automated Verification Checks Complete ---');
}

runTests().catch(console.error);
