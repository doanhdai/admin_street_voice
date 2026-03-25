import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiEdit2, FiLoader } from 'react-icons/fi';
import api from '../../services/api';
import StallEditModal from '../../components/StallEditModal';

const MyStall = () => {
    const [stall, setStall] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        description: '',
        address: '',
        latitude: '',
        longitude: '',
        minPrice: 0,
        maxPrice: 0,
        triggerRadius: 15,
    });

    useEffect(() => {
        fetchMyStall();
    }, []);

    const fetchMyStall = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/v1/stall-owner/my-stall');
            if (res.data?.hasStall === false) {
                setStall(null);
            } else {
                setStall(res.data);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi khi tải thông tin quán');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateField = (field) => (e) => {
        const value = e.target.value;
        setCreateForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreateStall = async (e) => {
        e.preventDefault();

        if (!createForm.name || createForm.latitude === '' || createForm.longitude === '') {
            toast.error('Vui lòng nhập đủ tên quán và tọa độ');
            return;
        }

        try {
            setCreating(true);
            await api.post('/api/v1/stall-owner/update-stall', {
                name: createForm.name,
                description: createForm.description,
                address: createForm.address,
                latitude: Number(createForm.latitude),
                longitude: Number(createForm.longitude),
                minPrice: Number(createForm.minPrice || 0),
                maxPrice: Number(createForm.maxPrice || 0),
                triggerRadius: Number(createForm.triggerRadius || 15),
            });

            toast.success('Đã gửi đăng ký quán ăn, chờ admin phê duyệt');
            fetchMyStall();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Lỗi khi gửi đăng ký quán');
        } finally {
            setCreating(false);
        }
    };

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        fetchMyStall();
        toast.success('Cập nhật quán thành công, chờ admin duyệt');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <FiLoader className="animate-spin text-cyan-600" size={32} />
            </div>
        );
    }

    if (!stall) {
        return (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Đăng ký quán ăn</h2>
                <p className="text-slate-600 mb-6">Điền thông tin quán, hệ thống sẽ gửi yêu cầu ở trạng thái chờ admin duyệt.</p>

                <form onSubmit={handleCreateStall} className="space-y-4">
                    <input
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        placeholder="Tên quán"
                        value={createForm.name}
                        onChange={handleCreateField('name')}
                    />
                    <textarea
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        placeholder="Mô tả"
                        rows={3}
                        value={createForm.description}
                        onChange={handleCreateField('description')}
                    />
                    <input
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                        placeholder="Địa chỉ"
                        value={createForm.address}
                        onChange={handleCreateField('address')}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="number"
                            step="any"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                            placeholder="Latitude"
                            value={createForm.latitude}
                            onChange={handleCreateField('latitude')}
                        />
                        <input
                            type="number"
                            step="any"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                            placeholder="Longitude"
                            value={createForm.longitude}
                            onChange={handleCreateField('longitude')}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <input
                            type="number"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                            placeholder="Giá min"
                            value={createForm.minPrice}
                            onChange={handleCreateField('minPrice')}
                        />
                        <input
                            type="number"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                            placeholder="Giá max"
                            value={createForm.maxPrice}
                            onChange={handleCreateField('maxPrice')}
                        />
                        <input
                            type="number"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                            placeholder="Bán kính"
                            value={createForm.triggerRadius}
                            onChange={handleCreateField('triggerRadius')}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={creating}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-lg disabled:opacity-60"
                    >
                        {creating ? 'Đang gửi...' : 'Gửi đăng ký quán ăn'}
                    </button>
                </form>
            </div>
        );
    }

    const statusBadgeColor = {
        ACTIVE: 'bg-green-100 text-green-800',
        PENDING: 'bg-yellow-100 text-yellow-800',
        INACTIVE: 'bg-gray-100 text-gray-800',
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Stall Info */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Header with Status */}
                    <div className="p-6 border-b border-slate-200 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{stall.name}</h2>
                            <p className="text-slate-600 mt-1">{stall.address}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeColor[stall.status] || statusBadgeColor.ACTIVE}`}>
                            {stall.status === 'ACTIVE' ? '✓ Hoạt động' : stall.status === 'PENDING' ? '⏳ Chờ duyệt' : '✕ Không hoạt động'}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Description */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 mb-2">Mô tả</h3>
                            <p className="text-slate-600 leading-relaxed">{stall.description || 'Chưa có mô tả'}</p>
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-2">Giá tối thiểu</h3>
                                <p className="text-lg font-bold text-cyan-600">
                                    {stall.minPrice?.toLocaleString('vi-VN')} đ
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 mb-2">Giá tối đa</h3>
                                <p className="text-lg font-bold text-cyan-600">
                                    {stall.maxPrice?.toLocaleString('vi-VN')} đ
                                </p>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 mb-2">Vị trí</h3>
                            <p className="text-slate-600">
                                Bán kính kích hoạt: {stall.triggerRadius}m
                            </p>
                            {(stall.latitude != null && stall.longitude != null) && (
                                <p className="text-slate-500 text-sm mt-1">
                                    Tọa độ: {stall.latitude}, {stall.longitude}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Edit Button */}
                    <div className="p-6 bg-slate-50 border-t border-slate-200">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-lg transition"
                        >
                            <FiEdit2 size={18} />
                            Sửa thông tin quán
                        </button>
                    </div>
                </div>
            </div>

            {/* Sidebar - Status Info */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                    <h3 className="font-bold text-slate-900">Thông tin cập nhật</h3>

                    {stall.status === 'PENDING' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                Quán của bạn đang chờ admin duyệt cập nhật. Vui lòng chờ...
                            </p>
                        </div>
                    )}

                    {stall.status === 'ACTIVE' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm text-green-800">
                                Quán của bạn đang hoạt động và hiển thị cho người dùng.
                            </p>
                        </div>
                    )}

                    <div className="text-xs text-slate-500 space-y-2">
                        <p>💡 Khi bạn sửa thông tin, quán sẽ chuyển sang trạng thái "Chờ duyệt"</p>
                        <p>✓ Admin sẽ duyệt thay đổi của bạn</p>
                        <p>📱 Sau khi được duyệt, thay đổi sẽ hiển thị cho người dùng</p>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <StallEditModal
                    stall={stall}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
};

export default MyStall;
