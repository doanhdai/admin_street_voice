import { useState } from 'react';
import { FiX, FiLoader } from 'react-icons/fi';
import api from '../services/api';
import { toast } from 'react-toastify';

const StallEditModal = ({ stall, isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        stallId: stall.id,
        name: stall.name,
        description: stall.description || '',
        address: stall.address || '',
        latitude: stall.latitude ?? '',
        longitude: stall.longitude ?? '',
        minPrice: stall.minPrice || 0,
        maxPrice: stall.maxPrice || 0,
        triggerRadius: stall.triggerRadius || 500,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('Price') || name === 'triggerRadius'
                ? parseInt(value) || 0
                : (name === 'latitude' || name === 'longitude')
                    ? (value === '' ? '' : parseFloat(value))
                    : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || formData.latitude === '' || formData.longitude === '') {
            toast.error('Vui lòng điền thông tin bắt buộc');
            return;
        }

        if (formData.latitude < -90 || formData.latitude > 90 || formData.longitude < -180 || formData.longitude > 180) {
            toast.error('Tọa độ không hợp lệ');
            return;
        }

        if (formData.minPrice > formData.maxPrice) {
            toast.error('Giá tối thiểu không được lớn hơn giá tối đa');
            return;
        }

        try {
            setLoading(true);
            await api.post('/api/v1/stall-owner/update-stall', formData);
            onSuccess();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi khi cập nhật quán');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-200 bg-white">
                    <h2 className="text-xl font-bold text-slate-900">Sửa thông tin quán</h2>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-slate-400 hover:text-slate-600 transition"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Tên quán <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Nhập tên quán"
                        />
                    </div>

                    {/* Coordinates */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Tọa độ quán <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="number"
                                step="any"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Latitude"
                            />
                            <input
                                type="number"
                                step="any"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Longitude"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Ví dụ: 10.762622, 106.700174</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Mô tả
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            disabled={loading}
                            rows="3"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Mô tả về quán của bạn"
                        />
                    </div>

                    {/* Price Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Giá min (đ)
                            </label>
                            <input
                                type="number"
                                name="minPrice"
                                value={formData.minPrice}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Giá max (đ)
                            </label>
                            <input
                                type="number"
                                name="maxPrice"
                                value={formData.maxPrice}
                                onChange={handleChange}
                                disabled={loading}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Trigger Radius */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Bán kính kích hoạt (m)
                        </label>
                        <input
                            type="number"
                            name="triggerRadius"
                            value={formData.triggerRadius}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                        >
                            {loading && <FiLoader className="animate-spin" size={18} />}
                            {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StallEditModal;
