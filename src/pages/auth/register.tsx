import LoginImage from '@/assets/lottie/login.json';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import apiEndpoints from '@/config/api-endpoints';
import paths from '@/config/paths';
import api from '@/utils/api';
import { getErrorMessage } from '@/utils/error-handler';
import { faEnvelope, faLock, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router';

interface RegisterResponse {
    success: boolean;
    error?: string;
}

const Register: FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setIsLoading(true);

        try {
            const response = await api.post<RegisterResponse>(apiEndpoints.public.register, {
                username: formData.username,
                email: formData.email,
                password: formData.password
            });

            if (response.data.success) {
                toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
                setRegistrationSuccess(true);

                navigate(`${paths.verify}?username=${formData.username}`);
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = getErrorMessage(error, 'Đăng ký thất bại');
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: 'username' | 'email' | 'password', value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800'>
            <title>REGISTER</title>
            <div className='animate-in slide-in-from-right flex w-1/2 flex-col justify-center p-4 duration-1000'>
                <div className='mb-4'>
                    <p className='mb-2 text-3xl font-bold text-stone-900 dark:text-stone-100'>{registrationSuccess ? 'Đăng ký thành công!' : 'Đăng ký'}</p>
                    <p className='text-stone-600 dark:text-stone-400'>{registrationSuccess ? 'Vui lòng kiểm tra email để xác thực tài khoản của bạn' : 'Tạo tài khoản mới để bắt đầu'}</p>
                </div>

                {registrationSuccess ? (
                    <div className='space-y-4'>
                        <div className='rounded-md bg-green-50 p-4 dark:bg-green-900/20'>
                            <div className='flex'>
                                <div className='shrink-0'>
                                    <svg className='h-5 w-5 text-green-400' viewBox='0 0 20 20' fill='currentColor'>
                                        <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                                    </svg>
                                </div>
                                <div className='ml-3'>
                                    <p className='text-sm font-medium text-green-800 dark:text-green-200'>Email xác thực đã được gửi</p>
                                    <div className='mt-2 text-sm text-green-700 dark:text-green-300'>
                                        <p>
                                            Chúng tôi đã gửi email xác thực đến <strong>{formData.email}</strong>. Vui lòng kiểm tra hộp thư và làm theo hướng dẫn để xác thực tài khoản.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='text-center'>
                            <p className='text-sm text-stone-600 dark:text-stone-400'>
                                <Link to={paths.login} className='font-medium text-stone-900 hover:underline dark:text-stone-100'>
                                    Quay lại trang đăng nhập
                                </Link>
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className='space-y-4'>
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
                                <label htmlFor='email' className='mb-2 block text-sm font-medium text-stone-900 dark:text-stone-100'>
                                    Email
                                </label>
                                <div className='relative'>
                                    <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                                        <FontAwesomeIcon icon={faEnvelope} className='text-stone-400' />
                                    </div>
                                    <Input type='email' id='email' value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className='pl-10' placeholder='Nhập email' disabled={isLoading} />
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
                                {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
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
                                Đã có tài khoản?{' '}
                                <Link to={paths.login} className='font-medium text-stone-900 hover:underline dark:text-stone-100'>
                                    Đăng nhập tại đây
                                </Link>
                            </p>
                        </div>
                    </>
                )}
            </div>
            <div className='animate-in slide-in-from-left flex w-1/2 items-center justify-center p-4 duration-1000'>
                <div className='relative aspect-square w-full overflow-hidden rounded-lg'>
                    <Lottie animationData={LoginImage} loop={true} className='h-full w-full' />
                </div>
            </div>
        </div>
    );
};

export default Register;
