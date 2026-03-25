import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import { toast } from 'react-toastify';
import { FiUserPlus, FiUsers, FiLoader } from 'react-icons/fi';

const initialForm = {
    username: '',
    email: '',
    password: '',
    stallId: '',
};

const AccountManagement = () => {
    const [owners, setOwners] = useState([]);
    const [availableStalls, setAvailableStalls] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [ownersRes, availableStallsRes] = await Promise.all([
                adminService.listOwnerAccounts(),
                adminService.listAvailableStalls(),
            ]);
            setOwners(ownersRes.data || []);
            setAvailableStalls(availableStallsRes.data || []);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể tải dữ liệu tài khoản');
        } finally {
            setLoading(false);
        }
    };

    const setField = (field) => (e) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handleCreateOwner = async (e) => {
        e.preventDefault();
        if (!form.username || !form.email || !form.password || !form.stallId) {
            toast.error('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        try {
            setCreating(true);
            await adminService.createOwnerAccount({
                ...form,
                stallId: Number(form.stallId),
            });
            toast.success('Tạo tài khoản owner thành công');
            setForm(initialForm);
            await loadData();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể tạo tài khoản owner');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <FiLoader className="animate-spin text-indigo-600" size={28} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
                <p className="text-gray-500">Tạo tài khoản owner và gắn với ID quán</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiUserPlus className="text-indigo-600" />
                        Tạo tài khoản owner
                    </h2>

                    <form onSubmit={handleCreateOwner} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                type="text"
                                value={form.username}
                                onChange={setField('username')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                placeholder="owner_quan_1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={setField('email')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                placeholder="owner@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={setField('password')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                placeholder="Tối thiểu 8 ký tự"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn quán (stallId)</label>
                            <select
                                value={form.stallId}
                                onChange={setField('stallId')}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                            >
                                <option value="">-- Chọn quán --</option>
                                {availableStalls.map((stall) => (
                                    <option key={stall.id} value={stall.id}>
                                        #{stall.id} - {stall.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={creating}
                            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {creating ? 'Đang tạo...' : 'Tạo tài khoản owner'}
                        </button>
                    </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiUsers className="text-indigo-600" />
                        Danh sách tài khoản owner
                    </h2>

                    {owners.length === 0 ? (
                        <p className="text-sm text-gray-500">Chưa có tài khoản owner nào.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="py-2 pr-4">ID</th>
                                        <th className="py-2 pr-4">Username</th>
                                        <th className="py-2 pr-4">Email</th>
                                        <th className="py-2 pr-4">Quán</th>
                                        <th className="py-2 pr-4">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {owners.map((owner) => (
                                        <tr key={owner.id} className="border-b last:border-b-0">
                                            <td className="py-2 pr-4">{owner.id}</td>
                                            <td className="py-2 pr-4 font-medium text-gray-900">{owner.username}</td>
                                            <td className="py-2 pr-4">{owner.email}</td>
                                            <td className="py-2 pr-4">#{owner.stallId} - {owner.stallName}</td>
                                            <td className="py-2 pr-4">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${owner.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {owner.enabled ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountManagement;
