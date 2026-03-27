import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    FiCheck,
    FiCheckCircle,
    FiClock,
    FiCornerUpLeft,
    FiFileText,
    FiFilter,
    FiLoader,
    FiSearch,
    FiUser,
    FiX,
    FiXCircle,
} from 'react-icons/fi';
import api from '../services/api';

const STATUS_LABEL = {
    PENDING: 'Chờ duyệt',
    CREATE_PENDING: 'Chờ duyệt đăng ký mới',
    UPDATE_PENDING: 'Chờ duyệt cập nhật',
    APPROVED: 'Đã phê duyệt',
    REJECTED: 'Từ chối',
};

const STATUS_CHIP = {
    PENDING: 'bg-amber-100 text-amber-800 border border-amber-200',
    CREATE_PENDING: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    UPDATE_PENDING: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
    APPROVED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    REJECTED: 'bg-rose-100 text-rose-800 border border-rose-200',
};

const PENDING_STATUSES = new Set(['PENDING', 'CREATE_PENDING', 'UPDATE_PENDING']);

const isPendingStatus = (status) => PENDING_STATUSES.has(status);

const normalizeValue = (value) => {
    if (value == null || value === '') return 'Trống';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

const getUpdateType = (update) =>
    update.newStallRequest || update.status === 'CREATE_PENDING' ? 'NEW' : 'UPDATE';

const AdminApprovalDashboard = () => {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [approving, setApproving] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [rejectModal, setRejectModal] = useState({ open: false, updateId: null, reason: '' });

    useEffect(() => {
        fetchUpdates();
    }, [filter]);

    useEffect(() => {
        if (!updates.length) {
            setSelectedId(null);
            return;
        }

        const selectedStillExists = updates.some((item) => item.id === selectedId);
        if (!selectedStillExists) {
            setSelectedId(updates[0].id);
        }
    }, [updates, selectedId]);

    const fetchUpdates = async () => {
        try {
            setLoading(true);
            let url = '/api/v1/admin/approvals/pending';
            if (filter !== 'PENDING') {
                url = `/api/v1/admin/approvals/history?status=${filter}`;
            }

            const res = await api.get(url);
            const data = Array.isArray(res.data) ? res.data : res.data?.updates || [];
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
            toast.success('Đã phê duyệt yêu cầu');
            fetchUpdates();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi khi phê duyệt');
        } finally {
            setApproving(null);
        }
    };

    const openRejectModal = (updateId) => {
        setRejectModal({ open: true, updateId, reason: '' });
    };

    const closeRejectModal = () => {
        setRejectModal({ open: false, updateId: null, reason: '' });
    };

    const handleReject = async () => {
        if (!rejectModal.updateId) return;

        try {
            setApproving(rejectModal.updateId);
            await api.post(`/api/v1/admin/approvals/${rejectModal.updateId}/reject`, { reason: rejectModal.reason });
            toast.success('Đã từ chối yêu cầu');
            closeRejectModal();
            fetchUpdates();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi khi từ chối');
        } finally {
            setApproving(null);
        }
    };

    const stats = useMemo(() => {
        const newCount = updates.filter((item) => getUpdateType(item) === 'NEW').length;
        const updateCount = updates.length - newCount;
        return {
            total: updates.length,
            newCount,
            updateCount,
        };
    }, [updates]);

    const filteredUpdates = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return updates.filter((item) => {
            const type = getUpdateType(item);
            const matchType = typeFilter === 'ALL' || typeFilter === type;

            const stallName = (item.stallName || item.foodStall?.name || '').toLowerCase();
            const ownerName = (item.ownerUsername || item.owner?.username || '').toLowerCase();
            const matchSearch =
                !keyword || stallName.includes(keyword) || ownerName.includes(keyword) || String(item.id).includes(keyword);

            return matchType && matchSearch;
        });
    }, [updates, typeFilter, search]);

    const selectedUpdate = filteredUpdates.find((item) => item.id === selectedId) || filteredUpdates[0] || null;

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm">
                    <FiLoader className="animate-spin text-indigo-600" size={20} />
                    <span className="font-medium">Đang tải danh sách phê duyệt...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Admin Approval</p>
                        <h1 className="mt-2 text-3xl font-bold text-slate-900">Phê duyệt hồ sơ quán ăn</h1>
                        <p className="mt-1 text-slate-600">Duyệt theo dạng danh sách + chi tiết để thao tác nhanh và không bị trôi trang.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Tổng hồ sơ</p>
                            <p className="mt-1 text-xl font-bold text-slate-900">{stats.total}</p>
                        </div>
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.14em] text-indigo-600">Đăng ký mới</p>
                            <p className="mt-1 text-xl font-bold text-indigo-900">{stats.newCount}</p>
                        </div>
                        <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.14em] text-cyan-600">Cập nhật</p>
                            <p className="mt-1 text-xl font-bold text-cyan-900">{stats.updateCount}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                    <div className="relative">
                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên quán, owner hoặc mã hồ sơ..."
                            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                        />
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
                        <FiFilter className="text-slate-500" />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-transparent text-sm font-medium text-slate-700 outline-none"
                        >
                            <option value="ALL">Tất cả loại</option>
                            <option value="NEW">Đăng ký mới</option>
                            <option value="UPDATE">Cập nhật thông tin</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                                    filter === status
                                        ? 'bg-indigo-600 text-white'
                                        : 'border border-slate-300 bg-white text-slate-700 hover:border-indigo-500'
                                }`}
                            >
                                {STATUS_LABEL[status]}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
                <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-800">Danh sách hồ sơ ({filteredUpdates.length})</p>
                    </div>

                    <div className="max-h-[65vh] overflow-y-auto p-3">
                        {filteredUpdates.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                                Không có hồ sơ phù hợp bộ lọc hiện tại.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredUpdates.map((item) => {
                                    const isActive = item.id === selectedUpdate?.id;
                                    const type = getUpdateType(item);
                                    const stallName = item.stallName || item.foodStall?.name || 'Quán không xác định';
                                    const ownerName = item.ownerUsername || item.owner?.username || 'N/A';

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedId(item.id)}
                                            className={`w-full rounded-xl border p-3 text-left transition ${
                                                isActive
                                                    ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                                                    : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="line-clamp-1 text-sm font-semibold text-slate-900">{stallName}</p>
                                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CHIP[item.status] || STATUS_CHIP.PENDING}`}>
                                                    {STATUS_LABEL[item.status] || item.status}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                                                <FiUser size={12} />
                                                {ownerName}
                                            </div>
                                            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                                                <span>{type === 'NEW' ? 'Đăng ký mới' : 'Cập nhật'}</span>
                                                <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </aside>

                <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {!selectedUpdate ? (
                        <div className="flex min-h-[420px] items-center justify-center p-8 text-center">
                            <div>
                                <FiFileText className="mx-auto text-slate-300" size={36} />
                                <p className="mt-3 text-slate-500">Chọn một hồ sơ bên trái để xem chi tiết.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full flex-col">
                            <div className="border-b border-slate-200 p-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                                            {getUpdateType(selectedUpdate) === 'NEW' ? 'Đăng ký quán mới' : 'Cập nhật từ owner'}
                                        </p>
                                        <h2 className="mt-1 text-2xl font-bold text-slate-900">
                                            {selectedUpdate.stallName || selectedUpdate.foodStall?.name || 'Quán không xác định'}
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Owner: {selectedUpdate.ownerUsername || selectedUpdate.owner?.username || 'N/A'}
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CHIP[selectedUpdate.status] || STATUS_CHIP.PENDING}`}>
                                        {STATUS_LABEL[selectedUpdate.status] || selectedUpdate.status}
                                    </span>
                                </div>
                                <p className="mt-3 text-xs text-slate-500">Ngày gửi: {new Date(selectedUpdate.createdAt).toLocaleString('vi-VN')}</p>
                            </div>

                            <div className="flex-1 space-y-5 p-6">
                                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <h3 className="text-sm font-semibold text-slate-900">Thay đổi đề xuất</h3>
                                    {!selectedUpdate.changes || Object.keys(selectedUpdate.changes).length === 0 ? (
                                        <p className="mt-2 text-sm text-slate-500">Không có trường thay đổi được gửi lên.</p>
                                    ) : (
                                        <div className="mt-3 space-y-2">
                                            {Object.entries(selectedUpdate.changes).map(([key, value]) => (
                                                <div key={key} className="grid grid-cols-[180px_minmax(0,1fr)] items-start gap-3 text-sm">
                                                    <p className="font-medium text-slate-600">{key}</p>
                                                    <p className="break-words text-slate-900">{normalizeValue(value)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {selectedUpdate.reason && (
                                    <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                                        <h3 className="text-sm font-semibold text-rose-800">Lý do từ chối trước đó</h3>
                                        <p className="mt-1 text-sm text-rose-700">{selectedUpdate.reason}</p>
                                    </section>
                                )}
                            </div>

                            {isPendingStatus(selectedUpdate.status) && (
                                <div className="border-t border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                        <button
                                            onClick={() => openRejectModal(selectedUpdate.id)}
                                            disabled={approving === selectedUpdate.id}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                                        >
                                            {approving === selectedUpdate.id ? <FiLoader className="animate-spin" /> : <FiXCircle size={17} />}
                                            Từ chối
                                        </button>
                                        <button
                                            onClick={() => handleApprove(selectedUpdate.id)}
                                            disabled={approving === selectedUpdate.id}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                            {approving === selectedUpdate.id ? <FiLoader className="animate-spin" /> : <FiCheckCircle size={17} />}
                                            Phê duyệt
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!isPendingStatus(selectedUpdate.status) && (
                                <div className="border-t border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                    Hồ sơ này đã được xử lý.
                                </div>
                            )}
                        </div>
                    )}
                </article>
            </section>

            {rejectModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
                        <h3 className="text-lg font-bold text-slate-900">Từ chối hồ sơ</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Bạn có thể nhập lý do để chủ quán chỉnh sửa đúng yêu cầu trước khi gửi lại.
                        </p>

                        <textarea
                            rows={5}
                            value={rejectModal.reason}
                            onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
                            placeholder="Ví dụ: Vui lòng bổ sung địa chỉ chi tiết và cập nhật giá hợp lệ."
                            className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                        />

                        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeRejectModal}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                <FiCornerUpLeft size={16} />
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleReject}
                                disabled={approving === rejectModal.updateId}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                            >
                                {approving === rejectModal.updateId ? <FiLoader className="animate-spin" /> : <FiX size={16} />}
                                Xác nhận từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminApprovalDashboard;
