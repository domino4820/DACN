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

    return (
        <div className='flex flex-col' style={{ height: `${contentHeight}px` }}>
            <div className='mb-4 flex shrink-0 items-center justify-between'>
                <p className='text-2xl font-bold'>Quản lý Roadmaps</p>
            </div>

            {error && <div className='mb-4 shrink-0 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>{error}</div>}

            <div className='mb-4 shrink-0'>
                <Dropdown trigger={topicFilter || 'Chọn chủ đề'} triggerVariant='outline' triggerClassName='inline-flex items-center justify-start w-[150px] truncate rounded-md border border-stone-800 px-4 py-2 text-left align-middle font-sans text-sm font-medium transition-all duration-300 ease-in' menuClassName='w-[150px]'>
                    <DropdownItem onClick={() => handleTopicSelect('')}>Tất cả</DropdownItem>
                    {topics.map((topic) => (
                        <DropdownItem key={topic.id} onClick={() => handleTopicSelect(topic.name)}>
                            {topic.name}
                        </DropdownItem>
                    ))}
                </Dropdown>
            </div>

            <div className='flex-1 overflow-hidden rounded-lg bg-white shadow'>
                <div className='h-full overflow-y-auto p-4'>
                    {loading ? (
                        <div className='flex h-64 items-center justify-center'>
                            <div className='text-stone-600 dark:text-stone-400'>Đang tải...</div>
                        </div>
                    ) : (
                        <>
                            {roadmaps.length > 0 ? (
                                <>
                                    <div className='mb-8 flex flex-wrap gap-4'>
                                        {roadmaps.map((roadmap) => (
                                            <div key={roadmap.id} className='min-w-[calc(50%-8px)] flex-1 rounded-lg border border-stone-200 bg-white p-6 shadow-md dark:border-stone-700 dark:bg-stone-800'>
                                                <p className='mb-2 text-lg font-semibold text-stone-900 dark:text-stone-100'>{roadmap.name}</p>

                                                {roadmap.description && <p className='mb-4 line-clamp-2 text-stone-600 dark:text-stone-400'>{roadmap.description}</p>}

                                                <div className='mb-4 flex flex-wrap gap-2'>
                                                    {roadmap.roadmap_topics.map(({ topic }) => (
                                                        <span key={topic.id} className='rounded-md bg-stone-100 px-2 py-1 text-xs text-stone-700 dark:bg-stone-700 dark:text-stone-300'>
                                                            {topic.name}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className='flex items-center justify-between text-sm text-stone-500 dark:text-stone-400'>
                                                    <div>
                                                        <span>{roadmap._count.nodes} nodes</span>
                                                        <span className='mx-2'>•</span>
                                                        <span>{roadmap._count.user_paths} người dùng</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {pagination.totalPages > 1 && (
                                        <div className='mt-8 flex items-center justify-center gap-2'>
                                            <Button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination.hasPrevPage} className='bg-transparent text-stone-800 transition-all duration-200 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50'>
                                                Trang trước
                                            </Button>

                                            <span className='text-stone-600 dark:text-stone-400'>
                                                Trang {pagination.currentPage} / {pagination.totalPages}
                                            </span>

                                            <Button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination.hasNextPage} className='bg-transparent text-stone-800 transition-all duration-200 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50'>
                                                Trang sau
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className='py-12 text-center'>
                                    <p className='text-stone-600 dark:text-stone-400'>{topicFilter ? 'Không tìm thấy roadmap nào theo topic đã chọn.' : 'Chưa có roadmap nào.'}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Roadmaps;
