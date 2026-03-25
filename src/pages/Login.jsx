import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiLock, FiLogIn } from 'react-icons/fi';
import { authService } from '../services/api';
import { setTokens } from '../services/authStorage';

const Login = () => {
    const [mode, setMode] = useState('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [ownerForm, setOwnerForm] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const fromPath = location.state?.from?.pathname || '/';

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await authService.login({ username, password });
            const { accessToken, refreshToken, user } = res.data;

            setTokens({
                accessToken,
                refreshToken,
                role: user?.roles?.[0] || 'ADMIN', // Store role from JWT response
            });

            toast.success('Đăng nhập thành công');

            // Route based on role
            const role = user?.roles?.[0] || 'ADMIN';
            if (role === 'RESTAURANT_OWNER') {
                navigate('/stall-owner', { replace: true });
            } else {
                navigate(fromPath || '/', { replace: true });
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    const onGoogleLogin = () => {
        window.location.href = authService.getGoogleOAuthUrl();
    };

    const onRegisterOwner = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await authService.registerOwner(ownerForm);
            const { accessToken, refreshToken, user } = res.data;

            setTokens({
                accessToken,
                refreshToken,
                role: user?.roles?.[0] || 'RESTAURANT_OWNER',
            });

            toast.success('Đăng ký owner thành công');
            navigate('/stall-owner', { replace: true });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Đăng ký owner thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-cyan-100 flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-600 text-white flex items-center justify-center mb-4">
                        <FiLock size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
                    <p className="text-slate-500 text-sm mt-1">Street Voice Management</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-100 rounded-xl">
                    <button
                        onClick={() => setMode('login')}
                        className={`py-2 rounded-lg text-sm font-semibold transition ${
                            mode === 'login' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600'
                        }`}
                        type="button"
                    >
                        Đăng nhập
                    </button>
                    <button
                        onClick={() => setMode('register-owner')}
                        className={`py-2 rounded-lg text-sm font-semibold transition ${
                            mode === 'register-owner' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600'
                        }`}
                        type="button"
                    >
                        Đăng ký Owner
                    </button>
                </div>

                {mode === 'login' ? (
                    <>
                        <form className="space-y-4" onSubmit={onSubmit}>
                            <input
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Username hoac Email"
                                required
                            />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Password"
                                required
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
                            >
                                <FiLogIn />
                                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            </button>
                        </form>

                        <div className="my-5 text-center text-sm text-slate-400">hoặc</div>

                        <button
                            onClick={onGoogleLogin}
                            className="w-full border border-slate-200 rounded-xl py-3 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Đăng nhập với Google
                        </button>
                    </>
                ) : (
                    <form className="space-y-4" onSubmit={onRegisterOwner}>
                        <input
                            value={ownerForm.username}
                            onChange={(e) => setOwnerForm((prev) => ({ ...prev, username: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Username"
                            required
                        />
                        <input
                            type="email"
                            value={ownerForm.email}
                            onChange={(e) => setOwnerForm((prev) => ({ ...prev, email: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Email"
                            required
                        />
                        <input
                            type="password"
                            value={ownerForm.password}
                            onChange={(e) => setOwnerForm((prev) => ({ ...prev, password: e.target.value }))}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Password"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white rounded-xl py-3 font-semibold"
                        >
                            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký Owner'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
