import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stallService, adminService } from '../services/api';
import { toast } from 'react-toastify';
import {
    FiPlus,
    FiEdit,
    FiTrash2,
    FiMic,
    FiImage,
    FiMapPin,
    FiEye,
    FiSearch,
    FiChevronLeft,
    FiChevronRight,
    FiFilter,
    FiRefreshCw,
    FiX,
    FiGlobe,
} from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:8080';

const LANGUAGES = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English',    flag: '🇺🇸' },
    { code: 'ja', label: '日本語',      flag: '🇯🇵' },
    { code: 'ko', label: '한국어',      flag: '🇰🇷' },
    { code: 'zh', label: '中文',        flag: '🇨🇳' },
    { code: 'all', label: 'Tất cả (Auto)', flag: '✨' },
];

const FoodStalls = () => {
    const [stalls, setStalls] = useState([]);
    const [generatingAudio, setGeneratingAudio] = useState({});
    // audioModal: null | { id, name }
    const [audioModal, setAudioModal] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState('vi');
    const [loading, setLoading] = useState(true);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pagination, setPagination] = useState({ // New pagination state
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
    });

    // Filter states
    const [keyword, setKeyword] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minRating, setMinRating] = useState('');
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [sortBy, setSortBy] = useState('id,desc');

    useEffect(() => {
        fetchStalls();
    }, [page, size, sortBy, selectedLanguage]); // Added selectedLanguage to dependencies

    const fetchStalls = async () => {
        try {
            setLoading(true);
            const params = {
                page,
                size,
                sort: sortBy,
                lang: selectedLanguage, // Added lang parameter
            };

            if (keyword) params.keyword = keyword;
            if (minPrice) params.minPrice = minPrice;
            if (maxPrice) params.maxPrice = maxPrice;
            if (minRating) params.minRating = minRating;

            const res = await stallService.search(params);

            // Assuming the backend returns a Page object: { data: { content: [], totalPages: 0, ... } }
            // If the user's backend returns the data directly: res.data = { content: [], ... }
            const pageData = res.data?.data || res.data;

            if (pageData && pageData.content) {
                setStalls(pageData.content);
                setTotalPages(pageData.totalPages || 0);
                setTotalElements(pageData.totalElements || 0);
                setPagination({
                    total: pageData.totalElements || 0,
                    page: (pageData.number || 0) + 1,
                    limit: pageData.size || 10,
                    pages: pageData.totalPages || 0
                });
            } else {
                setStalls(Array.isArray(pageData) ? pageData : []);
                setTotalPages(0);
                setTotalElements(Array.isArray(pageData) ? pageData.length : 0);
                setPagination({
                    total: Array.isArray(pageData) ? pageData.length : 0,
                    page: 1,
                    limit: 10,
                    pages: 0
                });
            }
        } catch (err) {
            toast.error('Không thể tải danh sách quán');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        fetchStalls();
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

    const openAudioModal = (stall) => {
        setAudioModal({ id: stall.id, name: stall.name });
        setSelectedLanguage('vi'); // Changed from setSelectedLang
    };

    const closeAudioModal = () => setAudioModal(null);

    const handleGenerateAudio = async () => {
        if (!audioModal) return;
        const { id, name } = audioModal;
        setGeneratingAudio(prev => ({ ...prev, [id]: true }));
        closeAudioModal();
        try {
            if (selectedLanguage === 'all') {
                // Gọi endpoint tạo tất cả ngôn ngữ (Phase 5 Automation)
                await stallService.generateAllAudio(id);
                toast.success(`Đang tạo audio tất cả ngôn ngữ cho "${name}". Vui lòng chờ vài giây.`);
            } else if (selectedLanguage === 'vi') {
                // Dùng endpoint admin/regenerate cho tiếng Việt (nguồn gốc)
                await adminService.regenerateAudio(id);
                toast.success(`Đã tạo audio Tiếng Việt cho "${name}"`);
            } else {
                // Dùng endpoint localization cho ngôn ngữ khác
                await stallService.generateAudio(id, selectedLanguage);
                const langLabel = LANGUAGES.find(l => l.code === selectedLanguage)?.label || selectedLanguage;
                toast.success(`Đã tạo audio ${langLabel} cho "${name}"`);
            }
            fetchStalls();
        } catch (err) {
            toast.error(`Lỗi khi tạo audio cho "${name}"`);
            console.error(err);
        } finally {
            setGeneratingAudio(prev => ({ ...prev, [id]: false }));
        }
    };

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100">
                <p className="text-sm text-gray-500">
                    Hiển thị <span className="font-medium text-gray-900">{stalls.length}</span> / <span className="font-medium text-gray-900">{totalElements}</span> quán
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
                    >
                        <FiChevronLeft />
                    </button>
                    <div className="flex items-center px-4 text-sm font-medium text-gray-700">
                        Trang {page + 1} / {totalPages}
                    </div>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page === totalPages - 1}
                        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
                    >
                        <FiChevronRight />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Quán Ăn</h1>
                    {/* Language Selector in List View */}
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-sm ml-2">
                        {LANGUAGES.filter(l => l.code !== 'all').map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => setSelectedLanguage(lang.code)}
                                title={lang.label}
                                className={`flex flex-col items-center justify-center w-10 py-1 rounded-lg transition-all ${
                                    selectedLanguage === lang.code
                                        ? 'bg-white shadow-md text-indigo-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <span className="text-base leading-none">{lang.flag}</span>
                                <span className="text-[8px] font-bold mt-0.5 uppercase leading-none">{lang.code}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <p className="text-gray-500">{totalElements} quán ăn trong hệ thống</p>
                    <Link
                        to="/stalls/new"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                    >
                        <FiPlus size={18} /> Thêm quán
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
                <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="w-full lg:flex-2 relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm quán ăn..."
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>
                    <div className="w-full lg:flex-2 flex gap-2">
                        <input
                            type="number"
                            placeholder="Giá từ"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Giá đến"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                        />
                    </div>
                    <div className="w-full lg:flex-1">
                        <input
                            type="number"
                            placeholder="Rating từ"
                            step="0.1"
                            max="5"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
                            value={minRating}
                            onChange={(e) => setMinRating(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full lg:w-[42px] h-[42px] flex items-center justify-center bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium shrink-0"
                        title="Lọc"
                    >
                        <FiFilter size={18} />
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : stalls.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FiMapPin className="text-indigo-500" size={28} />
                        </div>
                        <p className="text-gray-500 mb-4">Không tìm thấy quán ăn nào phù hợp</p>
                        {(keyword || minPrice || maxPrice || minRating) && (
                            <button
                                onClick={() => {
                                    setKeyword(''); setMinPrice(''); setMaxPrice(''); setMinRating('');
                                    setPage(0);
                                }}
                                className="text-indigo-600 font-medium hover:underline"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="overflow-x-auto">
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
                                                            className="w-12 h-12 rounded-lg object-cover shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                                                            <FiMapPin className="text-indigo-400" size={18} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{stall.name}</p>
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">ID: {stall.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {stall.latitude != null ? (
                                                    <div className="text-[11px] text-gray-500 font-mono space-y-0.5">
                                                        <p>Lat: {stall.latitude?.toFixed(5)}</p>
                                                        <p>Lng: {stall.longitude?.toFixed(5)}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 text-sm">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${stall.audioUrl
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-400'
                                                            }`}
                                                    >
                                                        <FiMic size={10} />
                                                        {LANGUAGES.find(l => l.code === selectedLanguage)?.flag} Audio
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${stall.imageUrl
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-gray-100 text-gray-400'
                                                            }`}
                                                    >
                                                        <FiImage size={10} />
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
                                                            href={stall.audioUrl.startsWith('http') ? stall.audioUrl : `${API_BASE_URL}${stall.audioUrl}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Nghe Audio"
                                                        >
                                                            <FiEye size={18} />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => openAudioModal(stall)}
                                                        disabled={generatingAudio[stall.id]}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Tạo / Cập nhật Audio"
                                                    >
                                                        <FiRefreshCw size={18} className={generatingAudio[stall.id] ? 'animate-spin' : ''} />
                                                    </button>
                                                    <Link
                                                        to={`/stalls/${stall.id}/edit`}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    >
                                                        <FiEdit size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(stall.id, stall.name)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <FiTrash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {renderPagination()}
                    </div>
                )}
            </div>

            {/* Audio Language Modal */}
            {audioModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                    onClick={closeAudioModal}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 relative"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <FiGlobe className="text-indigo-600" size={16} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-sm">Tạo / Cập nhật Audio</h3>
                                    <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{audioModal.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeAudioModal}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                                <FiX size={16} />
                            </button>
                        </div>

                        {/* Language selector */}
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Chọn ngôn ngữ</p>
                        <div className="grid grid-cols-1 gap-2 mb-5">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => setSelectedLanguage(lang.code)}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                                        selectedLanguage === lang.code
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className="text-lg">{lang.flag}</span>
                                    <span>{lang.label}</span>
                                    {selectedLanguage === lang.code && (
                                        <span className="ml-auto text-[10px] font-bold text-indigo-500 uppercase">Chọn</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={closeAudioModal}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleGenerateAudio}
                                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <FiRefreshCw size={14} />
                                Tạo Audio
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FoodStalls;
