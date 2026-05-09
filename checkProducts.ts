import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function checkProducts() {
  // Lấy 10 raw events mới nhất để soi
  const events = await prisma.webhookRawEvent.findMany({
    take: 10,
    orderBy: { receivedAt: 'desc' }
  });

  console.log(`\n🔍 Kiểm tra cấu trúc sản phẩm trong 10 events gần nhất:\n`);

  events.forEach((event: any, i: number) => {
    const payload = event.payload;
    console.log(`[${i+1}] ID: ${event.id} | Type: ${event.eventType}`);
    
    // Tìm thử các trường có khả năng chứa sản phẩm
    const possibleFields = ['items', 'order_items', 'products', 'line_items', 'details'];
    let found = false;

    possibleFields.forEach(field => {
      if (payload && payload[field]) {
        found = true;
        console.log(`   ✅ Tìm thấy trường "${field}":`, Array.isArray(payload[field]) ? `${payload[field].length} sản phẩm` : 'không phải mảng');
      }
    });

    if (!found && payload) {
      console.log(`   ❌ KHÔNG tìm thấy danh sách sản phẩm.`);
      // console.log(`      Các phím có sẵn:`, Object.keys(payload).join(', '));
    }
    console.log('--------------------------------------------------');
  });

  await prisma.$disconnect();
}

checkProducts().catch(console.error);
