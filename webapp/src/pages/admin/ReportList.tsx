import { useEffect, useState } from 'react';
import { fetchApi } from '../../api/client';
import { Download, CheckCircle, Clock } from 'lucide-react';

export default function ReportList() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    loadReports();
  }, [filterMonth]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const url = filterMonth ? `/reports?month=${filterMonth}&limit=100` : '/reports?limit=100';
      const data = await fetchApi(url);
      setReports(data.reports);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const url = filterMonth ? `/api/reports/export?month=${filterMonth}` : '/api/reports/export';
    window.open(url, '_blank');
  };

  const togglePaidStatus = async (id: string, currentStatus: boolean) => {
    try {
      await fetchApi(`/reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPaid: !currentStatus })
      });
      loadReports();
    } catch (e) {
      alert('Lỗi cập nhật');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-2xl text-[#1B3A6B]">Danh sách báo cáo</h2>
        
        <div className="flex gap-4">
          <input 
            type="text" 
            className="form-input" 
            style={{ width: '150px', padding: '0.5rem' }} 
            placeholder="Tháng (vd: 5/2026)" 
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
          />
          <button className="btn btn-outline flex items-center gap-2" onClick={handleExport}>
            <Download size={18} /> Xuất Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10"><span className="spinner border-t-[#1B3A6B]"></span></div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px' }}>KTV</th>
                <th style={{ padding: '12px 16px' }}>Khách hàng</th>
                <th style={{ padding: '12px 16px' }}>Dịch vụ</th>
                <th style={{ padding: '12px 16px' }}>Tỉnh/TP</th>
                <th style={{ padding: '12px 16px' }}>Chi phí</th>
                <th style={{ padding: '12px 16px' }}>Trạng thái</th>
                <th style={{ padding: '12px 16px' }}>Hình ảnh</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="hover:bg-gray-50">
                  <td style={{ padding: '12px 16px' }} className="font-medium">{r.ktvUser.fullName}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div>{r.customerName}</div>
                    <div className="text-xs text-gray-500">{r.customerPhone}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div>{r.serviceType}</div>
                    <div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{r.province}</td>
                  <td style={{ padding: '12px 16px' }} className="font-bold">
                    {((r.serviceCost || 0) + (r.additionalCost || 0)).toLocaleString('vi-VN')} đ
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button 
                      onClick={() => togglePaidStatus(r.id, r.isPaid)}
                      className={`px-2 py-1 text-xs rounded font-bold flex items-center gap-1 ${r.isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                    >
                      {r.isPaid ? <><CheckCircle size={12}/> Đã trả</> : <><Clock size={12}/> Chưa trả</>}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <a href={r.imageUrls[0]} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline">
                      Xem {r.imageUrls.length} ảnh
                    </a>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
