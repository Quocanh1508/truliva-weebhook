import axios from 'axios';
import prisma from '../config/database';
import 'dotenv/config';

const SHOP_ID = '1635300067';
const API_KEY = process.env.PANCAKE_API_KEY;

export async function syncProducts() {
  if (!API_KEY) {
    console.log('❌ Thiếu PANCAKE_API_KEY trong .env');
    return;
  }

  console.log('🔄 Bắt đầu lấy danh mục sản phẩm từ Pancake...');

  try {
    let allProducts: any[] = [];
    let page = 1;
    let hasMore = true;

    // Kéo toàn bộ sản phẩm (mỗi trang 100 cái)
    while (hasMore) {
      const response = await axios.get(`https://pos.pages.fm/api/v1/shops/${SHOP_ID}/products/variations`, {
        params: { api_key: API_KEY, per_page: 100, page: page }
      });

      if (response.data.success) {
        const items = response.data.data;
        allProducts = allProducts.concat(items);
        
        if (items.length < 100) {
          hasMore = false; // Đã hết
        } else {
          page++;
        }
      } else {
        console.log('❌ Lỗi API:', response.data);
        break;
      }
    }

    console.log(`✅ Lấy thành công ${allProducts.length} sản phẩm. Đang lưu vào Database...`);

    // Lưu vào Prisma
    let successCount = 0;
    for (const item of allProducts) {
      if (!item.id) continue; // Bỏ qua nếu không có ID

      try {
        const productInfo = item.product || {};
        const categories = productInfo.categories || [];
        const categoryName = categories.length > 0 ? categories[0].name : null;

        const pancakeProductId = String(item.id);
        const sku = item.display_id || productInfo.display_id || null;
        const name = productInfo.name || item.name || 'Sản phẩm không tên';
        const costPrice = Number(item.last_imported_price) || 0;
        const sellingPrice = Number(item.retail_price) || 0;
        const availableStock = Number(item.remain_quantity) || 0;
        const totalImported = Number(item.total_purchase_price) || 0;
        const isActive = !(item.is_hidden || item.is_removed);

        await prisma.product.upsert({
          where: { pancakeProductId: pancakeProductId },
          update: {
            sku,
            name,
            category: categoryName,
            costPrice,
            sellingPrice,
            availableStock,
            totalImported,
            rawData: item,
            isActive
          },
          create: {
            pancakeProductId,
            sku,
            name,
            category: categoryName,
            costPrice,
            sellingPrice,
            availableStock,
            totalImported,
            rawData: item,
            isActive
          }
        });
        successCount++;
      } catch (err: any) {
        console.error(`\n⚠️ Lỗi lưu sản phẩm ${item.display_id}:`);
        console.error(err); // In toàn bộ object lỗi để xem nguyên nhân gốc
      }
    }

    console.log(`\n🎉 Đã đồng bộ hoàn tất ${successCount}/${allProducts.length} sản phẩm!`);
    
  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Nếu chạy trực tiếp script này
if (require.main === module) {
  syncProducts();
}
