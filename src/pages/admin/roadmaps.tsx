import RoadmapForm from '@/components/admin/common/roadmap-form';
import Button from '@/components/admin/ui/button';
import Dropdown, { DropdownItem } from '@/components/ui/drop-down';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import { useLayoutStore } from '@/store/layout.store.ts';
import api from '@/utils/api';
import { isAxiosError } from 'axios';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

type Topic = {
    id: string;
    name: string;
};

type Roadmap = {
    id: string;
    name: string;
    description: string;
    roadmap_topics: {
        topic: Topic;
    }[];
    _count: {
        nodes: number;
        user_paths: number;
    };
};

type Pagination = {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};

interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
    message?: string;
}

const Roadmaps: FC = () => {
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<Pagination>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [topicFilter, setTopicFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingRoadmapId, setEditingRoadmapId] = useState<string | null>(null);
    const { contentHeight } = useLayoutStore();

    const fetchTopics = async () => {
        try {
            const response = await api.get<ApiResponse<Topic[]>>(apiEndpoints.public.topics);
            setTopics(response.data.data);
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                setError(MESSAGES.internalServerError);
            }
        }
    };

    const fetchRoadmaps = async (page = 1, topic = '') => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10'
            });

            if (topic) {
                params.append('topic', topic);
            }

            const response = await api.get(`${apiEndpoints.public.roadmaps}?${params.toString()}`);

            const { data, pagination } = response.data;

            setRoadmaps(data);
            setPagination(pagination);
            setError(null);
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                setError(MESSAGES.internalServerError);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTopics();
        fetchRoadmaps(pagination.currentPage, topicFilter);
    }, [pagination.currentPage, topicFilter]);

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({ ...prev, currentPage: page }));
    };

    const handleTopicSelect = (topicName: string) => {
        setTopicFilter(topicName);
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const handleDeleteRoadmap = async (id: string) => {
        try {
            await api.delete<ApiResponse<null>>(`${apiEndpoints.admin.roadmap}/${id}`);
            fetchRoadmaps(pagination.currentPage, topicFilter);
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                setError(MESSAGES.internalServerError);
            }
        }
    };

    const handleEditRoadmap = (id: string) => {
        setEditingRoadmapId(id);
        setShowForm(true);
    };

    return (
        <div className='flex flex-col' style={{ height: `${contentHeight}px` }}>
            <div className='mb-4 flex shrink-0 items-center justify-between'>
                <p className='text-2xl font-bold'>Quản lý Roadmaps</p>
                <Button onClick={() => setShowForm(!showForm)}>Tạo Roadmap</Button>
            </div>

            {error && <div className='mb-4 shrink-0 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>{error}</div>}

            {showForm && (
                <RoadmapForm
                    onClose={() => {
                        setShowForm(false);
                        setEditingRoadmapId(null);
                    }}
                    onSuccess={() => fetchRoadmaps(pagination.currentPage, topicFilter)}
                    roadmapId={editingRoadmapId || undefined}
                />
            )}

            {!showForm && (
                <>
                    <div className='mb-4 flex shrink-0 items-center gap-4'>
                        <div>
                            <Dropdown trigger={topicFilter || 'Chọn chủ đề'} triggerVariant='outline' triggerClassName='inline-flex items-center justify-start w-[150px] truncate rounded-md border border-stone-800 px-4 py-2 text-left align-middle font-sans text-sm font-medium transition-all duration-300 ease-in' menuClassName='w-[150px]'>
                                <DropdownItem onClick={() => handleTopicSelect('')}>Tất cả</DropdownItem>
                                {topics.map((topic) => (
                                    <DropdownItem key={topic.id} onClick={() => handleTopicSelect(topic.name)}>
                                        {topic.name}
                                    </DropdownItem>
                                ))}
                            </Dropdown>
                        </div>
                    </div>

                    <div className='flex-1 overflow-hidden rounded-lg bg-white shadow'>
                        <div className='h-full overflow-y-auto'>
                            <table className='min-w-full divide-y divide-gray-200'>
                                <thead className='sticky top-0 z-10 bg-gray-50'>
                                    <tr>
                                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Tên Roadmap</th>
                                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Mô tả</th>
                                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Chủ đề</th>
                                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Người học</th>
                                        <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-200 bg-white'>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className='px-4 py-4 text-center text-gray-500'>
                                                Đang tải...
                                            </td>
                                        </tr>
                                    ) : roadmaps.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className='px-4 py-4 text-center text-gray-500'>
                                                Không có roadmap nào
                                            </td>
                                        </tr>
                                    ) : (
                                        roadmaps.map((roadmap) => (
                                            <tr key={roadmap.id}>
                                                <td className='px-4 py-4 text-sm font-medium whitespace-nowrap text-gray-900'>{roadmap.name}</td>
                                                <td className='max-w-xs truncate px-4 py-4 text-sm text-gray-500'>{roadmap.description}</td>
                                                <td className='px-4 py-4 text-sm text-gray-500'>
                                                    <div className='max-w-[100px] truncate whitespace-nowrap'>
                                                        {roadmap.roadmap_topics.map(({ topic }, index) => (
                                                            <span key={topic.id}>
                                                                {topic.name}
                                                                {index < roadmap.roadmap_topics.length - 1 && ', '}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className='px-4 py-4 text-sm whitespace-nowrap text-gray-500'>{roadmap._count.user_paths}</td>
                                                <td className='px-4 py-4 text-right text-sm font-medium whitespace-nowrap'>
                                                    <Button className='mr-2 bg-transparent text-stone-800 transition-all duration-200 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50' onClick={() => handleEditRoadmap(roadmap.id)}>
                                                        Chỉnh sửa
                                                    </Button>
                                                    <Button className='bg-transparent text-stone-800 transition-all duration-200 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50' onClick={() => handleDeleteRoadmap(roadmap.id)}>
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

                    {pagination.totalPages > 1 && (
                        <div className='mt-4 flex justify-center space-x-2'>
                            <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination.hasPrevPage} className='rounded border border-stone-300 bg-white px-3 py-1 text-sm disabled:opacity-50'>
                                Trước
                            </button>
                            <span className='px-3 py-1 text-sm'>
                                Trang {pagination.currentPage} / {pagination.totalPages}
                            </span>
                            <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination.hasNextPage} className='rounded border border-stone-300 bg-white px-3 py-1 text-sm disabled:opacity-50'>
                                Sau
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Roadmaps;
