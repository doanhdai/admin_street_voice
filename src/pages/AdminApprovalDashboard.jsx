import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiLoader, FiCheck, FiX } from 'react-icons/fi';
import api from '../services/api';

const AdminApprovalDashboard = () => {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [approving, setApproving] = useState(null);

    useEffect(() => {
        fetchUpdates();
    }, [filter]);

    const fetchUpdates = async () => {
        try {
            setLoading(true);
            let url = '/api/v1/admin/approvals/pending';
            if (filter !== 'PENDING') {
                url = `/api/v1/admin/approvals/history?status=${filter}`;
            }
            const res = await api.get(url);
            const data = Array.isArray(res.data) ? res.data : (res.data?.updates || []);
            setUpdates(data);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi khi tải danh sách cập nhật');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (updateId) => {
        try {
            setApproving(updateId);
            await api.post(`/api/v1/admin/approvals/${updateId}/approve`);
            toast.success('Đã phê duyệt cập nhật');
            fetchUpdates();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi khi phê duyệt');
        } finally {
            setApproving(null);
        }
    };

    const handleReject = async (updateId) => {
        const reason = prompt('Nhập lý do từ chối (tùy chọn):');
        if (reason === null) return; // User cancelled

        try {
            setApproving(updateId);
            await api.post(`/api/v1/admin/approvals/${updateId}/reject`, { reason });
            toast.success('Đã từ chối cập nhật');
            fetchUpdates();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi khi từ chối');
        } finally {
            setApproving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <FiLoader className="animate-spin text-cyan-600" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Phê duyệt cập nhật quán</h1>
                <p className="text-slate-600">Xem và duyệt các thay đổi từ chủ quán</p>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            filter === status
                                ? 'bg-cyan-600 text-white'
                                : 'bg-white text-slate-700 border border-slate-300 hover:border-cyan-600'
                        }`}
                    >
                        {status === 'PENDING' ? '⏳ Chờ duyệt' : status === 'APPROVED' ? '✓ Đã phê duyệt' : '✕ Từ chối'}
                    </button>
                ))}
            </div>

            {/* Updates List */}
            <div className="space-y-4">
                {updates.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                        <p className="text-slate-600">Không có cập nhật nào</p>
                    </div>
                ) : (
                    updates.map(update => (
                        <div
                            key={update.id}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition"
                        >
                            {/* Update Header */}
                            <div className="p-6 border-b border-slate-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">
                                            {update.stallName || update.foodStall?.name || 'Quán (không xác định)'}
                                        </h3>
                                        <p className="text-sm text-slate-600 mt-1">
                                            Chủ quán: {update.ownerUsername || update.owner?.username || 'N/A'}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        update.status === 'PENDING'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : update.status === 'APPROVED'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {update.status === 'PENDING' ? '⏳ Chờ duyệt' : update.status === 'APPROVED' ? 'Đã phê duyệt' : 'Từ chối'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Ngày yêu cầu: {new Date(update.createdAt).toLocaleString('vi-VN')}
                                </p>
                            </div>

                            {/* Changes Preview */}
                            <div className="p-6 bg-slate-50 space-y-3">
                                <h4 className="font-semibold text-slate-900 text-sm">Thay đổi đề xuất:</h4>
                                <div className="space-y-2 text-sm">
                                    {update.changes && Object.entries(update.changes).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                            <span className="text-slate-600">{key}:</span>
                                            <span className="text-cyan-600 font-medium">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                                {update.reason && (
                                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                                        <p className="text-xs text-red-700">
                                            <span className="font-semibold"></span>
                                            {update.reason}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {update.status === 'PENDING' && (
                                <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
                                    <button
                                        onClick={() => handleReject(update.id)}
                                        disabled={approving === update.id}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg transition disabled:opacity-50"
                                    >
                                        {approving === update.id ? <FiLoader className="animate-spin" /> : <FiX size={18} />}
                                        Từ chối
                                    </button>
                                    <button
                                        onClick={() => handleApprove(update.id)}
                                        disabled={approving === update.id}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                                    >
                                        {approving === update.id ? <FiLoader className="animate-spin" /> : <FiCheck size={18} />}
                                        Phê duyệt
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminApprovalDashboard;
