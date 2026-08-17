import dotenv from 'dotenv';

dotenv.config();

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
  email: {
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'GDGoC GCEE <noreply@gdgocgcee.in>',
    secure: process.env.EMAIL_SECURE === 'true',
  },
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
