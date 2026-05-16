import React, { useEffect, useState } from 'react';
import { getOrders, updateOrder, getKtvUsers } from '../../api/client';
import { Search, ChevronLeft, ChevronRight, ChevronDown, Filter } from 'lucide-react';

const ADMIN_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'chờ hàng', label: 'Chờ hàng' },
  { value: 'ưu tiên xuất đơn', label: 'Ưu tiên xuất đơn' },
  { value: 'xác nhận đơn hàng', label: 'Xác nhận đơn hàng' },
  { value: 'đang đóng hàng', label: 'Đang đóng hàng' },
  { value: 'chờ chuyển hàng', label: 'Chờ chuyển hàng' },
  { value: 'gửi hàng đi', label: 'Gửi hàng đi' },
  { value: 'hủy đơn', label: 'Hủy đơn' },
  { value: 'xóa đơn', label: 'Xóa đơn' },
  { value: 'tạo trùng lặp', label: 'Tạo trùng lặp' },
];

export default function OrderList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // KTVs
  const [ktvs, setKtvs] = useState<any[]>([]);
  const [assignConfirmModal, setAssignConfirmModal] = useState<{isOpen: boolean; orderId: string; ktvId: string; ktvName: string} | null>(null);

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'chờ hàng': return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500';
      case 'ưu tiên xuất đơn': return 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-500';
      case 'xác nhận đơn hàng': return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500';
      case 'đang đóng hàng': return 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-500';
      case 'chờ chuyển hàng': return 'bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-500';
      case 'gửi hàng đi': return 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500';
      case 'hủy đơn': return 'bg-red-500 hover:bg-red-600 focus:ring-red-500';
      case 'xóa đơn': return 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500';
      case 'tạo trùng lặp': return 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-500';
      default: return 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500';
    }
  };

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      const res = await getOrders({
        page,
        limit: 20,
        search,
        status: statusFilter,
        sortBy,
        sortOrder
      });
      setOrders(res.orders);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.total);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Lỗi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersData();
  }, [page, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    getKtvUsers().then(data => setKtvs(data)).catch(err => console.error('Lỗi tải KTV:', err));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrdersData();
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrder(orderId, { adminStatus: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, adminStatus: newStatus } : o));
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleAppointmentTimeChange = async (orderId: string, newTime: string) => {
    try {
      await updateOrder(orderId, { appointmentTime: newTime ? new Date(newTime).toISOString() : null });
      setOrders(orders.map(o => o.id === orderId ? { ...o, appointmentTime: newTime } : o));
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật ngày hẹn');
    }
  };

  const handleAssignKtv = async () => {
    if (!assignConfirmModal) return;
    try {
      await updateOrder(assignConfirmModal.orderId, { assignedKtvId: assignConfirmModal.ktvId || null });
      setOrders(orders.map(o => o.id === assignConfirmModal.orderId 
        ? { ...o, assignedKtvId: assignConfirmModal.ktvId, assignedKtv: ktvs.find(k => k.id === assignConfirmModal.ktvId) } 
        : o
      ));
      setAssignConfirmModal(null);
    } catch(err: any) {
      alert(err.message || 'Lỗi phân công KTV');
    }
  };

  const statusChips = [
    { label: 'Tất cả', value: '' },
    { label: 'Mới', value: 'mới' },
    { label: 'Chờ hàng', value: 'chờ hàng' },
    { label: 'Ưu tiên xuất đơn', value: 'ưu tiên xuất đơn' },
    { label: 'Đã xác nhận', value: 'xác nhận đơn hàng' },
    { label: 'Đang đóng hàng', value: 'đang đóng hàng' },
    { label: 'Chờ chuyển hàng', value: 'chờ chuyển hàng' },
    { label: 'Đã gửi hàng', value: 'gửi hàng đi' },
    { label: 'Đã hủy', value: 'hủy đơn' },
  ];

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-120px)] font-sans">
      
      {/* Top Tabs */}
      <div className="flex justify-between border-b border-gray-200 bg-gray-50 px-4 pt-1">
        <div className="flex space-x-1">
          <button className="px-5 py-2.5 text-[14px] font-medium text-blue-600 border-b-2 border-blue-600 bg-white -mb-[1px]">Đơn hàng</button>
          <button className="px-5 py-2.5 text-[14px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t-lg transition-colors border-b-2 border-transparent">Cần xử lý</button>
          <button className="px-5 py-2.5 text-[14px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t-lg transition-colors border-b-2 border-transparent">Trễ giao</button>
          <button className="px-5 py-2.5 text-[14px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t-lg transition-colors border-b-2 border-transparent">Vị trí</button>
        </div>
        <div className="flex items-center space-x-2 pb-1">
          <button className="p-1.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-100 transition-colors bg-white shadow-sm">
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center space-x-2 p-3 bg-white border-b border-gray-100 overflow-x-auto">
        {statusChips.map((chip) => (
          <button
            key={chip.label}
            onClick={() => { setStatusFilter(chip.value); setPage(1); }}
            className={`whitespace-nowrap px-3 py-1.5 rounded-md text-[13px] transition-colors border flex items-center ${
              statusFilter === chip.value 
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' 
                : 'border-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            {chip.label} 
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${statusFilter === chip.value ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {statusFilter === chip.value ? totalItems : 0}
            </span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
        <form onSubmit={handleSearch} className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm theo ID, Khách hàng, SĐT..."
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center space-x-3">
          <select
            className="px-3 py-2 text-[13px] border border-gray-300 rounded-md bg-white text-gray-700 cursor-pointer focus:ring-1 focus:ring-blue-500 outline-none"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          >
            <option value="createdAt">Tạo mới</option>
            <option value="updatedAt">Cập nhật</option>
            <option value="appointmentTime">Hẹn khách</option>
          </select>
          <select
            className="px-3 py-2 text-[13px] border border-gray-300 rounded-md bg-white text-gray-700 cursor-pointer focus:ring-1 focus:ring-blue-500 outline-none"
            value={sortOrder}
            onChange={(e) => { setSortOrder(e.target.value); setPage(1); }}
          >
            <option value="desc">Mới nhất</option>
            <option value="asc">Cũ nhất</option>
          </select>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto bg-white">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 font-medium">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Không tìm thấy đơn hàng nào</div>
        ) : (
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="sticky top-0 bg-[#f8f9fa] text-gray-600 font-semibold border-b border-gray-200 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 w-10 text-center"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Cập nhật / Hẹn</th>
                <th className="px-4 py-3">Phân công</th>
                <th className="px-4 py-3">Nguồn đơn</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">SĐT</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order, idx) => {
                 const customerName = order.billFullName || order.customer?.fullName || 'Khách lẻ';
                 const phone = order.billPhoneNumber || order.customer?.phoneNumber || '';
                 const sourceName = order.orderSource || 'Truliva';
                 
                 return (
                  <tr key={order.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'} hover:bg-blue-50/50 transition-colors`}>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {order.pancakeOrderId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800">
                        {new Date(order.updatedAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} <span className="text-gray-500">{new Date(order.updatedAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="mt-1">
                        <input
                          type="datetime-local"
                          className="text-[12px] text-gray-600 border border-transparent hover:border-gray-300 hover:bg-gray-50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-1 py-0.5 cursor-pointer outline-none transition-all"
                          title="Sửa ngày hẹn"
                          value={order.appointmentTime ? new Date(new Date(order.appointmentTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''}
                          onChange={(e) => handleAppointmentTimeChange(order.id, e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="w-[140px] appearance-none bg-white border border-gray-300 hover:border-gray-400 text-gray-700 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-[13px]"
                        value={order.assignedKtvId || ''}
                        onChange={(e) => {
                          const ktvId = e.target.value;
                          if (!ktvId) {
                            // Gỡ phân công ngay lập tức không cần modal
                            updateOrder(order.id, { assignedKtvId: null }).then(() => {
                              setOrders(orders.map(o => o.id === order.id ? { ...o, assignedKtvId: null, assignedKtv: null } : o));
                            }).catch(err => alert(err.message));
                            return;
                          }
                          const ktvName = ktvs.find(k => k.id === ktvId)?.fullName || '';
                          setAssignConfirmModal({ isOpen: true, orderId: order.id, ktvId, ktvName });
                        }}
                      >
                        <option value="">Chưa phân công</option>
                        {ktvs.map(k => (
                          <option key={k.id} value={k.id}>{k.fullName}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {sourceName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[11px] shrink-0 border border-blue-200">
                          {customerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-800 font-medium">{customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {phone}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative inline-block w-40">
                        <select
                          className={`w-full appearance-none text-white font-medium rounded shadow-sm px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer transition-colors text-[13px] ${getStatusStyle(order.adminStatus || '')}`}
                          value={order.adminStatus || ''}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          {ADMIN_STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value} className="bg-white text-gray-900 font-normal py-1">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/80">
                          <ChevronDown size={14} strokeWidth={3} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 bg-white text-[13px] text-gray-600 shadow-[0_-1px_2px_rgba(0,0,0,0.02)] z-10">
          <span>
            Trang <span className="font-medium text-gray-900">{page}</span> / <span className="font-medium text-gray-900">{totalPages}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Assign Confirm Modal */}
      {assignConfirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Xác nhận phân công</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn giao đơn hàng này cho kỹ thuật viên <span className="font-bold text-gray-900">{assignConfirmModal.ktvName}</span> không?
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md font-medium transition-colors"
                onClick={() => setAssignConfirmModal(null)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium transition-colors"
                onClick={handleAssignKtv}
              >
                Xác nhận giao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
