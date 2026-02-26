import { useState } from 'react';
import { stallService } from '../services/api';
import { toast } from 'react-toastify';
import {
    FiRefreshCw,
    FiMapPin,
    FiInfo,
    FiZap,
} from 'react-icons/fi';

const SyncData = () => {
    const [params, setParams] = useState({
        lat: '10.762622',
        lng: '106.700174',
        radius: '2000',
    });
    const [syncing, setSyncing] = useState(false);
    const [result, setResult] = useState(null);

    const set = (field) => (e) =>
        setParams((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSync = async () => {
        setSyncing(true);
        setResult(null);
        try {
            const res = await stallService.sync({
                lat: parseFloat(params.lat),
                lng: parseFloat(params.lng),
                radius: parseFloat(params.radius),
            });
            setResult(res.data);
            toast.success(`Đồng bộ thành công ${res.data?.length || 0} quán!`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi khi đồng bộ');
        } finally {
            setSyncing(false);
        }
    };

    const inputClass =
        'w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm';
    const labelClass = 'block text-sm font-medium text-gray-700 mb-2';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Đồng bộ dữ liệu</h1>
                <p className="text-gray-500">Sync quán ăn trong bán kính cho mobile (Offline)</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                <FiInfo className="text-indigo-500 mt-0.5 shrink-0" size={18} />
                <div>
                    <p className="text-sm font-medium text-indigo-800">API Endpoint</p>
                    <p className="text-xs text-indigo-600 font-mono mt-0.5">GET /api/v1/stalls/sync</p>
                    <p className="text-xs text-indigo-600 mt-1">Lấy tất cả quán trong bán kính, tự động generate audio nếu chưa có (Lazy Gen)</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <FiMapPin className="text-indigo-600" size={18} />
                    </div>
                    <h2 className="font-bold text-gray-900">Tham số tìm kiếm</h2>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Vĩ độ (Lat)</label>
                        <input
                            type="number"
                            step="any"
                            value={params.lat}
                            onChange={set('lat')}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Kinh độ (Lng)</label>
                        <input
                            type="number"
                            step="any"
                            value={params.lng}
                            onChange={set('lng')}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Bán kính (m)</label>
                        <input
                            type="number"
                            value={params.radius}
                            onChange={set('radius')}
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="pt-2 flex gap-3">
                    <button
                        onClick={() =>
                            setParams({ lat: '10.762622', lng: '106.700174', radius: '2000' })
                        }
                        className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                        Reset về Quận 4
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                    >
                        <FiRefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                        {syncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
                    </button>
                </div>
            </div>

            {result !== null && (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">
                            Kết quả: {result.length} quán tìm thấy
                        </h3>
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Đồng bộ thành công
                        </span>
                    </div>

                    {result.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            Không có quán nào trong bán kính này
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {result.map((stall) => (
                                <div key={stall.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
                                    {stall.imageUrl ? (
                                        <img src={stall.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                                            <FiMapPin className="text-indigo-400" size={18} />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900">{stall.name}</p>
                                        <p className="text-sm text-gray-500 truncate">{stall.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {stall.audioUrl && (
                                            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                                                <FiZap size={10} /> Audio
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400 font-mono">
                                            {stall.latitude?.toFixed(3)}, {stall.longitude?.toFixed(3)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SyncData;
