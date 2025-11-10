import LoginImage from '@/assets/lottie/otp.json';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import apiEndpoints from '@/config/api-endpoints';
import paths from '@/config/paths';
import { useAuthStore } from '@/store/auth.store';
import api from '@/utils/api';
import { getErrorMessage } from '@/utils/error-handler';
import { faKey, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router';

interface VerifyResponse {
    success: boolean;
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

const Verify: FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const setAuth = useAuthStore((state) => state.setAuth);
    const setFullUser = useAuthStore((state) => state.setFullUser);
    const [formData, setFormData] = useState({
        username: '',
        otp: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const usernameFromUrl = searchParams.get('username');
        if (usernameFromUrl) {
            setFormData((prev) => ({ ...prev, username: usernameFromUrl }));
        }
    }, [searchParams]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setIsLoading(true);

        try {
            const response = await api.post<VerifyResponse>(apiEndpoints.public.verify, {
                username: formData.username,
                otp: formData.otp
            });

            if (response.data.success && response.data.data) {
                const { token, user } = response.data.data;

                setAuth(token);
                setFullUser(user);

                toast.success('Xác thực tài khoản thành công');
                navigate(paths.root);
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = getErrorMessage(error, 'Xác thực thất bại');
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: 'username' | 'otp', value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800'>
            <title>VERIFY</title>
            <div className='animate-in slide-in-from-right flex w-1/2 flex-col justify-center p-4 duration-1000'>
                <div className='mb-4'>
                    <p className='mb-2 text-3xl font-bold text-stone-900 dark:text-stone-100'>Xác thực tài khoản</p>
                    <p className='text-stone-600 dark:text-stone-400'>Nhập mã OTP đã được gửi đến email của bạn</p>
                </div>

                <form onSubmit={handleSubmit} className='space-y-6'>
                    <div>
                        <label htmlFor='username' className='mb-2 block text-sm font-medium text-stone-900 dark:text-stone-100'>
                            Tên đăng nhập
                        </label>
                        <div className='relative'>
                            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                                <FontAwesomeIcon icon={faUser} className='text-stone-400' />
                            </div>
                            <Input type='text' id='username' autoFocus value={formData.username} onChange={(e) => handleChange('username', e.target.value)} className='pl-10' placeholder='Nhập tên đăng nhập' disabled={isLoading} />
                        </div>
                    </div>

                    <div>
                        <label htmlFor='otp' className='mb-2 block text-sm font-medium text-stone-900 dark:text-stone-100'>
                            Mã OTP
                        </label>
                        <div className='relative'>
                            <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                                <FontAwesomeIcon icon={faKey} className='text-stone-400' />
                            </div>
                            <Input type='text' id='otp' value={formData.otp} onChange={(e) => handleChange('otp', e.target.value)} className='pl-10' placeholder='Nhập mã OTP' disabled={isLoading} maxLength={4} />
                        </div>
                    </div>

                    <Button type='submit' disabled={isLoading} className='w-full'>
                        {isLoading ? 'Đang xác thực...' : 'Xác thực tài khoản'}
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
                        <Link to={paths.login} className='font-medium text-stone-900 hover:underline dark:text-stone-100'>
                            Quay lại trang đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
            <div className='animate-in slide-in-from-left flex w-1/2 items-center justify-center p-4 duration-1000'>
                <div className='relative aspect-square w-full overflow-hidden rounded-lg'>
                    <Lottie animationData={LoginImage} loop={true} className='h-full w-full' />
                </div>
            </div>
        </div>
    );
};

export default Verify;
