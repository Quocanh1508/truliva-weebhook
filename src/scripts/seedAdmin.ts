import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const username = 'admin';
  const password = 'admin123';
  const fullName = 'Admin Truliva';

  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      console.log('⚠️  Tài khoản admin đã tồn tại, bỏ qua.');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        username,
        passwordHash,
        fullName,
        role: 'ADMIN',
      },
    });

    console.log('✅ Tạo tài khoản Admin thành công!');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   ID: ${admin.id}`);
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedAdmin();
