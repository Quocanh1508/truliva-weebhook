import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import logger from '../utils/logger';
import { requireAuth } from '../middleware/authSession';

const router = Router();

/**
 * POST /api/auth/login
 * Đăng nhập bằng username + password
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Vui lòng nhập username và password' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Mật khẩu không đúng' });
      return;
    }

    // Set session cookie (httpOnly, 7 ngày)
    res.cookie('session_token', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info('User logged in', { userId: user.id, username: user.username });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error: any) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ error: 'Lỗi đăng nhập' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('session_token');
  res.json({ message: 'Đã đăng xuất' });
});

/**
 * GET /api/auth/me
 * Lấy thông tin user hiện tại
 */
router.get('/me', requireAuth, (req: Request, res: Response): void => {
  res.json({ user: req.user });
});

export default router;
