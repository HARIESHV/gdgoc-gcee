import dotenv from 'dotenv';
import dns from 'node:dns';

dotenv.config();

// Workaround for environments whose system DNS server refuses SRV queries
// (Node's c-ares resolver gets ECONNREFUSED -> Mongo "querySrv ECONNREFUSED").
// Set FORCE_DNS to a comma-separated list of working nameservers (e.g. 8.8.8.8).
// Left unset in production (Vercel) so the platform resolver is used.
const forceDns = (process.env.FORCE_DNS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (forceDns.length > 0) {
  try {
    dns.setServers(forceDns);
    console.log(`[env] FORCE_DNS set: ${forceDns.join(', ')}`);
  } catch (err: any) {
    console.warn('[env] Failed to apply FORCE_DNS:', err.message);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gdgoc-gcee',
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  clientUrl: process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:5173',
  cookieSecure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@gdgocgcee.in',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@123',
  adminName: process.env.ADMIN_NAME || 'GDGoC GCEE Admin',
  gmail: {
    user: process.env.GMAIL_USER || '',
    appPassword: process.env.GMAIL_APP_PASSWORD || '',
  },
  googleFormWebhookSecret: process.env.GOOGLE_FORM_WEBHOOK_SECRET || '',
};

export const CLUB = {
  name: 'GDGoC GCEE',
  fullName: 'Google Developer Groups on Campus — Government College of Engineering, Erode',
  shortName: 'GDGoC',
  organization: 'GDGoC GCEE',
  institution: 'Government College of Engineering, Erode',
  timezone: 'Asia/Kolkata',
  websiteName: 'GDGoC GCEE',
};
