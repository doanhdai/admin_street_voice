import { useEffect, useMemo, useState } from 'react';
import { analyticsService, stallService } from '../services/api';
import { toast } from 'react-toastify';
import {
    FiActivity,
    FiBarChart2,
    FiCalendar,
    FiClock,
    FiFilter,
    FiLoader,
    FiRefreshCw,
    FiTrendingUp,
    FiUsers,
} from 'react-icons/fi';

const toDateInputValue = (date) => date.toISOString().split('T')[0];

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const formatDecimal = (value, digits = 2) => Number(value || 0).toFixed(digits);

const intensityClass = (value, maxValue) => {
    if (!maxValue || value <= 0) return 'bg-slate-100 text-slate-500';
    const ratio = value / maxValue;
    if (ratio > 0.75) return 'bg-emerald-600 text-white';
    if (ratio > 0.5) return 'bg-emerald-500 text-white';
    if (ratio > 0.25) return 'bg-emerald-300 text-emerald-950';
    return 'bg-emerald-100 text-emerald-800';
};

const getApiErrorMessage = (error, fallbackMessage) => {
    const message = error?.response?.data?.message;
    return typeof message === 'string' ? message : fallbackMessage;
};

const Analytics = () => {
    const today = new Date();
    const defaultFrom = new Date(today);
    defaultFrom.setDate(defaultFrom.getDate() - 6);

    const [filters, setFilters] = useState({
        from: toDateInputValue(defaultFrom),
        to: toDateInputValue(today),
        minutes: 15,
        limit: 10,
        stallId: '',
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stalls, setStalls] = useState([]);
    const [activeUsers, setActiveUsers] = useState(0);
    const [dailySummary, setDailySummary] = useState([]);
    const [poiRanking, setPoiRanking] = useState([]);
    const [hourlyHeatmap, setHourlyHeatmap] = useState([]);
    const [audioEngagement, setAudioEngagement] = useState([]);
    const [sessionStats, setSessionStats] = useState([]);

    const isBusy = loading || refreshing;

    const updateFilter = (field) => (event) => {
        setFilters((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const fetchStalls = async () => {
        try {
            const response = await stallService.getAll();
            const list = Array.isArray(response.data) ? response.data : [];
            setStalls(list);
        } catch {
            toast.error('Không thể tải danh sách quán để lọc analytics');
        }
    };

    const fetchAnalytics = async (showGlobalLoading = false) => {
        if (showGlobalLoading) {
            setLoading(true);
        } else {
            setRefreshing(true);
        }

        if (filters.from > filters.to) {
            toast.error('Khoảng thời gian không hợp lệ: ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc');
            setLoading(false);
            setRefreshing(false);
            return;
        }

        const selectedStallId = filters.stallId ? Number(filters.stallId) : null;

        try {
            const [activeRes, dailyRes, rankingRes, heatmapRes, audioRes, sessionRes] = await Promise.all([
                analyticsService.getActiveUsers(Number(filters.minutes) || 5),
                analyticsService.getDailySummary({ from: filters.from, to: filters.to }),
                analyticsService.getPoiRanking({
                    from: filters.from,
                    to: filters.to,
                    limit: Number(filters.limit) || 10,
                }),
                analyticsService.getHourlyHeatmap(selectedStallId),
                analyticsService.getAudioEngagement(selectedStallId),
                analyticsService.getSessionStats(),
            ]);

            setActiveUsers(Number(activeRes?.data?.activeUsers || 0));
            setDailySummary(Array.isArray(dailyRes?.data?.data) ? dailyRes.data.data : []);
            setPoiRanking(Array.isArray(rankingRes?.data?.data) ? rankingRes.data.data : []);
            setHourlyHeatmap(Array.isArray(heatmapRes?.data?.data) ? heatmapRes.data.data : []);
            setAudioEngagement(Array.isArray(audioRes?.data?.data) ? audioRes.data.data : []);
            setSessionStats(Array.isArray(sessionRes?.data?.data) ? sessionRes.data.data : []);
        } catch (error) {
            toast.error(getApiErrorMessage(error, 'Không thể tải dữ liệu analytics'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStalls();
        fetchAnalytics(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleApplyFilters = (event) => {
        event.preventDefault();
        fetchAnalytics(false);
    };

    const handleRefresh = () => {
        fetchAnalytics(false);
    };

    const hourlyData = useMemo(() => {
        const rows = Array.from({ length: 24 }, (_, hour) => ({ hourOfDay: hour, visits: 0 }));
        for (const row of hourlyHeatmap) {
            const hour = Number(row.hourOfDay);
            if (hour >= 0 && hour <= 23) {
                rows[hour].visits = Number(row.visits || 0);
            }
        }
        return rows;
    }, [hourlyHeatmap]);

    const maxHourlyVisits = useMemo(
        () => hourlyData.reduce((max, row) => Math.max(max, Number(row.visits || 0)), 0),
        [hourlyData]
    );

    const dailyChart = useMemo(() => {
        const normalized = dailySummary.map((row) => ({
            day: row.day,
            users: Number(row.users || 0),
            visits: Number(row.visits || 0),
            plays: Number(row.plays || 0),
        }));

        const maxValue = normalized.reduce(
            (max, row) => Math.max(max, row.users, row.visits, row.plays),
            0
        );

        return { normalized, maxValue };
    }, [dailySummary]);

    const sessionChart = useMemo(() => {
        const normalized = sessionStats.map((row) => ({
            day: row.day,
            sessions: Number(row.sessions || 0),
            avgStallsPerSession: Number(row.avgStallsPerSession || 0),
            avgSessionDurationMinutes: Number(row.avgSessionDurationMinutes || 0),
        }));

        const maxSessions = normalized.reduce((max, row) => Math.max(max, row.sessions), 0);

        return { normalized, maxSessions };
    }, [sessionStats]);

    const totalUsers = useMemo(
        () => dailySummary.reduce((sum, row) => sum + Number(row.users || 0), 0),
        [dailySummary]
    );
    const totalVisits = useMemo(
        () => dailySummary.reduce((sum, row) => sum + Number(row.visits || 0), 0),
        [dailySummary]
    );
    const totalPlays = useMemo(
        () => dailySummary.reduce((sum, row) => sum + Number(row.plays || 0), 0),
        [dailySummary]
    );
    const averageSessionDuration = useMemo(() => {
        if (!sessionStats.length) return 0;
        const total = sessionStats.reduce(
            (sum, row) => sum + Number(row.avgSessionDurationMinutes || 0),
            0
        );
        return total / sessionStats.length;
    }, [sessionStats]);

    const selectedStallText = filters.stallId
        ? stalls.find((stall) => Number(stall.id) === Number(filters.stallId))?.name || `Stall #${filters.stallId}`
        : 'Tất cả quán';

    const cardClass = 'bg-white rounded-2xl border border-slate-200 shadow-sm p-5';

    return (
        <div className="space-y-6 pb-8">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 rounded-3xl p-6 md:p-7 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                    <div>
                        <p className="uppercase tracking-[0.2em] text-xs text-emerald-200">Admin Analytics</p>
                        <h1 className="text-2xl md:text-3xl font-bold mt-2">Thống kê vận hành Street Voice</h1>
                        <p className="text-sm text-slate-200 mt-2">
                            Dữ liệu realtime + xu hướng theo ngày để theo dõi tăng trưởng, mức độ nghe audio và chất lượng phiên.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isBusy}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-60"
                    >
                        <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                        Làm mới dữ liệu
                    </button>
                </div>
            </div>

            <form onSubmit={handleApplyFilters} className={`${cardClass} space-y-4`}>
                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <FiFilter /> Bộ lọc phân tích
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <label className="text-sm text-slate-600 space-y-1 block">
                        <span className="inline-flex items-center gap-1"><FiCalendar size={14} /> Từ ngày</span>
                        <input
                            type="date"
                            value={filters.from}
                            onChange={updateFilter('from')}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </label>

                    <label className="text-sm text-slate-600 space-y-1 block">
                        <span className="inline-flex items-center gap-1"><FiCalendar size={14} /> Đến ngày</span>
                        <input
                            type="date"
                            value={filters.to}
                            onChange={updateFilter('to')}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </label>

                    <label className="text-sm text-slate-600 space-y-1 block">
                        <span className="inline-flex items-center gap-1"><FiClock size={14} /> Active users (phút)</span>
                        <input
                            type="number"
                            min="1"
                            value={filters.minutes}
                            onChange={updateFilter('minutes')}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </label>

                    <label className="text-sm text-slate-600 space-y-1 block">
                        <span className="inline-flex items-center gap-1"><FiTrendingUp size={14} /> Top ranking</span>
                        <input
                            type="number"
                            min="1"
                            value={filters.limit}
                            onChange={updateFilter('limit')}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </label>

                    {/* <label className="text-sm text-slate-600 space-y-1 block">
                        <span className="inline-flex items-center gap-1"><FiBarChart2 size={14} /> Stall</span>
                        <select
                            value={filters.stallId}
                            onChange={updateFilter('stallId')}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">Tất cả quán</option>
                            {stalls.map((stall) => (
                                <option key={stall.id} value={stall.id}>
                                    #{stall.id} - {stall.name}
                                </option>
                            ))}
                        </select>
                    </label> */}
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isBusy}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                        {isBusy ? <FiLoader className="animate-spin" /> : <FiFilter />}
                        Áp dụng bộ lọc
                    </button>
                </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className={cardClass}>
                    <p className="text-sm text-slate-500 flex items-center gap-2"><FiUsers /> Người dùng hoạt động</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{formatNumber(activeUsers)}</p>
                    <p className="text-xs text-slate-500 mt-1">Trong {filters.minutes} phút gần nhất</p>
                </div>

                <div className={cardClass}>
                    <p className="text-sm text-slate-500 flex items-center gap-2"><FiActivity /> Tổng users theo ngày</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{formatNumber(totalUsers)}</p>
                    <p className="text-xs text-slate-500 mt-1">Khoảng {filters.from} đến {filters.to}</p>
                </div>

                <div className={cardClass}>
                    <p className="text-sm text-slate-500 flex items-center gap-2"><FiTrendingUp /> Tổng lượt visits / plays</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{formatNumber(totalVisits)} / {formatNumber(totalPlays)}</p>
                    <p className="text-xs text-slate-500 mt-1">Visit vào vùng và phát audio</p>
                </div>

                <div className={cardClass}>
                    <p className="text-sm text-slate-500 flex items-center gap-2"><FiClock /> TB thời lượng phiên</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{formatDecimal(averageSessionDuration, 1)} phút</p>
                    <p className="text-xs text-slate-500 mt-1">Dựa trên session-stats</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
                {/* <div className={`${cardClass} xl:col-span-3`}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-bold text-slate-900">Xu hướng theo ngày</h2>
                            <p className="text-xs text-slate-500">Users, visits, plays</p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                            {dailyChart.normalized.length} ngày
                        </span>
                    </div>

                    {dailyChart.normalized.length === 0 ? (
                        <p className="text-sm text-slate-500 py-12 text-center">Không có dữ liệu trong khoảng thời gian đã chọn.</p>
                    ) : (
                        <div className="space-y-3">
                            {dailyChart.normalized.map((row) => (
                                <div key={row.day} className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-slate-600">
                                        <span>{row.day}</span>
                                        <span>U: {formatNumber(row.users)} | V: {formatNumber(row.visits)} | P: {formatNumber(row.plays)}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(row.users / (dailyChart.maxValue || 1)) * 100}%` }} />
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(row.visits / (dailyChart.maxValue || 1)) * 100}%` }} />
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(row.plays / (dailyChart.maxValue || 1)) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Users</span>
                                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Visits</span>
                                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Plays</span>
                            </div>
                        </div>
                    )}
                </div> */}

                <div className={`${cardClass} xl:col-span-5`}>
                    <div className="mb-4">
                        <h2 className="font-bold text-slate-900">Hourly Heatmap</h2>
                        <p className="text-xs text-slate-500">{selectedStallText}</p>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                        {hourlyData.map((row) => (
                            <div
                                key={row.hourOfDay}
                                className={`rounded-lg px-2 py-2 text-center text-xs font-medium ${intensityClass(row.visits, maxHourlyVisits)}`}
                                title={`${String(row.hourOfDay).padStart(2, '0')}:00 - ${formatNumber(row.visits)} visits`}
                            >
                                <p>{String(row.hourOfDay).padStart(2, '0')}h</p>
                                <p>{formatNumber(row.visits)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-slate-900">POI Ranking (Top {filters.limit})</h2>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">{poiRanking.length} mục</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 border-b border-slate-100">
                                    <th className="py-2 pr-2">#</th>
                                    <th className="py-2 pr-2">Quán</th>
                                    <th className="py-2 text-right">Plays</th>
                                </tr>
                            </thead>
                            <tbody>
                                {poiRanking.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-slate-500">Chưa có dữ liệu ranking</td>
                                    </tr>
                                ) : (
                                    poiRanking.map((row) => (
                                        <tr key={`${row.stallId}-${row.rank}`} className="border-b border-slate-50 last:border-0">
                                            <td className="py-2.5 pr-2 font-semibold text-slate-700">{row.rank}</td>
                                            <td className="py-2.5 pr-2">
                                                <p className="font-medium text-slate-900">{row.stallName || `Stall #${row.stallId}`}</p>
                                                <p className="text-xs text-slate-500">ID: {row.stallId}</p>
                                            </td>
                                            <td className="py-2.5 text-right font-semibold text-emerald-700">{formatNumber(row.plays)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-slate-900">Audio Engagement</h2>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-sky-50 text-sky-700">{selectedStallText}</span>
                    </div>

                    <div className="space-y-2.5">
                        {audioEngagement.length === 0 ? (
                            <p className="text-sm text-slate-500 py-8 text-center">Chưa có dữ liệu audio engagement</p>
                        ) : (
                            audioEngagement.map((row, index) => {
                                const maxPlays = audioEngagement[0]?.plays || 1;
                                const width = (Number(row.plays || 0) / Number(maxPlays || 1)) * 100;
                                return (
                                    <div key={`${row.stallId}-${index}`} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-slate-800">{row.stallName || `Stall #${row.stallId}`}</span>
                                            <span className="text-slate-600">{formatNumber(row.plays)} plays</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div className="h-full rounded-full bg-sky-500" style={{ width: `${width}%` }} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-bold text-slate-900">Session Quality</h2>
                        <p className="text-xs text-slate-500">Số phiên, quán/phiên, thời lượng trung bình</p>
                    </div>
                </div>

                {sessionChart.normalized.length === 0 ? (
                    <p className="text-sm text-slate-500 py-10 text-center">Chưa có dữ liệu session stats</p>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                        <div className="xl:col-span-1 space-y-2">
                            {sessionChart.normalized.map((row) => (
                                <div key={row.day} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                                        <span>{row.day}</span>
                                        <span>{formatNumber(row.sessions)} sessions</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-2">
                                        <div
                                            className="h-full rounded-full bg-indigo-500"
                                            style={{ width: `${(row.sessions / (sessionChart.maxSessions || 1)) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">Avg stalls/session: {formatDecimal(row.avgStallsPerSession)}</p>
                                    <p className="text-xs text-slate-500">Avg duration: {formatDecimal(row.avgSessionDurationMinutes)} phút</p>
                                </div>
                            ))}
                        </div>

                        <div className="xl:col-span-2 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-500 border-b border-slate-100">
                                        <th className="py-2 pr-2">Ngày</th>
                                        <th className="py-2 pr-2">Sessions</th>
                                        <th className="py-2 pr-2">Avg stalls/session</th>
                                        <th className="py-2 text-right">Avg duration (phút)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessionChart.normalized.map((row) => (
                                        <tr key={`table-${row.day}`} className="border-b border-slate-50 last:border-0">
                                            <td className="py-2.5 pr-2 font-medium text-slate-800">{row.day}</td>
                                            <td className="py-2.5 pr-2">{formatNumber(row.sessions)}</td>
                                            <td className="py-2.5 pr-2">{formatDecimal(row.avgStallsPerSession)}</td>
                                            <td className="py-2.5 text-right">{formatDecimal(row.avgSessionDurationMinutes)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {isBusy && (
                <div className="fixed right-6 bottom-6 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm inline-flex items-center gap-2">
                    <FiLoader className="animate-spin" /> Đang cập nhật dashboard...
                </div>
            )}

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                <FiBarChart2 className="text-emerald-600 mt-0.5 shrink-0" size={18} />
                <div>
                    <p className="text-sm font-medium text-emerald-800">API đang sử dụng</p>
                    <p className="text-xs text-emerald-700 mt-0.5">/active-users, /poi-ranking, /hourly-heatmap, /audio-engagement, /session-stats, /daily-summary</p>
                    <p className="text-xs text-emerald-700 mt-1">Dashboard hiện đã gọi đầy đủ các endpoint analytics chính cho admin.</p>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
