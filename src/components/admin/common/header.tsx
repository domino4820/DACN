import Logo from '@/assets/images/favicon/logo-transparent.png';
import Button from '@/components/admin/ui/button.tsx';
import Input from '@/components/admin/ui/input.tsx';
import apiEndpoints from '@/config/api-endpoints';
import { useAdminStore } from '@/store/admin.store';
import api from '@/utils/api';
import { AxiosError } from 'axios';
import type { FC } from 'react';
import { useState } from 'react';

interface ChangePasswordResponse {
    success: boolean;
    data?: {
        message: string;
    };
    error?: string;
}

const Header: FC = () => {
    const logout = useAdminStore((state) => state.logout);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        old_password: '',
        new_password: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleLogout = () => {
        logout();
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
        setError(null);
        setSuccess(null);
        setPasswordForm({ old_password: '', new_password: '' });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setError(null);
        setSuccess(null);
        setPasswordForm({ old_password: '', new_password: '' });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!passwordForm.old_password || !passwordForm.new_password) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await api.patch<ChangePasswordResponse>(apiEndpoints.admin.changePassword, {
                old_password: passwordForm.old_password,
                new_password: passwordForm.new_password
            });

            if (response.data.success) {
                setSuccess(response.data.data?.message || 'Đổi mật khẩu thành công');
                setTimeout(() => {
                    handleCloseModal();
                }, 1500);
            } else {
                setError(response.data.error || 'Đổi mật khẩu thất bại');
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                const errorMsg = err.response?.data?.error || 'Đổi mật khẩu thất bại';
                setError(errorMsg);
            } else {
                setError('Đổi mật khẩu thất bại');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <header className='w-full bg-white shadow-md'>
                <div className='flex items-center justify-between py-4 pr-4'>
                    <div className='flex w-[200px] items-center justify-center'>
                        <img src={Logo} alt='' className='h-12 w-12 object-contain' />
                    </div>
                    <div className='flex items-center gap-4'>
                        <Button onClick={handleOpenModal}>Đổi mật khẩu</Button>
                        <Button onClick={handleLogout}>Đăng xuất</Button>
                    </div>
                </div>
            </header>

            {isModalOpen && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm' onClick={handleCloseModal}>
                    <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl' onClick={(e) => e.stopPropagation()}>
                        <div className='mb-4 flex items-center justify-between'>
                            <h2 className='text-xl font-bold text-stone-900'>Đổi mật khẩu</h2>
                            <button onClick={handleCloseModal} className='text-stone-500 hover:text-stone-700' disabled={isSubmitting}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                            {success && <div className='rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400'>{success}</div>}

                            {error && <div className='rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400'>{error}</div>}

                            <div className='flex flex-col gap-2'>
                                <label htmlFor='old_password' className='text-sm font-medium text-stone-700'>
                                    Mật khẩu cũ
                                </label>
                                <Input id='old_password' type='password' value={passwordForm.old_password} onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })} disabled={isSubmitting} required />
                            </div>

                            <div className='flex flex-col gap-2'>
                                <label htmlFor='new_password' className='text-sm font-medium text-stone-700'>
                                    Mật khẩu mới
                                </label>
                                <Input id='new_password' type='password' value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} disabled={isSubmitting} required />
                            </div>

                            <div className='pt-2'>
                                <Button type='submit' disabled={isSubmitting} className='w-full'>
                                    {isSubmitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
