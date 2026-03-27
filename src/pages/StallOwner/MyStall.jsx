import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
    FiAlertTriangle,
    FiCheckCircle,
    FiClock,
    FiDollarSign,
    FiEdit2,
    FiLoader,
    FiMapPin,
    FiNavigation,
    FiSend,
    FiTag,
} from 'react-icons/fi';
import api from '../../services/api';
import StallEditModal from '../../components/StallEditModal';

const defaultCreateForm = {
    name: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    minPrice: 0,
    maxPrice: 0,
    triggerRadius: 15,
};

const statusMeta = {
    ACTIVE: {
        label: 'Đang hoạt động',
        chip: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        panel: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
        icon: FiCheckCircle,
        note: 'Quán của bạn đang hiển thị cho người dùng trong ứng dụng.',
    },
    PENDING: {
        label: 'Chờ duyệt',
        chip: 'bg-amber-100 text-amber-800 border border-amber-200',
        panel: 'bg-amber-50 border border-amber-200 text-amber-800',
        icon: FiClock,
        note: 'Yêu cầu cập nhật đang được admin xem xét. Bạn chưa thể chỉnh sửa thêm.',
    },
    INACTIVE: {
        label: 'Bị từ chối',
        chip: 'bg-rose-100 text-rose-800 border border-rose-200',
        panel: 'bg-rose-50 border border-rose-200 text-rose-800',
        icon: FiAlertTriangle,
        note: 'Yêu cầu hiện tại chưa được duyệt. Vui lòng chỉnh sửa và gửi lại.',
    },
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const MyStall = () => {
    const [stall, setStall] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [createForm, setCreateForm] = useState(defaultCreateForm);

    const isRejectedStall = stall?.status === 'INACTIVE';
    const isPendingStall = stall?.status === 'PENDING';
    const shouldShowRegistrationForm = !stall || isRejectedStall;

    const currentStatus = useMemo(() => statusMeta[stall?.status] || statusMeta.ACTIVE, [stall]);

    useEffect(() => {
        fetchMyStall();
    }, []);

    useEffect(() => {
        if (!isRejectedStall) return;
        setCreateForm({
            name: stall?.name || '',
            description: stall?.description || '',
            address: stall?.address || '',
            latitude: stall?.latitude ?? '',
            longitude: stall?.longitude ?? '',
            minPrice: stall?.minPrice ?? 0,
            maxPrice: stall?.maxPrice ?? 0,
            triggerRadius: stall?.triggerRadius ?? 15,
        });
    }, [isRejectedStall, stall]);

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

        if (Number(createForm.maxPrice || 0) < Number(createForm.minPrice || 0)) {
            toast.error('Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu');
            return;
        }

        if (Number(createForm.triggerRadius || 0) <= 0) {
            toast.error('Bán kính kích hoạt phải lớn hơn 0');
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

            toast.success('Đã gửi yêu cầu, vui lòng chờ admin phê duyệt');
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
        toast.success('Cập nhật thành công, yêu cầu đang chờ admin duyệt');
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-slate-700 shadow-sm">
                    <FiLoader className="animate-spin text-indigo-600" size={20} />
                    <span className="font-medium">Đang tải dữ liệu quán...</span>
                </div>
            </div>
        );
    }

    if (shouldShowRegistrationForm) {
        return (
            <div className="mx-auto max-w-4xl space-y-6">
                <section className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-6 text-white shadow-lg sm:px-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100">Street Voice Owner Portal</p>
                    <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                        {isRejectedStall ? 'Đăng ký lại quán ăn' : 'Đăng ký quán ăn của bạn'}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm text-indigo-100 sm:text-base">
                        {isRejectedStall
                            ? 'Yêu cầu trước đó chưa được duyệt. Cập nhật lại thông tin theo góp ý và gửi lại để admin xét duyệt.'
                            : 'Điền đầy đủ thông tin quán để gửi lên hệ thống. Sau khi duyệt, quán sẽ hiển thị cho người dùng.'}
                    </p>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    {isRejectedStall && (
                        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                            Yêu cầu cũ chưa được duyệt. Bạn có thể chỉnh sửa thông tin và gửi lại ngay.
                        </div>
                    )}

                    <form onSubmit={handleCreateStall} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Tên quán</label>
                                <input
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                                    placeholder="Ví dụ: Bún bò Vĩnh Khánh"
                                    value={createForm.name}
                                    onChange={handleCreateField('name')}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mô tả quán</label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                                    placeholder="Món nổi bật, phong cách quán, giờ đông khách..."
                                    rows={4}
                                    value={createForm.description}
                                    onChange={handleCreateField('description')}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Địa chỉ</label>
                                <input
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                                    placeholder="Ví dụ: 123 Vĩnh Khánh, Quận 4"
                                    value={createForm.address}
                                    onChange={handleCreateField('address')}
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                                    placeholder="10.762622"
                                    value={createForm.latitude}
                                    onChange={handleCreateField('latitude')}
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                                    placeholder="106.695877"
                                    value={createForm.longitude}
                                    onChange={handleCreateField('longitude')}
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Giá tối thiểu (VND)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                                    placeholder="25000"
                                    value={createForm.minPrice}
                                    onChange={handleCreateField('minPrice')}
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Giá tối đa (VND)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                                    placeholder="120000"
                                    value={createForm.maxPrice}
                                    onChange={handleCreateField('maxPrice')}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Bán kính kích hoạt audio (m)</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                                    placeholder="15"
                                    value={createForm.triggerRadius}
                                    onChange={handleCreateField('triggerRadius')}
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            Khoảng giá giúp khách ước lượng chi phí. Bán kính kích hoạt là khoảng cách để audio tự phát khi khách đến gần quán.
                        </div>

                        <button
                            type="submit"
                            disabled={creating}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {creating ? <FiLoader className="animate-spin" /> : <FiSend />}
                            {creating
                                ? 'Đang gửi yêu cầu...'
                                : isRejectedStall
                                    ? 'Gửi lại đăng ký quán ăn'
                                    : 'Gửi đăng ký quán ăn'}
                        </button>
                    </form>
                </section>
            </div>
        );
    }

    const StatusIcon = currentStatus.icon;

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Quán của tôi</p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{stall.name}</h2>
                        <p className="mt-1 text-sm text-slate-600">{stall.address || 'Chưa cập nhật địa chỉ'}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${currentStatus.chip}`}>
                        <StatusIcon size={14} />
                        {currentStatus.label}
                    </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Khoảng giá</p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">{formatCurrency(stall.minPrice)} - {formatCurrency(stall.maxPrice)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Bán kính kích hoạt</p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">{stall.triggerRadius || 0} m</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Tọa độ</p>
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                            {stall.latitude != null && stall.longitude != null ? `${stall.latitude}, ${stall.longitude}` : 'Chưa cập nhật'}
                        </p>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-3">
                <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                    <h3 className="text-lg font-bold text-slate-900">Thông tin chi tiết</h3>

                    <div className="mt-5 space-y-5">
                        <div className="rounded-xl border border-slate-200 p-4">
                            <div className="mb-2 flex items-center gap-2 text-slate-700">
                                <FiTag className="text-indigo-600" />
                                <p className="text-sm font-semibold">Mô tả quán</p>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-600">{stall.description || 'Chưa có mô tả cho quán.'}</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="mb-2 flex items-center gap-2 text-slate-700">
                                    <FiDollarSign className="text-indigo-600" />
                                    <p className="text-sm font-semibold">Giá tối thiểu</p>
                                </div>
                                <p className="text-base font-bold text-indigo-600">{formatCurrency(stall.minPrice)}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="mb-2 flex items-center gap-2 text-slate-700">
                                    <FiDollarSign className="text-indigo-600" />
                                    <p className="text-sm font-semibold">Giá tối đa</p>
                                </div>
                                <p className="text-base font-bold text-indigo-600">{formatCurrency(stall.maxPrice)}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                            <div className="mb-2 flex items-center gap-2 text-slate-700">
                                <FiMapPin className="text-indigo-600" />
                                <p className="text-sm font-semibold">Địa điểm và geofence</p>
                            </div>
                            <p className="text-sm text-slate-600">Bán kính kích hoạt: <span className="font-semibold text-slate-800">{stall.triggerRadius || 0} m</span></p>
                            {stall.latitude != null && stall.longitude != null && (
                                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                                    <FiNavigation size={14} />
                                    {stall.latitude}, {stall.longitude}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 border-t border-slate-200 pt-6">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            disabled={isPendingStall}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FiEdit2 size={18} />
                            {isPendingStall ? 'Đang chờ duyệt, tạm khóa chỉnh sửa' : 'Chỉnh sửa thông tin quán'}
                        </button>
                    </div>
                </section>

                <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                    <h3 className="text-lg font-bold text-slate-900">Trạng thái duyệt</h3>

                    <div className={`mt-4 rounded-xl p-4 text-sm ${currentStatus.panel}`}>
                        <p className="font-semibold">{currentStatus.label}</p>
                        <p className="mt-1">{currentStatus.note}</p>
                    </div>

                    <div className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        <p>1. Khi chỉnh sửa, quán sẽ chuyển sang trạng thái chờ duyệt.</p>
                        <p>2. Admin sẽ kiểm tra nội dung và phê duyệt thay đổi.</p>
                        <p>3. Sau khi duyệt, thông tin mới sẽ hiển thị cho người dùng.</p>
                    </div>
                </aside>
            </div>

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
