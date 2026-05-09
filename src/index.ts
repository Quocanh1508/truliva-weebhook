import dotenv from 'dotenv';
// ── Load biến môi trường ──
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import logger from './utils/logger';
import webhookRoutes from './routes/webhooks';
const app = express();
const PORT = process.env.PORT || 3000;

// ── Security middleware ──
app.use(helmet());
app.use(cors());

// ── Parse JSON body (giới hạn 1MB để tránh payload quá lớn) ──
app.use(express.json({ limit: '1mb' }));

// ── Request logging middleware (Step 6) ──
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
});

// ══════════════════════════════════════
//  ROUTES
// ══════════════════════════════════════

// ── GET /health - Kiểm tra server còn sống (Step 2) ──
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── Webhook routes (Step 2) ──
app.use('/webhooks', webhookRoutes);

// ── 404 handler ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ──
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: 'Internal server error' });
});

// ══════════════════════════════════════
//  START SERVER
// ══════════════════════════════════════
app.listen(PORT, () => {
  logger.info(`🚀 Truliva Webhook Server started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      'GET  /health',
      'POST /webhooks/pancake',
    ],
  });
});

export default app;
