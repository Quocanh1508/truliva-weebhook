import axios from 'axios';
import 'dotenv/config';

const SHOP_ID = '1635300067';
const API_KEY = process.env.PANCAKE_API_KEY;

async function testProductApi() {
  if (!API_KEY) {
    console.log('❌ Lỗi: Thiếu PANCAKE_API_KEY trong file .env');
    return;
  }

  console.log('🔄 Đang kết nối tới Pancake API...');

  try {
    // Thử gọi API lấy danh sách sản phẩm/phân loại
    const response = await axios.get(`https://pos.pages.fm/api/v1/shops/${SHOP_ID}/products/variations`, {
      params: { api_key: API_KEY, per_page: 5 }
    });

    if (response.data.success) {
      const items = response.data.data;
      console.log(`✅ Kết nối thành công! Đã lấy thử ${items.length} sản phẩm.`);
      if (items.length > 0) {
        console.log('\n--- CẤU TRÚC SẢN PHẨM MẪU ---');
        console.log(JSON.stringify(items[0], null, 2));
      }
    } else {
      console.log('❌ API trả về lỗi:', response.data);
    }
  } catch (error: any) {
    console.error('❌ Lỗi kết nối API:');
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testProductApi();
