import { useEffect, useState } from 'react';
import { fetchApi } from '../../api/client';
import { FileText, CheckCircle, Clock, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/reports/stats')
      .then(data => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10"><span className="spinner border-t-[#1B3A6B]"></span></div>;
  if (!stats) return <div className="alert alert-error">Lỗi tải dữ liệu</div>;

  return (
    <div className="animate-fade-in">
      <h2 className="font-bold text-2xl mb-6 text-[#1B3A6B]">Tổng quan hệ thống</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="card flex flex-col gap-2">
          <div className="text-gray-500 font-medium flex items-center gap-2"><FileText size={18}/> Tổng báo cáo</div>
          <div className="text-3xl font-bold">{stats.totalReports}</div>
        </div>
        
        <div className="card flex flex-col gap-2">
          <div className="text-green-600 font-medium flex items-center gap-2"><CheckCircle size={18}/> Đã thanh toán</div>
          <div className="text-3xl font-bold">{stats.totalPaid}</div>
        </div>

        <div className="card flex flex-col gap-2">
          <div className="text-amber-600 font-medium flex items-center gap-2"><Clock size={18}/> Chờ thanh toán</div>
          <div className="text-3xl font-bold">{stats.totalUnpaid}</div>
        </div>

        <div className="card flex flex-col gap-2">
          <div className="text-blue-600 font-medium flex items-center gap-2"><DollarSign size={18}/> Tổng chi phí</div>
          <div className="text-2xl font-bold">{(stats.totalServiceCost + stats.totalAdditionalCost).toLocaleString('vi-VN')} đ</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div className="card">
          <h3 className="font-bold mb-4">Theo loại dịch vụ</h3>
          {stats.byServiceType.map((s: any) => (
            <div key={s.type} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
              <span>{s.type || 'Khác'}</span>
              <span className="font-bold">{s.count}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="font-bold mb-4">Top Tỉnh / Thành phố</h3>
          {stats.byProvince.map((p: any) => (
            <div key={p.province} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
              <span>{p.province || 'Không rõ'}</span>
              <span className="font-bold">{p.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
