import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FiArrowRight,
    FiBriefcase,
    FiLogIn,
    FiShield,
    FiUserPlus,
} from 'react-icons/fi';
import { authService } from '../services/api';
import { setTokens } from '../services/authStorage';

const roles = [
    { key: 'ADMIN', label: 'Admin', subtitle: 'Quản trị hệ thống', icon: FiShield },
    { key: 'RESTAURANT_OWNER', label: 'Chủ quán', subtitle: 'Quản lý quầy của bạn', icon: FiBriefcase },
    { key: 'REGISTER_OWNER', label: 'Đăng ký', subtitle: 'Trở thành chủ quán', icon: FiUserPlus },
];

const Login = () => {
    const [portal, setPortal] = useState('ADMIN');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [ownerForm, setOwnerForm] = useState({ username: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const fromPath = location.state?.from?.pathname || '/';

    const onSubmitLogin = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await authService.login({ username, password });
            const { accessToken, refreshToken, user } = res.data;
            const role = user?.roles?.[0] || 'ADMIN';

            setTokens({ accessToken, refreshToken, role });
            toast.success('Đăng nhập thành công');

            if (role === 'RESTAURANT_OWNER') {
                navigate('/stall-owner', { replace: true });
                return;
            }

            navigate(fromPath || '/', { replace: true });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
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

            toast.success('Đăng ký chủ quán thành công');
            navigate('/stall-owner', { replace: true });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    const onGoogleLogin = () => {
        window.location.href = authService.getGoogleOAuthUrl();
    };

    const selectedRole = roles.find((item) => item.key === portal);

    return (
        <div className="auth-page min-h-screen px-4 py-8 sm:px-6 lg:px-10">
            <div className="auth-card mx-auto w-full max-w-6xl overflow-hidden rounded-[26px]">
                <div className="grid min-h-[680px] lg:grid-cols-[0.36fr_0.64fr]">
                    <aside className="auth-side relative p-6 sm:p-8 lg:p-10">
                        <div className="auth-side-ribbon" />

                        <div className="relative z-10 flex h-full flex-col">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100/90">Street Voice</p>
                                <h1 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">Portal Login</h1>
                                <p className="mt-2 text-sm text-indigo-100/90">Chào mừng ông chủ quay trở lại</p>
                            </div>

                            <div className="mt-8 space-y-3">
                                {roles.map(({ key, label, subtitle, icon: Icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setPortal(key)}
                                        className={`role-item ${portal === key ? 'active' : ''}`}
                                    >
                                        <span className="role-icon">
                                            <Icon size={16} />
                                        </span>
                                        <span>
                                            <strong>{label}</strong>
                                            <small>{subtitle}</small>
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <p className="mt-auto pt-8 text-xs text-indigo-100/80">Hệ thống quản trị Phố ẩm thực Vĩnh Khánh</p>
                        </div>
                    </aside>

                    <section className="auth-main flex flex-col bg-white p-6 sm:p-10 lg:p-12">
                        <div className="mb-8 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{selectedRole?.subtitle}</p>
                                <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                                    {portal === 'REGISTER_OWNER' ? 'Đăng ký Chủ quán' : 'Đăng nhập'}
                                </h2>
                            </div>
                            <div className="hidden rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 sm:block">
                                Secure Access
                            </div>
                        </div>

                        <div className="auth-form-wrap flex-1">
                            {portal !== 'REGISTER_OWNER' ? (
                                <form key={portal} className="form-fade space-y-5" onSubmit={onSubmitLogin}>
                                    <div>
                                        <label className="auth-label">Email hoặc Username</label>
                                        <input
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="auth-input"
                                            placeholder="Nhập email hoặc username"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="auth-label">Mật khẩu</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="auth-input"
                                            placeholder="Nhập mật khẩu"
                                            required
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs text-slate-400">Quên mật khẩu? liên hệ admin hệ thống.</span>
                                        <button type="submit" disabled={loading} className="auth-btn-primary">
                                            <FiLogIn />
                                            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                                            <FiArrowRight size={16} />
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form key="register" className="form-fade space-y-5" onSubmit={onRegisterOwner}>
                                    <div>
                                        <label className="auth-label">Tên đăng nhập</label>
                                        <input
                                            value={ownerForm.username}
                                            onChange={(e) => setOwnerForm((prev) => ({ ...prev, username: e.target.value }))}
                                            className="auth-input"
                                            placeholder="Ví dụ: banhxeo.vkhanh"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="auth-label">Email</label>
                                        <input
                                            type="email"
                                            value={ownerForm.email}
                                            onChange={(e) => setOwnerForm((prev) => ({ ...prev, email: e.target.value }))}
                                            className="auth-input"
                                            placeholder="yourname@email.com"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="auth-label">Mật khẩu</label>
                                        <input
                                            type="password"
                                            value={ownerForm.password}
                                            onChange={(e) => setOwnerForm((prev) => ({ ...prev, password: e.target.value }))}
                                            className="auth-input"
                                            placeholder="Tối thiểu 8 ký tự"
                                            required
                                        />
                                    </div>

                                    <div className="flex justify-end pt-1">
                                        <button type="submit" disabled={loading} className="auth-btn-primary">
                                            <FiUserPlus />
                                            {loading ? 'Đang xử lý...' : 'Đăng ký chủ quán'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* <div className="auth-bottom mt-8 border-t border-slate-100 pt-5">
                            <p className="text-sm font-medium text-slate-500">Hoặc đăng nhập nhanh</p>
                            <button type="button" onClick={onGoogleLogin} className="auth-btn-google mt-3">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm">G</span>
                                Tiếp tục với Google
                            </button>
                        </div> */}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Login;
