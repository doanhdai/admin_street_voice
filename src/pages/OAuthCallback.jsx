import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setTokens } from '../services/authStorage';

const OAuthCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');

        if (!accessToken || !refreshToken) {
            toast.error('OAuth callback khong hop le');
            navigate('/login', { replace: true });
            return;
        }

        setTokens({ accessToken, refreshToken });
        toast.success('Dang nhap Google thanh cong');
        navigate('/', { replace: true });
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
            Dang xu ly dang nhap...
        </div>
    );
};

export default OAuthCallback;
