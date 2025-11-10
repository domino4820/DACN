import LoginImage from '@/assets/lottie/login.json';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import apiEndpoints from '@/config/api-endpoints';
import paths from '@/config/paths';
import { useAuthStore } from '@/store/auth.store';
import api from '@/utils/api';
import { getErrorMessage } from '@/utils/error-handler';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router';

interface LoginResponse {
    success: boolean;
    requiresVerification?: boolean;
    username?: string;
    data?: {
        token: string;
        user: {
            username: string;
            email: string;
            created_at: string | Date;
            profile: {
                name: string | null;
                avatar_url: string | null;
                bio: string | null;
                visibility: 'PUBLIC' | 'GROUP_ONLY';
                facebook: string | null;
                github: string | null;
            } | null;
            stats: {
                level: number;
                xp: number;
            } | null;
        };
    };
    error?: string;
}

const Login: FC = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const setFullUser = useAuthStore((state) => state.setFullUser);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setIsLoading(true);

        try {
            const response = await api.post<LoginResponse>(apiEndpoints.public.login, {
                username: formData.username,
                password: formData.password
            });

            if (response.data.success && response.data.data) {
                const { token, user } = response.data.data;

                setAuth(token);

                setFullUser(user);

                toast.success('Đăng nhập thành công');
                navigate(paths.root);
            } else if (response.data.requiresVerification && response.data.username) {
                toast.error('Tài khoản của bạn chưa được xác thực');
                navigate(`${paths.verify}?username=${response.data.username}`);
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response?.status === 201 && error.response?.data?.requiresVerification) {
                    toast.error('Tài khoản của bạn chưa được xác thực');
                    navigate(`${paths.verify}?username=${error.response.data.username}`);
                    return;
                }

                const errorMessage = getErrorMessage(error, 'Đăng nhập thất bại');
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: 'username' | 'password', value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800'>
            <title>LOGIN</title>
            <div className='animate-in slide-in-from-right z-10 flex w-1/2 items-center justify-center p-4 duration-1000'>
                <div className='relative aspect-square w-full overflow-hidden rounded-lg'>
                    <Lottie animationData={LoginImage} loop={true} className='h-full w-full' />
                </div>
            </div>

            <div className='animate-in slide-in-from-left flex w-1/2 flex-col justify-center p-4 duration-1000'>
                <div className='mb-4'>
                    <p className='mb-2 text-3xl font-bold text-stone-900 dark:text-stone-100'>Đăng nhập</p>
                    <p className='text-stone-600 dark:text-stone-400'>Chào mừng trở lại! Nhập thông tin để tiếp tục</p>
                </div>

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                        <label htmlFor='username' className='mb-2 block text-sm font-medium text-stone-900 dark:text-stone-100'>
                            Tên đăng nhập
                        </label>
                        <div className='relative'>
                            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                                <FontAwesomeIcon icon={faEnvelope} className='text-stone-400' />
                            </div>
                            <Input type='text' id='username' autoFocus value={formData.username} onChange={(e) => handleChange('username', e.target.value)} className='pl-10' placeholder='Nhập tên đăng nhập' disabled={isLoading} />
                        </div>
                    </div>

                    <div>
                        <label htmlFor='password' className='mb-2 block text-sm font-medium text-stone-900 dark:text-stone-100'>
                            Mật khẩu
                        </label>
                        <div className='relative'>
                            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                                <FontAwesomeIcon icon={faLock} className='text-stone-400' />
                            </div>
                            <Input type='password' id='password' value={formData.password} onChange={(e) => handleChange('password', e.target.value)} className='pl-10' placeholder='Nhập mật khẩu' disabled={isLoading} />
                        </div>
                    </div>

                    <Button type='submit' disabled={isLoading} className='w-full'>
                        {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </Button>
                </form>

                <div className='mt-4'>
                    <div className='relative'>
                        <div className='absolute inset-0 flex items-center'>
                            <div className='w-full border-t border-stone-300 dark:border-stone-600'></div>
                        </div>
                        <div className='relative flex justify-center text-sm'>
                            <span className='bg-white px-2 text-stone-500 dark:bg-stone-800 dark:text-stone-400'>Hoặc</span>
                        </div>
                    </div>
                </div>

                <div className='mt-4 text-center'>
                    <p className='text-sm text-stone-600 dark:text-stone-400'>
                        Chưa có tài khoản?{' '}
                        <Link to={paths.register} className='font-medium text-stone-900 hover:underline dark:text-stone-100'>
                            Đăng ký tại đây
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
