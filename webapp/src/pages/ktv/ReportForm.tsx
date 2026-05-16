import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi, getOrders } from '../../api/client';
import ImageUploader from '../../components/ImageUploader';
import { CheckCircle } from 'lucide-react';

const PRODUCTS = [
  'UR61096H', 'UR5840', 'UR5676', 'UR5640', 'UR5440', 'W6412 ECO', 'UR3626',
  'Lõi lọc PGP', 'Lõi lọc CTO', 'Lõi lọc RO'
];

const SERVICE_TYPES = [
  'Giao hàng',
  'Lắp đặt',
  'Thay lõi lọc',
  'Giao hàng và lắp đặt',
  'Bảo hành',
  'Sửa chữa'
];

export default function ReportForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [province, setProvince] = useState('');
  const [products, setProducts] = useState<string[]>([]);
  const [serviceType, setServiceType] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [serviceCost, setServiceCost] = useState('');
  const [additionalCost, setAdditionalCost] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    getOrders({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' })
      .then(res => setOrders(res.orders))
      .catch(err => console.error('Lỗi tải đơn hàng', err));
  }, []);

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    if (!orderId) {
      setCustomerName('');
      setCustomerPhone('');
      setProvince('');
      return;
    }
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setCustomerName(order.billFullName || order.customer?.fullName || '');
      setCustomerPhone(order.billPhoneNumber || order.customer?.phoneNumber || '');
      setProvince(order.shippingAddress?.province_name || order.customer?.provinceName || '');
    }
  };

  const handleProductToggle = (prod: string) => {
    if (products.includes(prod)) {
      setProducts(products.filter(p => p !== prod));
    } else {
      setProducts([...products, prod]);
    }
  };

  const handleUploadSuccess = (urls: string[]) => {
    setImageUrls(urls);
    setStep(4);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fetchApi('/reports', {
        method: 'POST',
        body: JSON.stringify({
          customerName,
          customerPhone,
          province,
          products,
          serviceType,
          serialNumber,
          distanceKm,
          serviceCost,
          additionalCost,
          notes,
          imageUrls,
          orderId: selectedOrderId || undefined,
        })
      });
      navigate('/ktv/my-reports');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto animate-fade-in">
      <h2 className="font-bold text-2xl mb-6 text-center text-[#1B3A6B]">Báo Cáo Hoàn Thành Ca</h2>
      
      {/* Steps indicator */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-0 h-1 bg-[#1B3A6B] -z-10 transform -translate-y-1/2 transition-all duration-300" style={{ width: `${(step - 1) * 33.33}%` }}></div>
        
        {[1, 2, 3, 4].map(num => (
          <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= num ? 'bg-[#1B3A6B] text-white' : 'bg-gray-200 text-gray-500'}`}>
            {step > num ? <CheckCircle size={16} /> : num}
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Khách hàng */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h3 className="font-bold mb-4 text-lg">1. Thông tin khách hàng</h3>
            <div className="form-group bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-6">
              <label className="form-label text-blue-800 font-semibold mb-2 flex items-center gap-2">
                📦 Điền tự động từ đơn hàng được giao
              </label>
              <select 
                className="form-select bg-white border-blue-200 focus:border-blue-500 focus:ring-blue-500 text-sm" 
                value={selectedOrderId} 
                onChange={(e) => handleOrderSelect(e.target.value)}
              >
                <option value="">-- Tự nhập thông tin (Không chọn đơn) --</option>
                {orders.map(o => {
                  const name = o.billFullName || o.customer?.fullName || 'Khách';
                  const addr = o.shippingAddress?.province_name || o.customer?.provinceName || '';
                  return (
                    <option key={o.id} value={o.id}>
                      Đơn #{o.pancakeOrderId} - {name} {addr ? `(${addr})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tên khách hàng *</label>
              <input type="text" className="form-input" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Số điện thoại *</label>
              <input type="tel" className="form-input" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Tỉnh / Thành phố *</label>
              <input type="text" className="form-input" value={province} onChange={e => setProvince(e.target.value)} required />
            </div>
            <button type="button" className="btn btn-primary w-full" onClick={() => setStep(2)} disabled={!customerName || !customerPhone || !province}>
              Tiếp tục
            </button>
          </div>
        )}

        {/* Step 2: Dịch vụ */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h3 className="font-bold mb-4 text-lg">2. Chi tiết dịch vụ</h3>
            <div className="form-group">
              <label className="form-label">Loại dịch vụ *</label>
              <select className="form-select" value={serviceType} onChange={e => setServiceType(e.target.value)} required>
                <option value="">Chọn dịch vụ...</option>
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sản phẩm / Lõi lọc</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {PRODUCTS.map(p => (
                  <label key={p} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50" style={{ borderColor: products.includes(p) ? '#1B3A6B' : '#e2e8f0', backgroundColor: products.includes(p) ? '#eff6ff' : 'transparent' }}>
                    <input type="checkbox" checked={products.includes(p)} onChange={() => handleProductToggle(p)} />
                    <span className="text-sm">{p}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Số serial</label>
              <input type="text" className="form-input" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Khoảng cách di chuyển (km)</label>
              <input type="number" className="form-input" value={distanceKm} onChange={e => setDistanceKm(e.target.value)} />
            </div>
            <div className="flex gap-4">
              <button type="button" className="btn btn-outline flex-1" onClick={() => setStep(1)}>Quay lại</button>
              <button type="button" className="btn btn-primary flex-1" onClick={() => setStep(3)} disabled={!serviceType}>Tiếp tục</button>
            </div>
          </div>
        )}

        {/* Step 3: Upload ảnh */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h3 className="font-bold mb-4 text-lg">3. Hình ảnh xác nhận</h3>
            <p className="text-sm text-gray-500 mb-4">Cần 5 hình ảnh (tổng quan, biên bản, thanh toán, chuyển khoản, tem mác...)</p>
            
            {imageUrls.length > 0 ? (
              <div className="mb-4">
                <div className="alert alert-success flex items-center gap-2">
                  <CheckCircle size={20} /> Đã upload {imageUrls.length} ảnh thành công!
                </div>
                <div className="flex gap-4">
                  <button type="button" className="btn btn-outline flex-1" onClick={() => setStep(2)}>Quay lại</button>
                  <button type="button" className="btn btn-primary flex-1" onClick={() => setStep(4)}>Tiếp tục</button>
                </div>
              </div>
            ) : (
              <>
                <ImageUploader onUploadSuccess={handleUploadSuccess} />
                <div className="mt-6 flex justify-between">
                  <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>Quay lại</button>
                  <button type="button" className="btn btn-outline text-gray-500" onClick={() => setStep(4)}>Bỏ qua (không khuyến nghị)</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Chi phí & Ghi chú */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h3 className="font-bold mb-4 text-lg">4. Chi phí & Ghi chú</h3>
            <div className="form-group">
              <label className="form-label">Chi phí dịch vụ (VNĐ)</label>
              <input type="number" className="form-input" value={serviceCost} onChange={e => setServiceCost(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Chi phí phát sinh (VNĐ)</label>
              <input type="number" className="form-input" value={additionalCost} onChange={e => setAdditionalCost(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Ghi chú khác</label>
              <textarea className="form-textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)}></textarea>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button type="button" className="btn btn-outline flex-1" onClick={() => setStep(3)}>Quay lại</button>
              <button type="submit" className="btn btn-primary flex-1 flex justify-center items-center" disabled={loading}>
                {loading ? <span className="spinner"></span> : 'Gửi báo cáo'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
