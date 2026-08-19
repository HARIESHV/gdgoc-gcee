import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { connectDB, isConnected } from './config/db';

import authRoutes from './routes/auth.routes';
import adminAuthRoutes from './routes/adminAuth.routes';
import eventRoutes from './routes/event.routes';
import attendanceRoutes from './routes/attendance.routes';
import certificateRoutes from './routes/certificate.routes';
import memberRoutes from './routes/member.routes';
import galleryRoutes from './routes/gallery.routes';
import resourceRoutes from './routes/resource.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import dashboardRoutes from './routes/dashboard.routes';
import publicRoutes from './routes/public.routes';
import adminRoutes from './routes/admin.routes';
import googleFormRoutes, { registrationWebhookRouter } from './routes/googleForm.routes';
import { notFound, errorHandler } from './middleware/error';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);

  const allowedOrigins = env.isProd
    ? [env.appUrl, env.clientUrl].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

  app.use((req, res, next) => {
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          allowedOrigins.includes(origin)
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    })(req, res, next);
  });

  app.use(express.json({ limit: '12mb' }));
  app.use(express.urlencoded({ extended: true, limit: '12mb' }));
  app.use(cookieParser());

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 600,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path.startsWith('/api/events'),
    })
  );

  app.get('/api/health', (_req, res) => {
    const dbConnected = isConnected();
    res.status(dbConnected ? 200 : 503).json({
      success: dbConnected,
      database: dbConnected ? 'connected' : 'disconnected',
      status: dbConnected ? 'ok' : 'degraded',
      message: 'GDGoC GCEE API',
      time: new Date().toISOString(),
    });
  });

  // Ensure MongoDB is connected (cached) before handling API requests.
  app.use('/api', async (_req: Request, res: Response, next: NextFunction) => {
    if (isConnected()) {
      next();
      return;
    }
    try {
      await connectDB();
      next();
    } catch (err) {
      res.status(503).json({ success: false, message: 'Database connection unavailable. Please try again later.' });
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/admin/auth', adminAuthRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/gallery', galleryRoutes);
  app.use('/api/resources', resourceRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/google-form', googleFormRoutes);
  app.use('/api/registrations', registrationWebhookRouter);
  app.use('/api', publicRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
