import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { stallService } from '../services/api';
import { toast } from 'react-toastify';
import {
    FiSave,
    FiArrowLeft,
    FiMapPin,
    FiMic,
    FiImage,
    FiFileText,
    FiType,
    FiGlobe,
    FiPlay,
    FiPause,
    FiVolume2
} from 'react-icons/fi';

const inputClass =
    'w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm';

const labelClass = 'block text-sm font-medium text-gray-700 mb-2';

const StallForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [playingUrl, setPlayingUrl] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        audioUrl: '',
        latitude: '',
        longitude: '',
        localizations: []
    });

    const LANGUAGES = [
        { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
        { code: 'en', label: 'English',    flag: '🇺🇸' },
        { code: 'ja', label: '日本語',      flag: '🇯🇵' },
        { code: 'ko', label: '한국어',      flag: '🇰🇷' },
        { code: 'zh', label: '中文',        flag: '🇨🇳' },
    ];

    const API_BASE_URL = 'http://localhost:8080';

    useEffect(() => {
        if (isEdit) fetchStall();
    }, [id]);

    const fetchStall = async () => {
        try {
            const res = await stallService.getById(id);
            const d = res.data;
            setFormData({
                name: d.name || '',
                description: d.description || '',
                imageUrl: d.imageUrl || '',
                audioUrl: d.audioUrl || '',
                latitude: d.latitude != null ? String(d.latitude) : '',
                longitude: d.longitude != null ? String(d.longitude) : '',
                localizations: d.localizations || []
            });
        } catch {
            toast.error('Không thể tải thông tin quán');
        } finally {
            setLoading(false);
        }
    };

    const set = (field) => (e) =>
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên quán');
            return;
        }

        const payload = {
            name: formData.name,
            description: formData.description,
            imageUrl: formData.imageUrl || null,
            audioUrl: formData.audioUrl || null,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        };

        setSaving(true);
        try {
            if (isEdit) {
                await stallService.update(id, payload);
                toast.success('Đã cập nhật quán ăn!');
            } else {
                await stallService.create(payload);
                toast.success('Đã thêm quán ăn mới!');
            }
            navigate('/stalls');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse" />
                <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <FiArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEdit ? 'Chỉnh sửa quán' : 'Thêm quán mới'}
                    </h1>
                    <p className="text-gray-500">{isEdit ? `Đang sửa ID: ${id}` : 'Thêm quán ăn vào hệ thống'}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
                    <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wider text-gray-400">
                        Thông tin cơ bản
                    </h2>

                    <div>
                        <label className={labelClass}>
                            <FiType className="inline mr-1.5" />
                            Tên quán <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={set('name')}
                            className={inputClass}
                            placeholder="VD: Phở Bát Đàn"
                            required
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            <FiFileText className="inline mr-1.5" />
                            Mô tả
                        </label>
                        <textarea
                            rows={4}
                            value={formData.description}
                            onChange={set('description')}
                            className={inputClass}
                            placeholder="Mô tả về quán ăn..."
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400">
                        Media
                    </h2>

                    <div>
                        <label className={labelClass}>
                            <FiImage className="inline mr-1.5" />
                            URL Hình ảnh
                        </label>
                        <input
                            type="url"
                            value={formData.imageUrl}
                            onChange={set('imageUrl')}
                            className={inputClass}
                            placeholder="https://example.com/image.jpg"
                        />
                        {formData.imageUrl && (
                            <div className="mt-3">
                                <img
                                    src={formData.imageUrl}
                                    alt="Preview"
                                    className="h-28 w-auto rounded-xl object-cover border border-gray-100"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>
                            <FiMic className="inline mr-1.5" />
                            Danh sách Audio (Theo ngôn ngữ)
                        </label>
                        
                        <div className="space-y-3 mt-2">
                            {LANGUAGES.map(lang => {
                                const loc = formData.localizations.find(l => l.languageCode === lang.code);
                                // Fallback: if it's 'vi' and no localization, check formData.audioUrl
                                let audioUrl = loc?.audioUrl;
                                if (!audioUrl && lang.code === 'vi' && formData.audioUrl) {
                                    audioUrl = formData.audioUrl;
                                }

                                const hasAudio = !!audioUrl;
                                const absoluteAudioUrl = hasAudio 
                                    ? (audioUrl.startsWith('http') ? audioUrl : `${API_BASE_URL}${audioUrl}`)
                                    : null;
                                const isCurrentPlaying = playingUrl === absoluteAudioUrl && absoluteAudioUrl !== null;

                                return (
                                    <div key={lang.code} className="flex flex-col gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{lang.flag}</span>
                                                <span className="text-xs font-bold text-gray-700 uppercase">{lang.label}</span>
                                            </div>
                                            {hasAudio && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPlayingUrl(isCurrentPlaying ? null : absoluteAudioUrl)}
                                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                                        isCurrentPlaying 
                                                            ? 'bg-red-500 text-white shadow-md' 
                                                            : 'bg-indigo-600 text-white shadow-md hover:scale-110'
                                                    }`}
                                                >
                                                    {isCurrentPlaying ? <FiPause size={12} /> : <FiPlay size={12} className="ml-0.5" />}
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                readOnly
                                                value={audioUrl || 'Chưa có audio...'}
                                                className="flex-1 bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[11px] font-mono text-gray-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
                    <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400">
                        Vị trí GPS
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>
                                <FiMapPin className="inline mr-1.5" />
                                Vĩ độ (Latitude)
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={formData.latitude}
                                onChange={set('latitude')}
                                className={inputClass}
                                placeholder="VD: 21.0285"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                <FiMapPin className="inline mr-1.5" />
                                Kinh độ (Longitude)
                            </label>
                            <input
                                type="number"
                                step="any"
                                value={formData.longitude}
                                onChange={set('longitude')}
                                className={inputClass}
                                placeholder="VD: 105.8542"
                            />
                        </div>
                    </div>
                </div>

                {/* Hidden Audio element for playback */}
                {playingUrl && (
                    <audio 
                        src={playingUrl} 
                        autoPlay 
                        onEnded={() => setPlayingUrl(null)}
                        onError={() => {
                            toast.error("Không thể phát audio");
                            setPlayingUrl(null);
                        }}
                        className="hidden"
                    />
                )}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-white text-gray-600 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                    >
                        <FiSave />
                        {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm quán'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StallForm;
