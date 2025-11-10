import LoadingImage from '@/assets/lottie/loading.json';
import Dropdown, { DropdownItem } from '@/components/ui/drop-down';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import api from '@/utils/api';
import { faBookOpen, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isAxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';

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

const Roadmap: FC = () => {
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<Pagination>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [topicFilter, setTopicFilter] = useState('');
    const navigate = useNavigate();

    const fetchTopics = async () => {
        try {
            const response = await api.get<ApiResponse<Topic[]>>(apiEndpoints.public.topics);
            setTopics(response.data.data);
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                toast.error(MESSAGES.internalServerError);
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
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                toast.error(MESSAGES.internalServerError);
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

    const handleViewRoadmap = (roadmapId: string) => {
        navigate(`/roadmaps/${roadmapId}`);
    };

    return (
        <div className='flex w-full max-w-4xl flex-1 items-start justify-center rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800'>
            <div className='w-full p-4'>
                <div className='mb-6 flex shrink-0 items-center justify-between'>
                    <p className='text-2xl font-bold'>Danh sách Roadmaps</p>
                    <Dropdown trigger={topicFilter || 'Chọn chủ đề'} triggerVariant='outline' triggerClassName='inline-flex items-center justify-start w-[150px] truncate rounded-md border border-stone-800 px-4 py-2 text-left align-middle font-sans text-sm font-medium transition-all duration-300 ease-in' menuClassName='w-[150px]'>
                        <DropdownItem onClick={() => handleTopicSelect('')}>Tất cả</DropdownItem>
                        {topics.map((topic) => (
                            <DropdownItem key={topic.id} onClick={() => handleTopicSelect(topic.name)}>
                                {topic.name}
                            </DropdownItem>
                        ))}
                    </Dropdown>
                </div>

                {loading ? (
                    <div className='flex items-center justify-center'>
                        <Lottie animationData={LoadingImage} loop={true} />
                    </div>
                ) : roadmaps.length === 0 ? (
                    <div className='flex items-center justify-center'>
                        <div className='text-stone-500'>Không có roadmap nào</div>
                    </div>
                ) : (
                    <div className='columns-4 gap-4 space-y-4'>
                        {roadmaps.map((roadmap) => (
                            <button key={roadmap.id} className='group mb-4 cursor-pointer break-inside-avoid overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition-all duration-200 hover:border-stone-300 hover:shadow-md dark:border-stone-700 dark:bg-stone-800 dark:hover:border-stone-600' onClick={() => handleViewRoadmap(roadmap.id)}>
                                <div className='p-3'>
                                    <div className='mb-2 flex items-start justify-between'>
                                        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                                            <FontAwesomeIcon icon={faBookOpen} className='text-sm text-stone-600 dark:text-stone-400' />
                                        </div>
                                        <div className='flex items-center text-xs text-stone-500 dark:text-stone-400'>
                                            <FontAwesomeIcon icon={faUsers} className='mr-1' />
                                            <span className='font-medium'>{roadmap._count.user_paths}</span>
                                        </div>
                                    </div>

                                    <p className='mb-2 text-base font-semibold text-stone-900 transition-colors group-hover:text-stone-700 dark:text-stone-100 dark:group-hover:text-stone-300'>{roadmap.name}</p>
                                    <p className='line-clamp-2 text-xs text-stone-600 dark:text-stone-400'>{roadmap.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className='mt-6 flex justify-center space-x-2'>
                        <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination.hasPrevPage} className='rounded border border-stone-300 bg-white px-3 py-1 text-sm disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800'>
                            Trước
                        </button>
                        <span className='px-3 py-1 text-sm'>
                            Trang {pagination.currentPage} / {pagination.totalPages}
                        </span>
                        <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination.hasNextPage} className='rounded border border-stone-300 bg-white px-3 py-1 text-sm disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800'>
                            Sau
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Roadmap;
