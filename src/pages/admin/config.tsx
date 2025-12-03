import Button from '@/components/admin/ui/button';
import Input from '@/components/admin/ui/input';
import apiEndpoints from '@/config/api-endpoints';
import { useLayoutStore } from '@/store/layout.store';
import api from '@/utils/api';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isAxiosError } from 'axios';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

interface Config {
    id: string;
    resend_api: string | null;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
    message?: string;
}

interface UpdateConfig {
    resend_api?: string;
}

const Config: FC = () => {
    const [error, setError] = useState<string | null>(null);
    const [updateConfig, setUpdateConfig] = useState<UpdateConfig>({ resend_api: '' });
    const [showResendKey, setShowResendKey] = useState(false);
    const { contentHeight } = useLayoutStore();

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await api.get<ApiResponse<Config>>(apiEndpoints.admin.config);
            setUpdateConfig({
                resend_api: response.data.data.resend_api || ''
            });
            setError(null);
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || 'Internal Server Error');
            } else {
                setError('Internal Server Error');
            }
        }
    };

    const handleUpdateConfig = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            await api.put<ApiResponse<Config>>(apiEndpoints.admin.config, updateConfig);
            fetchConfig();

            setTimeout(() => {
                setError(null);
            }, 3000);
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || 'Internal Server Error');
            } else {
                setError('Internal Server Error');
            }
        }
    };

    const toggleResendKeyVisibility = () => {
        setShowResendKey(!showResendKey);
    };

    return (
        <div className='flex flex-col' style={{ height: `${contentHeight}px` }}>
            <div className='mb-4 flex shrink-0 items-center justify-between'>
                <p className='text-2xl font-bold'>Quản lý Cấu hình</p>
                <Button type='submit' form='config-form'>
                    Lưu thay đổi
                </Button>
            </div>

            {error && <div className='mb-4 shrink-0 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>{error}</div>}

            <div className='flex-1 overflow-hidden rounded-lg bg-white shadow'>
                <div className='h-full overflow-y-auto p-4'>
                    <form id='config-form' onSubmit={handleUpdateConfig}>
                        <div className='mb-4'>
                            <label htmlFor='resend-api' className='mb-2 block text-sm font-bold text-gray-700'>
                                Resend API Key
                            </label>
                            <div className='relative'>
                                <Input id='resend-api' type={showResendKey ? 'text' : 'password'} value={updateConfig.resend_api} onChange={(e) => setUpdateConfig({ ...updateConfig, resend_api: e.target.value })} placeholder='Nhập Resend API Key' className='py-3 pr-20' />
                                <button type='button' className='absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700' onClick={toggleResendKeyVisibility} tabIndex={-1}>
                                    <FontAwesomeIcon icon={showResendKey ? faEyeSlash : faEye} />
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Config;
