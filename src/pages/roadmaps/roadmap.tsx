import EmptyRoadmapImage from '@/assets/lottie/404-v2.json';
import LoadingImage from '@/assets/lottie/loading.json';
import Dropdown, { DropdownItem } from '@/components/ui/drop-down';
import Pagination from '@/components/ui/pagination';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import api from '@/utils/api';
import { faBookOpen, faClock, faUsers } from '@fortawesome/free-solid-svg-icons';
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

    if (loading) {
        return (
            <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800'>
                <div className='w-full p-4'>
                    <div className='flex items-center justify-center'>
                        <Lottie animationData={LoadingImage} loop={true} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='flex w-full max-w-4xl flex-1 flex-col rounded-lg bg-white p-4 shadow-lg dark:bg-stone-800'>
            <div className='mb-4 flex shrink-0 items-center justify-between'>
                <div className='flex items-center gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                        <FontAwesomeIcon icon={faBookOpen} className='text-stone-600 dark:text-stone-400' />
                    </div>
                    <div>
                        <p className='text-2xl font-bold text-stone-900 dark:text-stone-100'>Danh sách Roadmaps</p>
                        <p className='text-sm text-stone-600 dark:text-stone-400'>Khám phá các lộ trình học tập phù hợp với bạn</p>
                    </div>
                </div>
                <div>
                    <Dropdown trigger={topicFilter || 'Chọn topic'} triggerVariant='outline' triggerClassName='inline-flex items-center justify-start w-[200px] truncate rounded-md border border-stone-800 px-4 py-2 text-left align-middle font-sans text-sm font-medium' menuClassName='w-[200px]'>
                        <DropdownItem onClick={() => handleTopicSelect('')}>Tất cả</DropdownItem>
                        {topics.map((topic) => (
                            <DropdownItem key={topic.id} onClick={() => handleTopicSelect(topic.name)}>
                                <div className='max-w-[180px] truncate'>{topic.name}</div>
                            </DropdownItem>
                        ))}
                    </Dropdown>
                </div>
            </div>

            {roadmaps.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12'>
                    <div className='mb-4 w-full text-center'>
                        <p className='text-lg font-medium text-stone-600 dark:text-stone-400'>Không có roadmap nào phù hợp với bộ lọc đã chọn.</p>
                        <p className='mt-2 text-sm text-stone-500 dark:text-stone-400'>Thử thay đổi bộ lọc hoặc quay lại sau.</p>
                    </div>
                    <div className='relative aspect-square w-full max-w-md overflow-hidden rounded-lg'>
                        <Lottie animationData={EmptyRoadmapImage} loop={true} className='h-full w-full' />
                    </div>
                </div>
            ) : (
                <div className='mb-4 flex flex-wrap gap-4'>
                    {roadmaps.map((roadmap) => (
                        <button key={roadmap.id} className='group w-[calc(25%-12px)] cursor-pointer overflow-hidden rounded-lg border border-stone-200 bg-white p-4 text-left shadow-sm hover:border-stone-300 hover:shadow-md dark:border-stone-700 dark:bg-stone-800 dark:hover:border-stone-600' onClick={() => handleViewRoadmap(roadmap.id)}>
                            <div className='flex h-full flex-col'>
                                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                                    <FontAwesomeIcon icon={faBookOpen} className='text-xl text-stone-600 dark:text-stone-400' />
                                </div>

                                <p className='mb-2 truncate text-lg font-bold text-stone-900 group-hover:text-stone-700 dark:text-stone-100 dark:group-hover:text-stone-300'>{roadmap.name}</p>
                                <p className='mb-4 line-clamp-3 flex-1 overflow-hidden text-sm text-stone-600 dark:text-stone-400'>{roadmap.description}</p>

                                <div className='mt-auto flex items-center justify-between'>
                                    <div className='flex items-center text-xs text-stone-500 dark:text-stone-400'>
                                        <FontAwesomeIcon icon={faUsers} className='mr-1' />
                                        <span className='font-medium'>{roadmap._count.user_paths}</span>
                                    </div>
                                    <div className='flex items-center text-xs text-stone-500 dark:text-stone-400'>
                                        <FontAwesomeIcon icon={faClock} className='mr-1' />
                                        <span>{roadmap._count.nodes} bài học</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {pagination.totalPages > 1 && (
                <div className='mt-auto flex justify-center'>
                    <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPrevPage={() => handlePageChange(pagination.currentPage - 1)} onNextPage={() => handlePageChange(pagination.currentPage + 1)} hasPrevPage={pagination.hasPrevPage} hasNextPage={pagination.hasNextPage} />
                </div>
            )}
        </div>
    );
};

export default Roadmap;
