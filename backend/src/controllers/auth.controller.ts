import bcrypt from 'bcryptjs';
import type { Response } from 'express';
import { Student } from '../models/Student';
import { env } from '../config/env';
import { signToken } from '../utils/jwt';
import type { AuthRequest } from '../middleware/auth';
import { connectDB } from '../config/db';
import { sendOtpEmail, sendThankYouEmail } from '../utils/email';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.cookieSecure,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

function setAuthCookie(res: Response, token: string) {
  res.cookie('gdgoc_token', token, COOKIE_OPTS);
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(otp: string): string {
  return bcrypt.hashSync(otp, 10);
}

export function publicStudent(student: any) {
  return {
    id: student._id,
    name: student.name,
    email: student.email,
    phone: student.phone,
    college: student.college,
    department: student.department,
    year: student.year,
    rollNumber: student.rollNumber,
    profileImage: student.profileImage,
    isVerified: student.isVerified || false,
    points: student.points,
    bio: student.bio,
    socialLinks: student.socialLinks,
    joinedAt: student.joinedAt,
  };
}

// POST /api/auth/register
export async function register(req: AuthRequest, res: Response) {
  try {
    await connectDB();

    const { name, email, phone, rollNumber, department, year, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email and password are required.' });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ success: false, message: 'Passwords do not match.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanRollNumber = (rollNumber || '').trim();

    // Check if an account with this email exists
    const existingEmail = await Student.findOne({ email: cleanEmail });
    if (existingEmail) {
      if (existingEmail.isVerified) {
        res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please log in.',
        });
        return;
      }
      // If student registered previously but never completed OTP verification, update with new details & password
      const passwordHash = await bcrypt.hash(password, 10);
      const otp = generateOtp();
      if (env.nodeEnv !== 'production') {
        console.log(`\n========================================\n[auth] 🔑 OTP for ${cleanEmail}: ${otp}\n========================================\n`);
      }
      const otpHash = hashOtp(otp);
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      existingEmail.name = name.trim();
      existingEmail.phone = (phone || '').trim();
      existingEmail.rollNumber = cleanRollNumber;
      existingEmail.department = (department || '').trim();
      existingEmail.year = (year || '').trim();
      existingEmail.passwordHash = passwordHash;
      existingEmail.otp = otpHash;
      existingEmail.otpExpiresAt = otpExpiresAt;
      await existingEmail.save();

      // Send OTP email and await result
      const sendRes = await sendOtpEmail({ to: cleanEmail, studentName: existingEmail.name, otp });
      if (!sendRes.success) {
        console.error(`[auth] OTP email failed for ${cleanEmail}:`, sendRes.error);
        res.status(500).json({
          success: false,
          message: 'Unable to send OTP email. Please check your email address and try again.',
        });
        return;
      }

      const token = signToken({ id: String(existingEmail._id), role: 'student' });
      setAuthCookie(res, token);

      res.status(200).json({
        success: true,
        message: 'Account updated. Please verify your email with the OTP sent.',
        token,
        student: publicStudent(existingEmail),
        requiresVerification: true,
      });
      return;
    }

    if (cleanRollNumber) {
      const existingRoll = await Student.findOne({ rollNumber: cleanRollNumber, isVerified: true });
      if (existingRoll) {
        res.status(409).json({
          success: false,
          message: 'This register number is already registered.',
        });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    if (env.nodeEnv !== 'production') {
      console.log(`\n========================================\n[auth] 🔑 OTP for ${cleanEmail}: ${otp}\n========================================\n`);
    }
    const otpHash = hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const student = await Student.create({
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || '').trim(),
      rollNumber: cleanRollNumber,
      department: (department || '').trim(),
      year: (year || '').trim(),
      college: 'Government College of Engineering, Erode',
      passwordHash,
      isVerified: false,
      otp: otpHash,
      otpExpiresAt,
    });

    // Send OTP email and await result
    const sendRes = await sendOtpEmail({ to: cleanEmail, studentName: student.name, otp });
    if (!sendRes.success) {
      console.error(`[auth] OTP email failed for ${cleanEmail}:`, sendRes.error);
      res.status(500).json({
        success: false,
        message: 'Unable to send OTP email. Please check your email address and try again.',
      });
      return;
    }

    const token = signToken({ id: String(student._id), role: 'student' });
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email with the OTP sent.',
      token,
      student: publicStudent(student),
      requiresVerification: true,
    });
  } catch (err: any) {
    console.error('[auth] register error:', err.message);
    res.status(503).json({ success: false, message: 'Database connection unavailable. Please try again.' });
  }
}

// POST /api/auth/send-otp
export async function sendOtp(req: AuthRequest, res: Response) {
  try {
    await connectDB();

    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const student = await Student.findOne({ email: cleanEmail });
    if (!student) {
      res.status(404).json({ success: false, message: 'No account found with this email.' });
      return;
    }

    if (student.isVerified) {
      res.json({ success: true, message: 'Email is already verified. You can log in.' });
      return;
    }

    const otp = generateOtp();
    if (env.nodeEnv !== 'production') {
      console.log(`\n========================================\n[auth] 🔑 Resent OTP for ${cleanEmail}: ${otp}\n========================================\n`);
    }
    const otpHash = hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    student.otp = otpHash;
    student.otpExpiresAt = otpExpiresAt;
    await student.save();

    const result = await sendOtpEmail({ to: student.email, studentName: student.name, otp });
    if (!result.success) {
      console.error(`[auth] Resend OTP email failed for ${cleanEmail}:`, result.error);
      res.status(500).json({
        success: false,
        message: 'Unable to send OTP email. Please try again.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email address.',
    });
  } catch (err: any) {
    console.error('[auth] sendOtp error:', err.message);
    res.status(503).json({ success: false, message: 'Database connection unavailable. Please try again.' });
  }
}

// POST /api/auth/verify-otp
export async function verifyOtp(req: AuthRequest, res: Response) {
  try {
    await connectDB();

    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const student = await Student.findOne({ email: cleanEmail });
    if (!student) {
      res.status(404).json({ success: false, message: 'No account found with this email.' });
      return;
    }

    if (student.isVerified) {
      const token = signToken({ id: String(student._id), role: 'student' });
      setAuthCookie(res, token);
      res.json({ success: true, message: 'Email is already verified.', token, student: publicStudent(student) });
      return;
    }

    if (!student.otp || !student.otpExpiresAt) {
      res.status(400).json({ success: false, message: 'No active OTP found. Please request a new one.' });
      return;
    }

    if (new Date() > student.otpExpiresAt) {
      res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      return;
    }

    const otpValid = await bcrypt.compare(cleanOtp, student.otp);
    if (!otpValid) {
      res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
      return;
    }

    // Atomic verify
    const updated = await Student.findOneAndUpdate(
      { _id: student._id },
      { $set: { isVerified: true }, $unset: { otp: 1, otpExpiresAt: 1 } },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Account not found.' });
      return;
    }

    // Send Thank You / Welcome email ONLY after successful verification
    if (updated.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updated.email)) {
      sendThankYouEmail({ to: updated.email, studentName: updated.name }).catch((err) => {
        console.error('[auth] Thank you email error:', err.message);
      });
    }

    // Generate token and automatically log student in
    const token = signToken({ id: String(updated._id), role: 'student' });
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to GDGoC GCEE.',
      token,
      student: publicStudent(updated),
    });
  } catch (err: any) {
    console.error('[auth] verifyOtp error:', err.message);
    res.status(503).json({ success: false, message: 'Database connection unavailable. Please try again.' });
  }
}

// POST /api/auth/login
export async function login(req: AuthRequest, res: Response) {
  try {
    await connectDB();

    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const identifier = String(email).trim().toLowerCase();
    const student = await Student.findOne({
      $or: [{ email: identifier }, { rollNumber: identifier.toUpperCase() }],
    });

    if (!student || !student.isActive) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const ok = await bcrypt.compare(String(password), student.passwordHash);
    if (!ok) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (!student.isVerified) {
      // Generate and send a fresh OTP immediately
      const otp = generateOtp();
      if (env.nodeEnv !== 'production') {
        console.log(`\n========================================\n[auth] 🔑 OTP for ${student.email}: ${otp}\n========================================\n`);
      }
      student.otp = hashOtp(otp);
      student.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await student.save();
      sendOtpEmail({ to: student.email, studentName: student.name, otp }).catch(() => null);

      res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. An OTP has been sent to your email.',
        requiresVerification: true,
        email: student.email,
        devOtp: env.nodeEnv !== 'production' ? otp : undefined,
      });
      return;
    }

    const token = signToken({ id: String(student._id), role: 'student' });
    setAuthCookie(res, token);
    res.json({ success: true, message: 'Welcome back!', token, student: publicStudent(student) });
  } catch (err: any) {
    console.error('[auth] login error:', err.message);
    res.status(503).json({ success: false, message: 'Database connection unavailable. Please try again.' });
  }
}

// POST /api/auth/logout
export async function logout(req: AuthRequest, res: Response) {
  res.clearCookie('gdgoc_token', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully.' });
}

// GET /api/auth/me
export async function me(req: AuthRequest, res: Response) {
  try {
    await connectDB();
    const student = await Student.findById(req.studentId).lean();
    if (!student) {
      res.status(404).json({ success: false, message: 'Account not found.' });
      return;
    }
    res.json({ success: true, student: publicStudent(student) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/auth/profile
export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    await connectDB();

    const allowed = ['name', 'phone', 'department', 'year', 'rollNumber', 'bio', 'profileImage', 'socialLinks'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const student = await Student.findByIdAndUpdate(req.studentId, update, { new: true, runValidators: true }).lean();
    if (!student) {
      res.status(404).json({ success: false, message: 'Account not found.' });
      return;
    }
    res.json({ success: true, message: 'Profile updated.', student: publicStudent(student) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/auth/password
export async function changePassword(req: AuthRequest, res: Response) {
  try {
    await connectDB();

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current and new password are required.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      return;
    }

    const student = await Student.findById(req.studentId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Account not found.' });
      return;
    }
    const ok = await bcrypt.compare(currentPassword, student.passwordHash);
    if (!ok) {
      res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      return;
    }
    student.passwordHash = await bcrypt.hash(newPassword, 10);
    await student.save();
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}
