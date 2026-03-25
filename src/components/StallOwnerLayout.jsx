import { FiLogOut, FiHome } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { clearTokens } from '../services/authStorage';
import { toast } from 'react-toastify';

const StallOwnerLayout = ({ children }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        clearTokens();
        toast.success('Đã đăng xuất');
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <FiHome className="text-cyan-600" size={24} />
                        <h1 className="text-xl font-bold text-slate-900">Street Voice - Quán Của Tôi</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    >
                        <FiLogOut size={18} />
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </div>
        </div>
    );
};

export default StallOwnerLayout;
