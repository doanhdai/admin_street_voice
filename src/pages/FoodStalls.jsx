import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stallService } from '../services/api';
import { toast } from 'react-toastify';
import {
    FiPlus,
    FiEdit,
    FiTrash2,
    FiMic,
    FiImage,
    FiMapPin,
    FiEye,
} from 'react-icons/fi';

const FoodStalls = () => {
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStalls();
    }, []);

    const fetchStalls = async () => {
        try {
            setLoading(true);
            const res = await stallService.getAll();
            setStalls(res.data || []);
        } catch (err) {
            toast.error('Không thể tải danh sách quán');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc muốn xóa "${name}"?`)) return;
        try {
            await stallService.delete(id);
            toast.success('Đã xóa quán ăn');
            fetchStalls();
        } catch (err) {
            toast.error('Lỗi khi xóa');
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
                <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quán Ăn</h1>
                    <p className="text-gray-500">{stalls.length} quán ăn</p>
                </div>
                <Link
                    to="/stalls/new"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                    <FiPlus size={18} /> Thêm quán
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {stalls.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FiMapPin className="text-indigo-500" size={28} />
                        </div>
                        <p className="text-gray-500 mb-4">Chưa có quán nào</p>
                        <Link
                            to="/stalls/new"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                        >
                            <FiPlus /> Thêm quán đầu tiên
                        </Link>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Quán ăn</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Toạ độ</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Media</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mô tả</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stalls.map((stall) => (
                                <tr key={stall.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {stall.imageUrl ? (
                                                <img
                                                    src={stall.imageUrl}
                                                    alt=""
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                                                    <FiMapPin className="text-indigo-400" size={18} />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900">{stall.name}</p>
                                                <p className="text-xs text-gray-400">ID: {stall.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {stall.latitude != null ? (
                                            <div className="text-xs text-gray-600 space-y-0.5">
                                                <p>Lat: <span className="font-mono">{stall.latitude?.toFixed(5)}</span></p>
                                                <p>Lng: <span className="font-mono">{stall.longitude?.toFixed(5)}</span></p>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-sm">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${stall.audioUrl
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-400'
                                                    }`}
                                            >
                                                <FiMic size={11} />
                                                Audio
                                            </span>
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${stall.imageUrl
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-gray-100 text-gray-400'
                                                    }`}
                                            >
                                                <FiImage size={11} />
                                                Ảnh
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-gray-500 text-sm line-clamp-2 max-w-xs">{stall.description || '—'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {stall.audioUrl && (
                                                <a
                                                    href={stall.audioUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                                    title="Nghe Audio"
                                                >
                                                    <FiEye size={18} />
                                                </a>
                                            )}
                                            <Link
                                                to={`/stalls/${stall.id}/edit`}
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                            >
                                                <FiEdit size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(stall.id, stall.name)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default FoodStalls;
