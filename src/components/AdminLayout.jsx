import { NavLink, useNavigate } from 'react-router-dom';
import {
    FiHome,
    FiMapPin,
    FiMap,
    FiBarChart2,
    FiRefreshCw,
    FiMic,
    FiSettings,
    FiLogOut,
    FiCheckSquare,
    FiUsers,
} from 'react-icons/fi';
import { authService } from '../services/api';
import { clearTokens } from '../services/authStorage';

const navItems = [
    { to: '/', icon: FiHome, label: 'Dashboard' },
    { to: '/approvals', icon: FiCheckSquare, label: 'Phê duyệt' },
    // { to: '/accounts', icon: FiUsers, label: 'Tài khoản' },
    { to: '/stalls', icon: FiMapPin, label: 'Quán Ăn' },
    { to: '/map', icon: FiMap, label: 'Bản Đồ' },
    { to: '/analytics', icon: FiBarChart2, label: 'Analytics' },
    { to: '/sync', icon: FiRefreshCw, label: 'Đồng bộ dữ liệu' },
    { to: '/audio', icon: FiMic, label: 'Voice' },
    { to: '/system', icon: FiSettings, label: 'Hệ Thống' },
];

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();

    const onLogout = async () => {
        try {
            await authService.logout();
        } catch {
            // Ignore API logout failure and clear local session anyway.
        } finally {
            clearTokens();
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-sm border-r border-gray-100 flex flex-col fixed top-0 left-0 h-full z-10">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                            <FiMic className="text-white" size={18} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">Street Voice</p>
                            <p className="text-xs text-gray-400">Admin Panel</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`
                            }
                        >
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={onLogout}
                        className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100"
                    >
                        <FiLogOut size={16} /> Đăng Xuất
                    </button>
                    <p className="text-xs text-gray-400 text-center">Backend: localhost:8080</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
