import Button from '@/components/admin/ui/button.tsx';
import Input from '@/components/admin/ui/input.tsx';
import apiEndpoints from '@/config/api-endpoints';
import paths from '@/config/paths';
import { useAdminStore } from '@/store/admin.store';
import api from '@/utils/api';
import { isAxiosError } from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router';

interface AdminLoginResponse {
    success: boolean;
    data?: {
        token: string;
    };
    error?: string;
}

const AdminLogin = () => {
    const navigate = useNavigate();
    const login = useAdminStore((state) => state.login);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post<AdminLoginResponse>(apiEndpoints.public.adminLogin, {
                username,
                password
            });

            if (response.data.success && response.data.data) {
                const { token } = response.data.data;
                login(token);
                navigate(paths.admin.root);
            } else {
                setError(response.data.error || 'Tài khoản hoặc mật khẩu không chính xác');
            }
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || 'Đăng nhập thất bại');
            } else {
                setError('Đăng nhập thất bại');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='flex min-h-screen items-center justify-center'>
            <div className='w-full max-w-md p-4'>
                {error && (
                    <div className='mb-4 rounded-md bg-red-50 p-4'>
                        <div className='text-sm text-red-700'>{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className='w-full space-y-2'>
                    <Input autoFocus id='username' name='username' type='text' autoComplete='username' required placeholder='Nhập TK' value={username} onChange={(e) => setUsername(e.target.value)} />
                    <Input id='password' name='password' type='password' autoComplete='current-password' required placeholder='Nhập MK' value={password} onChange={(e) => setPassword(e.target.value)} />

                    <Button type='submit' className='w-full' disabled={isLoading}>
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
