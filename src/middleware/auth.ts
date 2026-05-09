import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware xác thực webhook từ Pancake (Step 4 - Final)
 * 
 * Pancake KHÔNG gửi token trong header.
 * Cơ chế bảo vệ: Secret Key trong URL query string.
 * 
 * Ví dụ URL: /webhooks/pancake?secret=your-secret-token
 * 
 * Bên cạnh đó, giới hạn chỉ chấp nhận request từ IP của Pancake.
 */
export function verifyPancakeToken(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.PANCAKE_WEBHOOK_SECRET;

  if (!secret) {
    logger.error('PANCAKE_WEBHOOK_SECRET is not configured in environment');
    res.status(500).json({ error: 'Server misconfigured' });
    return;
  }

  // ── Kiểm tra secret qua URL query string ──
  // URL phải có dạng: /webhooks/pancake?secret=your-secret-token
  const querySecret = req.query.secret as string | undefined;

  if (!querySecret || querySecret !== secret) {
    logger.warn('Unauthorized webhook attempt', {
      ip: req.ip,
      hasSecret: !!querySecret,
    });
    res.status(401).json({ error: 'Unauthorized: Invalid or missing secret' });
    return;
  }

  next();
}
