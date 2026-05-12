import prisma from './src/config/database';

async function main() {
  console.log('🔄 Đang kiểm tra dữ liệu rác trong bảng Customer...');
  const customers = await prisma.customer.findMany();
  
  let count = 0;
  for (const c of customers) {
    const raw: any = c.rawData;
    if (raw && raw.type === 'products') {
      await prisma.customer.delete({ where: { id: c.id } });
      console.log(`🗑️ Đã xóa: ${raw.name} (ID: ${c.id})`);
      count++;
    }
  }
  
  console.log(`✅ Đã xóa thành công ${count} dữ liệu sản phẩm bị lưu nhầm vào bảng Customer.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
