import { createApp } from '../backend/src/app';

// Vercel serverless entry point.
// IMPORTANT: no app.listen() here — Vercel invokes the Express app as the
// request handler for every /api/* request. MongoDB is connected lazily per
// request by the middleware in backend/src/app.ts (cached across warm invocations).
let app: ReturnType<typeof createApp>;

try {
  app = createApp();
} catch (err) {
  console.error('[api/index] Failed to create Express app:', err);
  app = ((_req: any, res: any) => {
    res.status(500).json({ success: false, message: 'Server failed to start.' });
  }) as any;
}

export default app;
