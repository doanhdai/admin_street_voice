import { useState } from 'react';
import { adminService } from '../services/api';
import { toast } from 'react-toastify';
import {
    FiUpload,
    FiFileText,
    FiCheckCircle,
    FiXCircle,
    FiAlertTriangle,
} from 'react-icons/fi';

const SystemAdmin = () => {
    const [jsonContent, setJsonContent] = useState('');
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);

    const handleImport = async (e) => {
        e.preventDefault();
        if (!jsonContent.trim()) {
            toast.error('Vui lòng nhập nội dung JSON');
            return;
        }

        try {
            setImporting(true);
            setResult(null);
            const parsedData = JSON.parse(jsonContent);
            const res = await adminService.importJson(parsedData);
            setResult({
                success: true,
                message: res.data?.message || 'Import thành công!',
                count: res.data?.count || 0
            });
            toast.success('Đã import dữ liệu');
            setJsonContent('');
        } catch (err) {
            console.error(err);
            setResult({
                success: false,
                message: err.response?.data?.message || 'Dữ liệu JSON không hợp lệ hoặc lỗi server.'
            });
            toast.error('Lỗi khi import');
        } finally {
            setImporting(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setJsonContent(event.target.result);
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Hệ Thống</h1>
                <p className="text-gray-500">Quản trị nâng cao và import dữ liệu</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FiUpload className="text-indigo-600" />
                            Import Dữ Liệu Quán Ăn
                        </h2>

                        <form onSubmit={handleImport} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nội dung JSON
                                </label>
                                <textarea
                                    className="w-full h-80 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-mono text-sm"
                                    placeholder='[{"name": "Quán A", "description": "...", ...}]'
                                    value={jsonContent}
                                    onChange={(e) => setJsonContent(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 cursor-pointer transition-colors">
                                    <FiFileText />
                                    Chọn file .json
                                    <input
                                        type="file"
                                        accept=".json"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>

                                <button
                                    type="submit"
                                    disabled={importing}
                                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                                >
                                    {importing ? 'Đang import...' : 'Bắt đầu Import'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {result && (
                        <div className={`p-6 rounded-2xl border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-start gap-3">
                                {result.success ? (
                                    <FiCheckCircle className="text-green-500 mt-1" size={24} />
                                ) : (
                                    <FiXCircle className="text-red-500 mt-1" size={24} />
                                )}
                                <div>
                                    <h3 className={`font-bold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                        Kết quả: {result.success ? 'Thành công' : 'Thất bại'}
                                    </h3>
                                    <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                                        {result.message}
                                    </p>
                                    {result.count > 0 && (
                                        <p className="mt-2 font-semibold text-green-800">
                                            Đã thêm/cập nhật {result.count} quán ăn.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-indigo-600 rounded-2xl p-6 text-white">
                        <h3 className="font-bold flex items-center gap-2 mb-3">
                            <FiAlertTriangle /> Lưu ý khi Import
                        </h3>
                        <ul className="text-sm space-y-2 text-indigo-100 list-disc pl-4">
                            <li>Dữ liệu phải là mảng các object.</li>
                            <li>Nếu trùng `stallID`, dữ liệu sẽ được cập nhật.</li>
                            <li>Nên backup dữ liệu trước khi import số lượng lớn.</li>
                            <li>File JSON nên có cấu trúc tương ứng với FoodStall DTO.</li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-3">Thông tin API</h3>
                        <div className="space-y-3">
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Method</p>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">POST</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Endpoint</p>
                                <code className="text-xs text-indigo-600">/api/v1/admin/import-json</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemAdmin;
