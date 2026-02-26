import { useState } from 'react';
import { analyticsService } from '../services/api';
import { toast } from 'react-toastify';
import { FiBarChart2, FiSend, FiInfo } from 'react-icons/fi';

const eventTypes = ['VIEW', 'PLAY', 'FINISH_AUDIO', 'CLICK'];

const Analytics = () => {
    const [form, setForm] = useState({
        userId: '',
        stallId: '',
        eventType: 'VIEW',
        duration: '',
    });
    const [sending, setSending] = useState(false);

    const set = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const handleTrack = async (e) => {
        e.preventDefault();
        if (!form.stallId) {
            toast.error('Vui lòng nhập Stall ID');
            return;
        }
        setSending(true);
        try {
            const payload = {
                userId: form.userId || null,
                stallId: parseInt(form.stallId),
                eventType: form.eventType,
                duration: form.duration ? parseInt(form.duration) : null,
            };
            await analyticsService.track(payload);
            toast.success('Event đã được ghi nhận!');
            setForm((prev) => ({ ...prev, stallId: '', duration: '' }));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi khi ghi nhận event');
        } finally {
            setSending(false);
        }
    };

    const inputClass =
        'w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm';
    const labelClass = 'block text-sm font-medium text-gray-700 mb-2';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-500">Ghi nhận hoạt động người dùng</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                <FiInfo className="text-indigo-500 mt-0.5 shrink-0" size={18} />
                <div>
                    <p className="text-sm font-medium text-indigo-800">API Endpoint</p>
                    <p className="text-xs text-indigo-600 font-mono mt-0.5">POST /api/v1/analytics/track</p>
                    <p className="text-xs text-indigo-600 mt-1">Ghi nhận sự kiện xem, nghe audio của người dùng trên ứng dụng</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <FiSend className="text-indigo-600" size={18} />
                        </div>
                        <h2 className="font-bold text-gray-900">Gửi Track Event</h2>
                    </div>

                    <form onSubmit={handleTrack} className="space-y-4">
                        <div>
                            <label className={labelClass}>Loại sự kiện</label>
                            <select
                                value={form.eventType}
                                onChange={set('eventType')}
                                className={inputClass}
                            >
                                {eventTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelClass}>Stall ID <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                value={form.stallId}
                                onChange={set('stallId')}
                                className={inputClass}
                                placeholder="VD: 1"
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>User ID (tùy chọn)</label>
                            <input
                                type="text"
                                value={form.userId}
                                onChange={set('userId')}
                                className={inputClass}
                                placeholder="ID người dùng"
                            />
                        </div>

                        {(form.eventType === 'PLAY' || form.eventType === 'FINISH_AUDIO') && (
                            <div>
                                <label className={labelClass}>Thời lượng (giây)</label>
                                <input
                                    type="number"
                                    value={form.duration}
                                    onChange={set('duration')}
                                    className={inputClass}
                                    placeholder="VD: 120"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <FiSend size={16} />
                            {sending ? 'Đang gửi...' : 'Gửi Event'}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                            <FiBarChart2 className="text-green-600" size={18} />
                        </div>
                        <h2 className="font-bold text-gray-900">Thông tin Events</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { type: 'VIEW', desc: 'Người dùng xem thông tin quán', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                            { type: 'PLAY', desc: 'Bắt đầu phát audio giới thiệu', color: 'bg-green-50 text-green-700 border-green-100' },
                            { type: 'FINISH_AUDIO', desc: 'Nghe hết audio (kèm duration)', color: 'bg-purple-50 text-purple-700 border-purple-100' },
                            { type: 'CLICK', desc: 'Người dùng click vào quán', color: 'bg-orange-50 text-orange-700 border-orange-100' },
                        ].map(({ type, desc, color }) => (
                            <div key={type} className={`p-4 rounded-xl border ${color}`}>
                                <p className="font-semibold text-sm">{type}</p>
                                <p className="text-xs mt-0.5 opacity-80">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
