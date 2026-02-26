import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stallService } from '../services/api';
import {
    FiMapPin,
    FiMic,
    FiImage,
    FiTrendingUp,
    FiPlus,
    FiAlertCircle,
} from 'react-icons/fi';

const Dashboard = () => {
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await stallService.getAll();
            setStalls(res.data || []);
        } catch (err) {
            setError('Không thể kết nối backend. Hãy chắc chắn backend đang chạy ở localhost:8080');
        } finally {
            setLoading(false);
        }
    };

    const stallsWithAudio = stalls.filter((s) => s.audioUrl);
    const stallsWithImage = stalls.filter((s) => s.imageUrl);

    const stats = [
        {
            label: 'Tổng quán ăn',
            value: stalls.length,
            icon: FiMapPin,
            color: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
        },
        {
            label: 'Có audio',
            value: stallsWithAudio.length,
            icon: FiMic,
            color: 'bg-green-50',
            iconColor: 'text-green-600',
        },
        {
            label: 'Có hình ảnh',
            value: stallsWithImage.length,
            icon: FiImage,
            color: 'bg-orange-50',
            iconColor: 'text-orange-600',
        },
        {
            label: 'Tỉ lệ hoàn thiện',
            value: stalls.length > 0 ? `${Math.round((stallsWithAudio.length / stalls.length) * 100)}%` : '0%',
            icon: FiTrendingUp,
            color: 'bg-purple-50',
            iconColor: 'text-purple-600',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
                    <p className="text-gray-500">Chào mừng bạn đến Street Voice Admin!</p>
                </div>
                <Link
                    to="/stalls/new"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                    <FiPlus size={18} /> Thêm quán
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
                    <FiAlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                            <stat.icon className={stat.iconColor} size={24} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {loading ? <span className="text-gray-300">—</span> : stat.value}
                        </p>
                        <p className="text-gray-500 text-sm">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Recent Stalls */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Quán ăn gần đây</h3>
                    <Link to="/stalls" className="text-indigo-600 text-sm font-medium hover:text-indigo-700">
                        Xem tất cả
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : stalls.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Chưa có quán nào. <Link to="/stalls/new" className="text-indigo-600 font-medium">Thêm ngay</Link></p>
                ) : (
                    <div className="space-y-3">
                        {stalls.slice(0, 5).map((stall) => (
                            <div key={stall.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                {stall.imageUrl ? (
                                    <img src={stall.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                                        <FiMapPin className="text-indigo-500" size={20} />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{stall.name}</p>
                                    <p className="text-sm text-gray-500 truncate">{stall.description}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {stall.audioUrl && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Audio</span>
                                    )}
                                    {stall.imageUrl && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Ảnh</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
