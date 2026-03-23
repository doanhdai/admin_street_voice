import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { stallService } from '../services/api';
import { toast } from 'react-toastify';
import { FiMapPin, FiList, FiRefreshCw, FiSearch, FiX, FiEdit, FiMic, FiImage, FiNavigation, FiGlobe, FiVolume2, FiVolumeX, FiPlay, FiPause } from 'react-icons/fi';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon bị mất khi build với Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const VIETNAM_CENTER = [16.047079, 108.20623]; // Đà Nẵng trung tâm mặc định
const DEFAULT_ZOOM = 13;
const API_BASE_URL = 'http://localhost:8080';

const LANGUAGES = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English',    flag: '🇺🇸' },
    { code: 'ja', label: '日本語',      flag: '🇯🇵' },
    { code: 'ko', label: '한국어',      flag: '🇰🇷' },
    { code: 'zh', label: '中文',        flag: '🇨🇳' },
];

const MapView = () => {
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStall, setSelectedStall] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState('vi');
    const [fetchingDetail, setFetchingDetail] = useState(false);
    
    // Spotify-style Player State
    const [activeAudio, setActiveAudio] = useState({
        url: null,
        name: '',
        imageUrl: null,
        lang: 'vi',
        isPlaying: false,
        duration: 0,
        currentTime: 0,
        stallId: null,
        isBuffering: false
    });
    
    const audioRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ total: 0, withCoords: 0, withAudio: 0 });

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});
    const containerRef = useRef(null);

    // Khởi tạo bản đồ
    useEffect(() => {
        if (!containerRef.current || mapInstanceRef.current) return;

        const map = L.map(containerRef.current, {
            center: VIETNAM_CENTER,
            zoom: DEFAULT_ZOOM,
            zoomControl: false,
        });

        // Tile layer OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        // Custom zoom control ở góc phải dưới
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstanceRef.current = map;
        mapRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Fetch dữ liệu
    useEffect(() => {
        fetchStalls();
    }, [selectedLanguage]);

    const fetchStalls = async () => {
        try {
            setLoading(true);
            const res = await stallService.getAll({ lang: selectedLanguage });
            const data = res.data || [];
            setStalls(data);
            setStats({
                total: data.length,
                withCoords: data.filter(s => s.latitude != null && s.longitude != null).length,
                withAudio: data.filter(s => s.audioUrl).length,
            });
        } catch {
            toast.error('Không thể tải danh sách quán');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to render localized popup content
    const renderPopupContent = (stall) => {
        const hasAudio = !!stall.audioUrl;
        const hasImage = !!stall.imageUrl;
        return `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 4px; min-width: 240px;">
                ${hasImage ? `<img src="${stall.imageUrl}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; margin-bottom:10px;" onerror="this.style.display='none'" />` : ''}
                <h3 style="margin:0 0 4px; font-size:15px; font-weight:700; color:#111827;">${stall.name}</h3>
                <p style="margin:0 0 8px; font-size:12px; color:#6b7280; line-height:1.5;">${stall.description || 'Chưa có mô tả'}</p>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
                    <span style="padding:2px 8px; border-radius:99px; font-size:11px; font-weight:600; background:${hasAudio ? '#dcfce7' : '#f1f5f9'}; color:${hasAudio ? '#166534' : '#94a3b8'};">
                        🎵 Audio ${hasAudio ? 'Có' : 'Chưa có'}
                    </span>
                    <span style="padding:2px 8px; border-radius:99px; font-size:11px; font-weight:600; background:${hasImage ? '#dbeafe' : '#f1f5f9'}; color:${hasImage ? '#1e40af' : '#94a3b8'};">
                        🖼 Ảnh ${hasImage ? 'Có' : 'Chưa có'}
                    </span>
                    <span style="padding:2px 8px; border-radius:99px; font-size:11px; font-weight:600; background:#f5f3ff; color:#7c3aed;">
                        🌍 ${LANGUAGES.find(l => l.code === selectedLanguage)?.flag} ${selectedLanguage.toUpperCase()}
                    </span>
                </div>
                <div style="font-size:11px; color:#9ca3af; font-family:monospace;">
                    ${stall.latitude?.toFixed(6)}, ${stall.longitude?.toFixed(6)}
                </div>
            </div>
        `;
    };

    // Spotify-style Audio Control Logic
    const togglePlay = () => {
        if (!audioRef.current || !activeAudio.url) return;
        
        if (activeAudio.isPlaying) {
            audioRef.current.pause();
            setActiveAudio(prev => ({ ...prev, isPlaying: false }));
        } else {
            audioRef.current.play().then(() => {
                setActiveAudio(prev => ({ ...prev, isPlaying: true }));
            }).catch(e => console.log('Play failed'));
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setActiveAudio(prev => ({
                ...prev,
                currentTime: audioRef.current.currentTime,
                duration: audioRef.current.duration || 0
            }));
        }
    };

    const handleProgressChange = (e) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setActiveAudio(prev => ({ ...prev, currentTime: time }));
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Marker click logic updated to set active audio
    const handleStallClick = async (stall, marker) => {
        setSelectedStall(stall);
        try {
            setFetchingDetail(true);
            const res = await stallService.getById(stall.id, { lang: selectedLanguage });
            const detail = res.data?.data || res.data;
            
            // Update popup content with localized data
            if (marker && marker.getPopup()) {
                marker.getPopup().setContent(renderPopupContent(detail));
                marker.openPopup();
            }

            // Sync with Player Bar
            if (detail.audioUrl) {
                // Ensure absolute URL
                const absoluteAudioUrl = detail.audioUrl.startsWith('http') 
                    ? detail.audioUrl 
                    : `${API_BASE_URL}${detail.audioUrl}`;

                setActiveAudio({
                    url: absoluteAudioUrl,
                    name: detail.name,
                    imageUrl: detail.imageUrl,
                    lang: selectedLanguage,
                    isPlaying: true,
                    duration: 0,
                    currentTime: 0,
                    stallId: stall.id,
                    isBuffering: true
                });
                
                if (audioRef.current) {
                    audioRef.current.src = absoluteAudioUrl;
                    audioRef.current.load();
                    audioRef.current.play().catch(e => {
                        console.log('Auto-play blocked');
                        setActiveAudio(prev => ({ ...prev, isPlaying: false, isBuffering: false }));
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching localization:', err);
        } finally {
            setFetchingDetail(false);
        }
    };

    // Auto-update popup if language changes while a stall is selected
    useEffect(() => {
        if (selectedStall) {
            const marker = markersRef.current[selectedStall.id];
            handleStallClick(selectedStall, marker);
        } else if (activeAudio.stallId && activeAudio.isPlaying) {
            // Reload the audio if something is playing but popup is closed
            const fetchAudioDetail = async () => {
                try {
                    const res = await stallService.getById(activeAudio.stallId, { lang: selectedLanguage });
                    const detail = res.data?.data || res.data;
                    
                    if (detail.audioUrl) {
                        const absoluteAudioUrl = detail.audioUrl.startsWith('http') 
                            ? detail.audioUrl 
                            : `${API_BASE_URL}${detail.audioUrl}`;
        
                        setActiveAudio(prev => ({
                            ...prev,
                            url: absoluteAudioUrl,
                            name: detail.name,
                            lang: selectedLanguage,
                            isPlaying: true,
                            duration: 0,
                            currentTime: 0,
                            isBuffering: true
                        }));
                        
                        if (audioRef.current) {
                            audioRef.current.src = absoluteAudioUrl;
                            audioRef.current.load();
                            audioRef.current.play().catch(e => {
                                console.log('Auto-play blocked');
                                setActiveAudio(prev => ({ ...prev, isPlaying: false, isBuffering: false }));
                            });
                        }
                    }
                } catch (err) {
                    console.error('Error fetching localization for active audio:', err);
                }
            };
            fetchAudioDetail();
        }
    }, [selectedLanguage]);

    // Vẽ markers lên bản đồ khi data thay đổi
    useEffect(() => {
        if (!mapInstanceRef.current || loading) return;

        // Xoá markers cũ
        Object.values(markersRef.current).forEach(m => m.remove());
        markersRef.current = {};

        const validStalls = stalls.filter(s => s.latitude != null && s.longitude != null);

        if (validStalls.length === 0) return;

        const bounds = [];

        validStalls.forEach(stall => {
            const hasAudio = !!stall.audioUrl;
            const hasImage = !!stall.imageUrl;

            // Custom icon màu khác nhau tuỳ theo có audio hay không
            const iconHtml = `
                <div style="
                    width: 36px; height: 36px;
                    background: ${hasAudio ? '#4f46e5' : '#64748b'};
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex; align-items: center; justify-content: center;
                ">
                    <svg style="transform: rotate(45deg); width: 16px; height: 16px;" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                </div>
            `;

            const icon = L.divIcon({
                html: iconHtml,
                className: '',
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -38],
            });

            const marker = L.marker([stall.latitude, stall.longitude], { icon }).addTo(mapInstanceRef.current);

            // Initial popup content (empty or loading-friendly)
            const popup = L.popup({ maxWidth: 280, className: 'stall-popup' }).setContent(renderPopupContent(stall));

            marker.bindPopup(popup);
            marker.on('click', () => handleStallClick(stall, marker));
            marker.on('popupclose', () => setSelectedStall(null));

            markersRef.current[stall.id] = marker;
            bounds.push([stall.latitude, stall.longitude]);
        });

        // Fit bản đồ vào các marker
        if (bounds.length > 0) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
        }
    }, [stalls, loading]);

    // Tìm kiếm filter
    const filteredStalls = stalls.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Click vào stall trong danh sách → bay đến marker
    const flyToStall = (stall) => {
        if (!stall.latitude || !stall.longitude) {
            toast.warn('Quán này chưa có toạ độ');
            return;
        }
        const marker = markersRef.current[stall.id];
        mapInstanceRef.current?.flyTo([stall.latitude, stall.longitude], 17, { duration: 1 });
        handleStallClick(stall, marker);
    };

    return (
        <div className="flex flex-col h-screen -m-8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FiMapPin className="text-indigo-600" size={20} />
                        Bản Đồ Quán Ăn
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        {stats.withCoords}/{stats.total} quán có toạ độ · {stats.withAudio} có audio
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Language Selector in Header */}
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-sm mr-2">
                        {LANGUAGES.map(lang => (
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

                    <button
                        onClick={fetchStalls}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Làm mới
                    </button>
                    <Link
                        to="/stalls"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        <FiList size={14} /> Danh sách
                    </Link>
                </div>
            </div>

            {/* Body: Map + Sidebar */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar danh sách quán */}
                <div className="w-72 bg-white border-r border-gray-100 flex flex-col shrink-0">
                    {/* Tìm kiếm */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                            <input
                                type="text"
                                placeholder="Tìm quán..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats mini */}
                    <div className="grid grid-cols-3 gap-0 border-b border-gray-100">
                        {[
                            { label: 'Tổng', value: stats.total, color: 'text-gray-700' },
                            { label: 'Có tọa độ', value: stats.withCoords, color: 'text-indigo-600' },
                            { label: 'Có audio', value: stats.withAudio, color: 'text-green-600' },
                        ].map(s => (
                            <div key={s.label} className="p-3 text-center border-r last:border-r-0 border-gray-100">
                                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-gray-400">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Danh sách */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 space-y-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredStalls.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                Không tìm thấy quán nào
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {filteredStalls.map(stall => {
                                    const hasCoords = stall.latitude != null && stall.longitude != null;
                                    const isSelected = selectedStall?.id === stall.id;
                                    return (
                                        <button
                                            key={stall.id}
                                            onClick={() => flyToStall(stall)}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 ${isSelected
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'hover:bg-gray-50 text-gray-700'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-500' : 'bg-indigo-50'
                                                }`}>
                                                {stall.imageUrl ? (
                                                    <img src={stall.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                                ) : (
                                                    <FiMapPin className={isSelected ? 'text-white' : 'text-indigo-400'} size={14} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{stall.name}</p>
                                                <p className={`text-xs truncate ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                    {hasCoords
                                                        ? `${stall.latitude?.toFixed(4)}, ${stall.longitude?.toFixed(4)}`
                                                        : 'Chưa có toạ độ'}
                                                </p>
                                            </div>
                                            {hasCoords && (
                                                <FiNavigation size={13} className={isSelected ? 'text-indigo-200' : 'text-gray-300'} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="p-3 border-t border-gray-100 space-y-1.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chú thích</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="w-3 h-3 rounded-full bg-indigo-600 shrink-0"></span>
                            Có audio
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="w-3 h-3 rounded-full bg-slate-500 shrink-0"></span>
                            Chưa có audio
                        </div>
                    </div>
                </div>

                {/* Map container */}
                <div className="flex-1 relative">
                    <div ref={containerRef} className="w-full h-full" />

                    {/* Overlay: không có quán nào có tọa độ */}
                    {!loading && stats.withCoords === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <FiMapPin className="text-gray-400" size={28} />
                                </div>
                                <p className="text-gray-700 font-semibold">Chưa có quán nào trên bản đồ</p>
                                <p className="text-gray-400 text-sm mt-1">Thêm toạ độ cho quán để hiển thị trên bản đồ</p>
                                <Link
                                    to="/stalls"
                                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
                                >
                                    <FiEdit size={14} /> Quản lý quán
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Loading overlay */}
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-lg">
                                <FiRefreshCw className="text-indigo-600 animate-spin" size={20} />
                                <span className="font-medium text-gray-700">Đang tải dữ liệu...</span>
                            </div>
                        </div>
                    )}

                    {/* Spotify-style Player Bar */}
                    {activeAudio.url && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 ring-1 ring-black/5 p-4 flex items-center gap-6">
                        {/* Stall Info */}
                        <div className="flex items-center gap-4 w-1/4 min-w-0">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shrink-0">
                                {activeAudio.imageUrl ? (
                                    <img src={activeAudio.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-400">
                                        <FiImage size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 truncate uppercase tracking-tight">
                                    {activeAudio.name}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-lg">{LANGUAGES.find(l => l.code === activeAudio.lang)?.flag}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{activeAudio.lang}</span>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full mx-1"></div>
                                    <span className={`text-[10px] font-bold uppercase ${activeAudio.isPlaying ? 'text-green-500' : 'text-gray-400'}`}>
                                        {activeAudio.isPlaying ? 'Đang phát' : 'Đang tạm dừng'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Middle Controls: Play/Pause & Progress */}
                        <div className="flex-1 flex flex-col items-center gap-2">
                            <div className="flex items-center gap-6">
                                <button 
                                    onClick={togglePlay}
                                    className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-200"
                                    disabled={activeAudio.isBuffering}
                                >
                                    {activeAudio.isBuffering ? (
                                        <FiRefreshCw className="animate-spin" size={24} />
                                    ) : activeAudio.isPlaying ? (
                                        <FiPause size={24} />
                                    ) : (
                                        <FiPlay className="ml-1" size={24} />
                                    )}
                                </button>
                            </div>
                            <div className="w-full flex items-center gap-3">
                                <span className="text-[11px] font-mono text-gray-400">{formatTime(activeAudio.currentTime)}</span>
                                <input 
                                    type="range"
                                    min="0"
                                    max={activeAudio.duration || 100}
                                    value={activeAudio.currentTime}
                                    onChange={handleProgressChange}
                                    className="flex-1 h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 transition-all [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:-mt-[0.75px] shadow-sm"
                                />
                                <span className="text-[11px] font-mono text-gray-400">{formatTime(activeAudio.duration)}</span>
                            </div>
                        </div>

                        {/* Right: Close/Actions */}
                        <div className="w-1/4 flex justify-end gap-3">
                            <button 
                                onClick={() => setActiveAudio(prev => ({ ...prev, url: null, isPlaying: false }))}
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                title="Đóng trình phát"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>

        {/* Audio Player (Hidden) */}
        <audio 
            ref={audioRef} 
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setActiveAudio(prev => ({ ...prev, isPlaying: false, isBuffering: false }))}
                onLoadedMetadata={handleTimeUpdate}
                onWaiting={() => setActiveAudio(prev => ({ ...prev, isBuffering: true }))}
                onCanPlay={() => setActiveAudio(prev => ({ ...prev, isBuffering: false }))}
                onError={() => {
                    toast.error("Không thể tải audio. Vui lòng thử lại.");
                    setActiveAudio(prev => ({ ...prev, isPlaying: false, isBuffering: false }));
                }}
            />
        </div>
    );
};

export default MapView;
