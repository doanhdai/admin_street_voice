import { FiHome, FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { clearTokens } from '../services/authStorage';

const StallOwnerLayout = ({ children }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        clearTokens();
        toast.success('Đã đăng xuất');
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-indigo-50/40">
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                            <FiHome size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Street Voice</p>
                            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Quán Của Tôi</h1>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        <FiLogOut size={16} />
                        Đăng xuất
                    </button>
                </div>
            </header>

            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
        </div>
    );
};

export default StallOwnerLayout;
