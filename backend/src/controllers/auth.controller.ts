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

    const existing = await Student.findOne({ $or: [{ email: email.toLowerCase() }, { rollNumber: rollNumber || '' }] });
    if (existing) {
      res.status(409).json({
        success: false,
        message: existing.email === email.toLowerCase() ? 'An account with this email already exists.' : 'This roll number is already registered.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    if (env.nodeEnv !== 'production') console.log(`[auth] OTP for ${email}: ${otp} (dev only)`);
    const otpHash = hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const student = await Student.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      rollNumber: rollNumber || '',
      department: department || '',
      year: year || '',
      college: 'Government College of Engineering, Erode',
      passwordHash,
      isVerified: false,
      otp: otpHash,
      otpExpiresAt,
    });

    // Send OTP email
    const studentEmail = student.email;
    if (studentEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      sendOtpEmail({ to: studentEmail, studentName: student.name, otp }).catch((err) => {
        console.error('[auth] OTP email failed for', studentEmail, ':', err.message);
      });
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

    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) {
      res.status(404).json({ success: false, message: 'No account found with this email.' });
      return;
    }

    if (student.isVerified) {
      res.json({ success: true, message: 'Email is already verified. You can log in.' });
      return;
    }

    const otp = generateOtp();
    if (env.nodeEnv !== 'production') console.log(`[auth] OTP for ${email}: ${otp} (dev only)`);
    const otpHash = hashOtp(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    student.otp = otpHash;
    student.otpExpiresAt = otpExpiresAt;
    await student.save();

    const result = await sendOtpEmail({ to: student.email, studentName: student.name, otp });
    if (result.success) {
      res.json({ success: true, message: 'OTP sent to your email address.' });
    } else {
      res.status(500).json({ success: false, message: result.error || 'Failed to send OTP. Please try again.' });
    }
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

    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) {
      res.status(404).json({ success: false, message: 'No account found with this email.' });
      return;
    }

    if (student.isVerified) {
      res.json({ success: true, message: 'Email is already verified.' });
      return;
    }

    if (!student.otp || !student.otpExpiresAt) {
      res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
      return;
    }

    if (new Date() > student.otpExpiresAt) {
      res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      return;
    }

    const otpValid = await bcrypt.compare(otp, student.otp);
    if (!otpValid) {
      res.status(400).json({ success: false, message: 'Invalid OTP. Please check and try again.' });
      return;
    }

    // Atomic verify — prevents duplicate "Thank You" emails if the same request hits twice.
    // findOneAndUpdate only succeeds when the student is not yet verified.
    const updated = await Student.findOneAndUpdate(
      { _id: student._id, isVerified: false },
      { $set: { isVerified: true }, $unset: { otp: 1, otpExpiresAt: 1 } },
      { new: true }
    );

    if (!updated) {
      res.json({ success: true, message: 'Email is already verified.' });
      return;
    }

    // Send Thank You / Welcome email ONLY after successful verification.
    if (updated.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updated.email)) {
      const result = await sendThankYouEmail({ to: updated.email, studentName: updated.name });
      if (!result.success) {
        console.error('[auth] Thank you email failed for', updated.email, ':', result.error);
      }
    }

    res.json({ success: true, message: 'Email verified successfully! Welcome to GDGoC GCEE.' });
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

    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student || !student.isActive) {
      res.status(401).json({ success: false, message: 'Invalid credentials or account disabled.' });
      return;
    }

    if (!student.isVerified) {
      res.status(403).json({ success: false, message: 'Please verify your email before logging in.', requiresVerification: true, email: student.email });
      return;
    }

    const ok = await bcrypt.compare(password, student.passwordHash);
    if (!ok) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
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
