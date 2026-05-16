import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import logger from '../utils/logger';
import { requireAuth, requireAdmin } from '../middleware/authSession';
import { Prisma } from '@prisma/client';

const router = Router();

/**
 * GET /api/orders
 * Lấy danh sách đơn hàng với hỗ trợ phân trang và bộ lọc/sắp xếp
 */
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = '1', 
      limit = '50',
      sortBy = 'createdAt', // appointmentTime, createdAt, updatedAt
      sortOrder = 'desc',   // asc, desc
      status,               // custom adminStatus
      search                // search theo tên, sdt, mã đơn
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Xây dựng điều kiện tìm kiếm
    const where: Prisma.OrderWhereInput = {};
    
    // Nếu user là KTV, chỉ lấy các đơn hàng được giao cho KTV đó
    if (req.user?.role === 'KTV') {
      where.assignedKtvId = req.user.id;
    }

    if (status) {
      where.adminStatus = status as string;
    }

    if (search) {
      const searchStr = String(search).trim();
      where.OR = [
        { billFullName: { contains: searchStr, mode: 'insensitive' } },
        { billPhoneNumber: { contains: searchStr } },
      ];
      // Nếu có thể parse sang int, tìm theo mã đơn Pancake
      const pancakeId = parseInt(searchStr, 10);
      if (!isNaN(pancakeId)) {
        where.OR.push({ pancakeOrderId: pancakeId });
      }
    }

    // Xây dựng điều kiện sắp xếp
    const orderBy: Prisma.OrderOrderByWithRelationInput = {};
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    
    if (sortBy === 'appointmentTime') {
      orderBy.appointmentTime = orderDirection;
    } else if (sortBy === 'updatedAt') {
      orderBy.updatedAt = orderDirection;
    } else {
      orderBy.createdAt = orderDirection;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limitNumber,
        include: {
          items: true,
          customer: {
            select: {
              fullName: true,
              phoneNumber: true,
            }
          },
          assignedKtv: {
            select: {
              id: true,
              fullName: true,
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error: any) {
    logger.error('Get orders error', { error: error.message });
    res.status(500).json({ error: 'Lỗi lấy danh sách đơn hàng' });
  }
});

/**
 * PATCH /api/orders/:id
 * Cập nhật trạng thái admin và ngày hẹn
 */
router.patch('/:id', requireAuth, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { adminStatus, appointmentTime, assignedKtvId } = req.body;

    const updateData: any = {};
    if (adminStatus !== undefined) updateData.adminStatus = adminStatus;
    if (assignedKtvId !== undefined) updateData.assignedKtvId = assignedKtvId || null;
    if (appointmentTime !== undefined) {
       updateData.appointmentTime = appointmentTime ? new Date(appointmentTime) : null;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    logger.info('Order updated by admin', { orderId: id, by: req.user?.id, updateData });
    res.json({ order });
  } catch (error: any) {
    logger.error('Update order error', { error: error.message });
    res.status(500).json({ error: 'Lỗi cập nhật đơn hàng' });
  }
});

export default router;
