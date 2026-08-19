import bcrypt from 'bcryptjs';
import type { Response } from 'express';
import { Student } from '../models/Student';
import { env } from '../config/env';
import { signToken } from '../utils/jwt';
import type { AuthRequest } from '../middleware/auth';
import { connectDB } from '../config/db';
import { sendStudentConfirmationEmail } from '../utils/email';

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
    const student = await Student.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      rollNumber: rollNumber || '',
      department: department || '',
      year: year || '',
      college: 'Government College of Engineering, Erode',
      passwordHash,
    });

    const token = signToken({ id: String(student._id), role: 'student' });
    setAuthCookie(res, token);

    let emailSent = false;
    let emailError = '';

    const studentEmail = student.email;
    if (studentEmail && emailRegex.test(studentEmail)) {
      try {
        const emailResult = await sendStudentConfirmationEmail({ to: studentEmail, studentName: student.name });
        emailSent = emailResult.success;
        if (!emailResult.success) {
          emailError = emailResult.error || 'Email delivery failed.';
          console.error('[auth] Confirmation email failed for', studentEmail, ':', emailError);
        }
      } catch (emailErr: any) {
        emailError = emailErr.message || 'Email sending exception.';
        console.error('[auth] Confirmation email exception for', studentEmail, ':', emailError);
      }
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? 'Account created. Welcome to GDGoC GCEE!'
        : 'Account created successfully, but we could not send the confirmation email. Please verify your email address or contact the admin team.',
      emailSent,
      emailError: emailSent ? undefined : emailError || undefined,
      token,
      student: publicStudent(student),
    });
  } catch (err: any) {
    console.error('[auth] register error:', err.message);
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
