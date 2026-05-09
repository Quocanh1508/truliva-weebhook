/**
 * Script xử lý lại các raw events đã có trong DB (status = PENDING).
 * Chạy 1 lần để bóc tách dữ liệu cũ vào bảng nghiệp vụ.
 * 
 * Usage: npx ts-node src/scripts/reprocessEvents.ts
 */
import 'dotenv/config';
import prisma from '../config/database';
import { routeEvent } from '../services/eventRouter';
import logger from '../utils/logger';

async function reprocess() {
  console.log('🔄 Bắt đầu xử lý lại các raw events...\n');

  const pendingEvents = await prisma.webhookRawEvent.findMany({
    where: { status: 'PENDING' },
    orderBy: { receivedAt: 'asc' },
  });

  console.log(`📦 Tìm thấy ${pendingEvents.length} events cần xử lý.\n`);

  for (const event of pendingEvents) {
    console.log(`  → Processing: ${event.eventType} | ID: ${event.externalEventId}`);
    
    // routeEvent chạy fire-and-forget, nhưng ở đây ta cần đợi
    // Nên gọi trực tiếp processor
    const { processOrderEvent } = await import('../services/orderProcessor');
    const { processCustomerEvent } = await import('../services/customerProcessor');

    const eventType = event.eventType.toLowerCase().trim();
    const payload = event.payload as any;

    if (eventType === 'customers' || eventType === 'customer') {
      await processCustomerEvent(event.id, payload);
    } else if (payload.system_id !== undefined) {
      await processOrderEvent(event.id, payload);
    } else {
      console.log(`  ⚠️  Skipped: unknown event type "${eventType}"`);
    }
  }

  // Tổng kết
  const stats = await prisma.webhookRawEvent.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('\n📊 Kết quả:');
  stats.forEach(s => {
    console.log(`  ${s.status}: ${s._count} events`);
  });

  await prisma.$disconnect();
  console.log('\n✅ Hoàn tất!');
}

reprocess().catch(e => {
  console.error('❌ Lỗi:', e);
  process.exit(1);
});
