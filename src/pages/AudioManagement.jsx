import { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import { toast } from 'react-toastify';
import {
    FiMusic,
    FiRefreshCw,
    FiTrash2,
    FiPlay,
    FiAlertCircle,
    FiCheckCircle,
} from 'react-icons/fi';

const AudioManagement = () => {
    const [audioFiles, setAudioFiles] = useState([]);
    const [orphanedFiles, setOrphanedFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkingOrphaned, setCheckingOrphaned] = useState(false);
    const [regenerating, setRegenerating] = useState(null);

    useEffect(() => {
        fetchAudioFiles();
    }, []);

    const fetchAudioFiles = async () => {
        try {
            setLoading(true);
            const res = await adminService.listAudio();
            setAudioFiles(res.data || []);
        } catch (err) {
            toast.error('Không thể tải danh sách âm thanh');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOrphaned = async () => {
        try {
            setCheckingOrphaned(true);
            const res = await adminService.listOrphanedAudio();
            setOrphanedFiles(res.data || []);
            if (res.data?.length === 0) {
                toast.success('Không có file âm thanh  ');
            } else {
                toast.warning(`Tìm thấy ${res.data?.length} file  `);
            }
        } catch (err) {
            toast.error('Lỗi khi kiểm tra file  ');
        } finally {
            setCheckingOrphaned(false);
        }
    };

    const handleDelete = async (fileName) => {
        if (!window.confirm(`Bạn có chắc muốn xóa vĩnh viễn file "${fileName}"?`)) return;
        try {
            await adminService.deleteAudio(fileName);
            toast.success('Đã xóa file');
            setAudioFiles(audioFiles.filter(f => f !== fileName));
            setOrphanedFiles(orphanedFiles.filter(f => f !== fileName));
        } catch (err) {
            toast.error('Lỗi khi xóa file');
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
                    <h1 className="text-2xl font-bold text-gray-900">Quản Lý Âm Thanh</h1>
                    <p className="text-gray-500">Danh sách các file MP3 trên server</p>
                </div>
                <button
                    onClick={handleCheckOrphaned}
                    disabled={checkingOrphaned}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25 disabled:opacity-50"
                >
                    <FiAlertCircle size={18} />
                    {checkingOrphaned ? 'Đang kiểm tra...' : 'Tìm file  '}
                </button>
            </div>

            {orphanedFiles.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <FiAlertCircle className="text-amber-500 mt-1" size={20} />
                        <div className="flex-1">
                            <h3 className="font-semibold text-amber-800">Cảnh báo: File  </h3>
                            <p className="text-sm text-amber-700 mb-3">
                                Tìm thấy {orphanedFiles.length} file tồn tại trên server nhưng không được gán cho quán ăn nào.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {orphanedFiles.map(file => (
                                    <div key={file} className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-amber-200 text-xs text-amber-800">
                                        {file}
                                        <button
                                            onClick={() => handleDelete(file)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <FiTrash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tên file</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Định dạng</th>
                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {audioFiles.map((file) => (
                            <tr key={file} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                                            <FiMusic size={18} />
                                        </div>
                                        <span className="font-medium text-gray-900">{file}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium uppercase">
                                        MP3
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => window.open(`http://localhost:8080/audio/${file}`, '_blank')}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                            title="Nghe thử"
                                        >
                                            <FiPlay size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(file)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Xóa vĩnh viễn"
                                        >
                                            <FiTrash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {audioFiles.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        Chưa có file âm thanh nào trên server.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AudioManagement;
