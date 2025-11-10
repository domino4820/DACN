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
    gemini_api: string | null;
    resend_api: string | null;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
    message?: string;
}

interface UpdateConfig {
    gemini_api: string;
    resend_api: string;
}

const Config: FC = () => {
    const [config, setConfig] = useState<Config | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [updateConfig, setUpdateConfig] = useState<UpdateConfig>({ gemini_api: '', resend_api: '' });
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [showResendKey, setShowResendKey] = useState(false);
    const { contentHeight } = useLayoutStore();

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await api.get<ApiResponse<Config>>(apiEndpoints.admin.config);
            setConfig(response.data.data);
            setUpdateConfig({
                gemini_api: response.data.data.gemini_api || '',
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
            setIsEditing(false);
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

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (config) {
            setUpdateConfig({
                gemini_api: config.gemini_api || '',
                resend_api: config.resend_api || ''
            });
        }
    };

    const toggleGeminiKeyVisibility = () => {
        setShowGeminiKey(!showGeminiKey);
    };

    const toggleResendKeyVisibility = () => {
        setShowResendKey(!showResendKey);
    };

    return (
        <div className='flex flex-col' style={{ height: `${contentHeight}px` }}>
            <div className='mb-4 flex shrink-0 items-center justify-between'>
                <p className='text-2xl font-bold'>Quản lý Cấu hình</p>
                {!isEditing && <Button onClick={() => setIsEditing(true)}>Chỉnh sửa</Button>}
            </div>

            {error && <div className='mb-4 shrink-0 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>{error}</div>}

            <div className='flex-1 overflow-hidden rounded-lg bg-white shadow'>
                <div className='h-full overflow-y-auto p-6'>
                    <form onSubmit={handleUpdateConfig}>
                        <div className='mb-6'>
                            <label htmlFor='gemini-api' className='mb-2 block text-sm font-bold text-gray-700'>
                                Gemini API Key
                            </label>
                            <div className='relative'>
                                <Input id='gemini-api' type={showGeminiKey ? 'text' : 'password'} value={isEditing ? updateConfig.gemini_api : config?.gemini_api || ''} onChange={(e) => setUpdateConfig({ ...updateConfig, gemini_api: e.target.value })} placeholder='Nhập Gemini API Key' className='py-3 pr-20' disabled={!isEditing} />
                                <button type='button' className='absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700' onClick={toggleGeminiKeyVisibility} tabIndex={-1}>
                                    <FontAwesomeIcon icon={showGeminiKey ? faEyeSlash : faEye} />
                                </button>
                            </div>
                        </div>

                        <div className='mb-6'>
                            <label htmlFor='resend-api' className='mb-2 block text-sm font-bold text-gray-700'>
                                Resend API Key
                            </label>
                            <div className='relative'>
                                <Input id='resend-api' type={showResendKey ? 'text' : 'password'} value={isEditing ? updateConfig.resend_api : config?.resend_api || ''} onChange={(e) => setUpdateConfig({ ...updateConfig, resend_api: e.target.value })} placeholder='Nhập Resend API Key' className='py-3 pr-20' disabled={!isEditing} />
                                <button type='button' className='absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700' onClick={toggleResendKeyVisibility} tabIndex={-1}>
                                    <FontAwesomeIcon icon={showResendKey ? faEyeSlash : faEye} />
                                </button>
                            </div>
                        </div>

                        {isEditing && (
                            <div className='flex justify-end'>
                                <Button type='button' onClick={handleCancelEdit} className='mr-2 bg-transparent text-stone-800 hover:bg-stone-100'>
                                    Hủy
                                </Button>
                                <Button type='submit'>Lưu thay đổi</Button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Config;
