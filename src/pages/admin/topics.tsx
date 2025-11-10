import Button from '@/components/admin/ui/button';
import Input from '@/components/admin/ui/input';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import { useLayoutStore } from '@/store/layout.store';
import api from '@/utils/api';
import { isAxiosError } from 'axios';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

interface Topic {
    id: string;
    name: string;
    created_at: string;
    _count: {
        roadmap_topics: number;
    };
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
    message?: string;
}

interface NewTopic {
    name: string;
}

const Topics: FC = () => {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTopic, setNewTopic] = useState<NewTopic>({ name: '' });
    const { contentHeight } = useLayoutStore();

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            const response = await api.get<ApiResponse<Topic[]>>(apiEndpoints.public.topics);
            setTopics(response.data.data);
            setError(null);
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                setError(MESSAGES.internalServerError);
            }
        }
    };

    const handleAddTopic = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newTopic.name.trim()) return;

        try {
            await api.post<ApiResponse<Topic>>(apiEndpoints.admin.topics, newTopic);
            setNewTopic({ name: '' });
            setShowAddForm(false);
            fetchTopics();
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                setError(MESSAGES.internalServerError);
            }
        }
    };

    const handleDeleteTopic = async (id: string) => {
        try {
            await api.delete<ApiResponse<null>>(`${apiEndpoints.admin.topics}/${id}`);
            fetchTopics();
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                setError(MESSAGES.internalServerError);
            }
        }
    };

    return (
        <div className='flex flex-col' style={{ height: `${contentHeight}px` }}>
            <div className='mb-4 flex shrink-0 items-center justify-between'>
                <p className='text-2xl font-bold'>Quản lý Topics</p>
                <Button onClick={() => setShowAddForm(true)}>Thêm Topic</Button>
            </div>

            {error && <div className='mb-4 shrink-0 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>{error}</div>}

            {showAddForm && (
                <div className='mb-4 shrink-0 rounded-md bg-white p-4 shadow'>
                    <p className='mb-4 text-lg font-semibold'>Thêm Topic mới</p>
                    <form onSubmit={handleAddTopic}>
                        <div className='mb-4'>
                            <label htmlFor='topic-name' className='mb-2 block text-sm font-bold text-gray-700'>
                                Tên Topic
                            </label>
                            <Input id='topic-name' type='text' value={newTopic.name} onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })} placeholder='Nhập tên topic' required />
                        </div>
                        <div className='flex justify-end'>
                            <Button type='button' className='mr-2 bg-transparent text-stone-800 hover:bg-stone-100' onClick={() => setShowAddForm(false)}>
                                Hủy
                            </Button>
                            <Button type='submit'>Tạo Topic</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className='flex-1 overflow-hidden rounded-lg bg-white shadow'>
                <div className='h-full overflow-y-auto'>
                    <table className='min-w-full divide-y divide-gray-200'>
                        <thead className='sticky top-0 z-10 bg-gray-50'>
                            <tr>
                                <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Tên Topic</th>
                                <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Số Roadmaps</th>
                                <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Ngày tạo</th>
                                <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-200 bg-white'>
                            {topics.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className='px-4 py-4 text-center text-gray-500'>
                                        Không có topic nào
                                    </td>
                                </tr>
                            ) : (
                                topics.map((topic) => (
                                    <tr key={topic.id}>
                                        <td className='px-4 py-4 text-sm font-medium whitespace-nowrap text-gray-900'>{topic.name}</td>
                                        <td className='px-4 py-4 text-sm whitespace-nowrap text-gray-500'>{topic._count.roadmap_topics}</td>
                                        <td className='px-4 py-4 text-sm whitespace-nowrap text-gray-500'>{new Date(topic.created_at).toLocaleDateString('vi-VN')}</td>
                                        <td className='px-4 py-4 text-right text-sm font-medium whitespace-nowrap'>
                                            <Button className='bg-transparent text-stone-800 transition-all duration-200 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50' onClick={() => handleDeleteTopic(topic.id)} disabled={topic._count.roadmap_topics > 0}>
                                                Xóa
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Topics;
