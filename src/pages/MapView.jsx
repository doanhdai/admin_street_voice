import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { stallService } from '../services/api';
import { toast } from 'react-toastify';
import { FiMapPin, FiList, FiRefreshCw, FiSearch, FiX, FiEdit, FiMic, FiImage, FiNavigation } from 'react-icons/fi';
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

const MapView = () => {
    const [stalls, setStalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStall, setSelectedStall] = useState(null);
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
    }, []);

    const fetchStalls = async () => {
        try {
            setLoading(true);
            const res = await stallService.getAll();
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

            // Popup content
            const popup = L.popup({ maxWidth: 280, className: 'stall-popup' }).setContent(`
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 4px;">
                    ${hasImage ? `<img src="${stall.imageUrl}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; margin-bottom:10px;" onerror="this.style.display='none'" />` : ''}
                    <h3 style="margin:0 0 4px; font-size:15px; font-weight:700; color:#111827;">${stall.name}</h3>
                    <p style="margin:0 0 8px; font-size:12px; color:#6b7280;">${stall.description || 'Chưa có mô tả'}</p>
                    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
                        <span style="padding:2px 8px; border-radius:99px; font-size:11px; font-weight:600; background:${hasAudio ? '#dcfce7' : '#f1f5f9'}; color:${hasAudio ? '#166534' : '#94a3b8'};">
                            🎵 Audio ${hasAudio ? 'Có' : 'Chưa có'}
                        </span>
                        <span style="padding:2px 8px; border-radius:99px; font-size:11px; font-weight:600; background:${hasImage ? '#dbeafe' : '#f1f5f9'}; color:${hasImage ? '#1e40af' : '#94a3b8'};">
                            🖼 Ảnh ${hasImage ? 'Có' : 'Chưa có'}
                        </span>
                    </div>
                    <div style="font-size:11px; color:#9ca3af; font-family:monospace;">
                        ${stall.latitude?.toFixed(6)}, ${stall.longitude?.toFixed(6)}
                    </div>
                </div>
            `);

            marker.bindPopup(popup);
            marker.on('click', () => setSelectedStall(stall));
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
        mapInstanceRef.current?.flyTo([stall.latitude, stall.longitude], 17, { duration: 1 });
        markersRef.current[stall.id]?.openPopup();
        setSelectedStall(stall);
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
                </div>
            </div>
        </div>
    );
};

export default MapView;
