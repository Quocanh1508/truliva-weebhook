import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware kiểm tra payload cơ bản từ Pancake (Step 4)
 * 
 * Đảm bảo request body có ít nhất `event_type`.
 * Nếu thiếu → trả 400 Bad Request.
 */
export function validateWebhookPayload(req: Request, res: Response, next: NextFunction): void {
  const body = req.body;

  // Kiểm tra body có phải object không
  if (!body || typeof body !== 'object') {
    logger.warn('Invalid payload: body is not an object', {
      ip: req.ip,
      contentType: req.headers['content-type'],
    });
    res.status(400).json({ error: 'Invalid payload: expected JSON object' });
    return;
  }

  // Kiểm tra trường event_type bắt buộc
  if (!body.event_type && !body.eventType && !body.type) {
    logger.warn('Invalid payload: missing event_type', {
      ip: req.ip,
      bodyKeys: Object.keys(body),
    });
    res.status(400).json({ error: 'Invalid payload: missing event_type field' });
    return;
  }

  next();
}
