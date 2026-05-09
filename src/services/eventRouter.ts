import { processCustomerEvent } from './customerProcessor';
import { processOrderEvent } from './orderProcessor';
import logger from '../utils/logger';

/**
 * Event Router — Bộ điều phối sự kiện.
 * 
 * Pancake webhook gửi payload theo cấu trúc:
 *   - Nhóm "orders": payload chứa `system_id`, `total_price`, `status_name`
 *   - Nhóm "customers": payload chứa `id` (UUID), `full_name`, nhưng KHÔNG có `system_id`
 *   - Nhóm "products": chưa xử lý (lưu raw)
 *
 * event_type trong payload thường là hành động: "create", "update"
 * Webhook route lấy nó làm eventType, nên ta cần phân loại bằng NỘI DUNG payload.
 */
export function routeEvent(rawEventId: string, eventType: string, payload: any): void {
  // Fire-and-forget: không await, chạy ngầm
  processEventAsync(rawEventId, eventType, payload);
}

async function processEventAsync(rawEventId: string, eventType: string, payload: any): Promise<void> {
  try {
    const detectedType = detectEventCategory(eventType, payload);

    switch (detectedType) {
      case 'order':
        await processOrderEvent(rawEventId, payload);
        break;

      case 'customer':
        await processCustomerEvent(rawEventId, payload);
        break;

      default:
        logger.info('Unhandled event category, raw data preserved', {
          rawEventId,
          eventType,
          detectedType,
        });
    }

  } catch (error: any) {
    logger.error('Event routing failed', {
      rawEventId,
      eventType,
      error: error.message,
    });
  }
}

/**
 * Phát hiện loại event dựa trên nội dung payload.
 * 
 * Logic ưu tiên:
 *   1. Nếu eventType rõ ràng (orders/customers) → dùng luôn
 *   2. Nếu eventType là hành động (create/update) → kiểm tra payload
 *   3. Kiểm tra các trường đặc trưng: system_id → order, id (UUID) → customer
 */
function detectEventCategory(eventType: string, payload: any): 'order' | 'customer' | 'unknown' {
  const normalized = eventType.toLowerCase().trim();

  // ── Nhóm rõ ràng từ tên event ──
  if (normalized === 'orders' || normalized === 'order' || normalized === 'order_created') {
    return 'order';
  }
  if (normalized === 'customers' || normalized === 'customer') {
    return 'customer';
  }

  // ── Nhóm hành động: phân loại bằng nội dung payload ──
  // Order luôn có system_id (số nguyên = ID đơn hàng Pancake)
  if (payload.system_id !== undefined) {
    return 'order';
  }

  // Customer có id dạng UUID và full_name, nhưng không có system_id
  if (payload.id && typeof payload.id === 'string' && payload.id.includes('-')) {
    return 'customer';
  }

  // ── Không xác định được ──
  return 'unknown';
}
