import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiAlertCircle,
    FiBarChart2,
    FiCheckCircle,
    FiClock,
    FiImage,
    FiMapPin,
    FiMic,
    FiPlus,
    FiRefreshCw,
    FiSearch,
    FiTrendingUp,
} from 'react-icons/fi';
import { stallService } from '../services/api';

const formatPercent = (value) => `${Math.round(value)}%`;

const Dashboard = () => {
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await stallService.getAll();
            setStalls(res.data || []);
        } catch (err) {
            setError('Không thể kết nối backend. Hãy chắc chắn backend đang chạy ở localhost:8080');
        } finally {
            setLoading(false);
        }
    };

    const metrics = useMemo(() => {
        const total = stalls.length;
        const active = stalls.filter((s) => s.status === 'ACTIVE').length;
        const pending = stalls.filter((s) => s.status === 'PENDING').length;
        const rejected = stalls.filter((s) => s.status === 'INACTIVE').length;
        const withAudio = stalls.filter((s) => s.audioUrl).length;
        const withImage = stalls.filter((s) => s.imageUrl).length;

        const completion = total
            ? ((stalls.filter((s) => s.audioUrl && s.imageUrl && s.description).length / total) * 100)
            : 0;

        return {
            total,
            active,
            pending,
            rejected,
            withAudio,
            withImage,
            completion,
            audioRate: total ? (withAudio / total) * 100 : 0,
            imageRate: total ? (withImage / total) * 100 : 0,
        };
    }, [stalls]);

    const filteredStalls = useMemo(() => {
        const q = keyword.trim().toLowerCase();

        return stalls.filter((stall) => {
            const matchKeyword =
                !q ||
                (stall.name || '').toLowerCase().includes(q) ||
                (stall.description || '').toLowerCase().includes(q) ||
                (stall.address || '').toLowerCase().includes(q);

            const matchStatus = statusFilter === 'ALL' || stall.status === statusFilter;
            return matchKeyword && matchStatus;
        });
    }, [stalls, keyword, statusFilter]);

    const needAttention = useMemo(() =>
        stalls.filter((stall) => !stall.audioUrl || !stall.imageUrl || stall.status === 'PENDING'),
    [stalls]);

    const statusChip = (status) => {
        if (status === 'ACTIVE') return 'bg-emerald-100 text-emerald-700';
        if (status === 'PENDING') return 'bg-amber-100 text-amber-700';
        if (status === 'INACTIVE') return 'bg-rose-100 text-rose-700';
        return 'bg-slate-100 text-slate-700';
    };

    if (loading) {
        return (
            <div className="flex min-h-[65vh] items-center justify-center">
                <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm">
                    <FiRefreshCw className="animate-spin text-indigo-600" size={18} />
                    Đang tải dữ liệu dashboard...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Admin Overview</p>
                        <h1 className="mt-1 text-3xl font-bold text-slate-900">Dashboard vận hành</h1>
                        <p className="mt-1 text-slate-600">Theo dõi chất lượng dữ liệu quán, xử lý hồ sơ và hành động nhanh tại một nơi.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={fetchData}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            <FiRefreshCw size={16} />
                            Làm mới
                        </button>
                        <Link
                            to="/stalls/new"
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            <FiPlus size={16} />
                            Thêm quán mới
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                        <FiAlertCircle className="mt-0.5" size={16} />
                        {error}
                    </div>
                )}
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 inline-flex rounded-lg bg-indigo-100 p-2 text-indigo-600"><FiMapPin size={18} /></div>
                    <p className="text-sm text-slate-500">Tổng quán ăn</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 inline-flex rounded-lg bg-emerald-100 p-2 text-emerald-600"><FiCheckCircle size={18} /></div>
                    <p className="text-sm text-slate-500">Đang hoạt động</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.active}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 inline-flex rounded-lg bg-amber-100 p-2 text-amber-600"><FiClock size={18} /></div>
                    <p className="text-sm text-slate-500">Đang chờ duyệt</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.pending}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 inline-flex rounded-lg bg-cyan-100 p-2 text-cyan-600"><FiTrendingUp size={18} /></div>
                    <p className="text-sm text-slate-500">Mức hoàn thiện dữ liệu</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{formatPercent(metrics.completion)}</p>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 p-4 sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Danh sách quán</h2>
                            {/* <div className="flex flex-wrap gap-2">
                                {['ALL', 'ACTIVE', 'PENDING', 'INACTIVE'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                            statusFilter === status
                                                ? 'bg-indigo-600 text-white'
                                                : 'border border-slate-300 bg-white text-slate-600 hover:border-indigo-500'
                                        }`}
                                    >
                                        {status === 'ALL' ? 'Tất cả' : status}
                                    </button>
                                ))}
                            </div> */}
                        </div>

                        <div className="relative mt-3">
                            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Tìm theo tên quán, mô tả, địa chỉ..."
                                className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                            />
                        </div>
                    </div>

                    <div className="max-h-[520px] overflow-y-auto p-3 sm:p-4">
                        {filteredStalls.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                                Không có quán phù hợp bộ lọc hiện tại.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredStalls.map((stall) => (
                                    <div key={stall.id} className="rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-slate-900">{stall.name}</p>
                                                <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{stall.address || 'Chưa có địa chỉ'}</p>
                                            </div>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusChip(stall.status)}`}>
                                                {stall.status || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                            <span className={`rounded-full px-2 py-0.5 ${stall.audioUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {stall.audioUrl ? 'Có audio' : 'Chưa audio'}
                                            </span>
                                            <span className={`rounded-full px-2 py-0.5 ${stall.imageUrl ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {stall.imageUrl ? 'Có ảnh' : 'Chưa ảnh'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Chất lượng dữ liệu</h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                                    <span className="inline-flex items-center gap-1"><FiMic /> Tỷ lệ có audio</span>
                                    <strong className="text-slate-800">{formatPercent(metrics.audioRate)}</strong>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100">
                                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${metrics.audioRate}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                                    <span className="inline-flex items-center gap-1"><FiImage /> Tỷ lệ có ảnh</span>
                                    <strong className="text-slate-800">{formatPercent(metrics.imageRate)}</strong>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100">
                                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${metrics.imageRate}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Việc cần xử lý</h3>
                        <div className="mt-3 space-y-2 text-sm text-slate-700">
                            <Link to="/approvals" className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                                <span className="inline-flex items-center gap-2"><FiClock className="text-amber-600" /> Hồ sơ chờ duyệt</span>
                                <strong>{metrics.pending}</strong>
                            </Link>
                            <Link to="/stalls" className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                                <span className="inline-flex items-center gap-2"><FiBarChart2 className="text-indigo-600" /> Quán thiếu dữ liệu</span>
                                <strong>{needAttention.length}</strong>
                            </Link>
                            <Link to="/audio" className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
                                <span className="inline-flex items-center gap-2"><FiMic className="text-emerald-600" /> Quản lý audio</span>
                                <strong>{metrics.withAudio}/{metrics.total}</strong>
                            </Link>
                        </div>
                    </div> */}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
