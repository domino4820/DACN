import EmptyRoadmapImage from '@/assets/lottie/404-v2.json';
import LoadingImage from '@/assets/lottie/loading.json';
import Dropdown, { DropdownItem } from '@/components/ui/drop-down';
import Pagination from '@/components/ui/pagination';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import api from '@/utils/api';
import { faBookOpen, faLayerGroup, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isAxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
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
    const loadingRef = useRef<HTMLDivElement>(null);
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [height, setHeight] = useState<number>(0);
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

    useEffect(() => {
        if (loadingRef.current) {
            setHeight(loadingRef.current.clientHeight);
        }
    }, [loadingRef.current]);

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
            <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800' ref={loadingRef}>
                <div className='w-full p-4'>
                    <div className='flex items-center justify-center'>
                        <Lottie animationData={LoadingImage} loop={true} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className='flex w-full max-w-4xl flex-1 flex-col overflow-hidden rounded-lg bg-white p-4 shadow-lg dark:bg-stone-800'
            style={{
                height: height,
                maxHeight: height
            }}
        >
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

            <div className={`flex-1 ${roadmaps.length > 0 ? 'overflow-y-auto' : ''}`}>
                {roadmaps.length === 0 ? (
                    <>
                        <div className='mb-4 w-full text-center'>
                            <p className='text-lg font-medium text-stone-600 dark:text-stone-400'>Không có roadmap nào phù hợp với bộ lọc đã chọn.</p>
                            <p className='mt-2 text-sm text-stone-500 dark:text-stone-400'>Thử thay đổi bộ lọc hoặc quay lại sau.</p>
                        </div>
                        <div className='mx-auto w-full max-w-md'>
                            <Lottie animationData={EmptyRoadmapImage} loop={true} className='h-full w-full' />
                        </div>
                    </>
                ) : (
                    <div className='mb-4 flex flex-col gap-3'>
                        {roadmaps.map((roadmap) => (
                            <button key={roadmap.id} className='group w-full cursor-pointer overflow-hidden rounded-lg border border-stone-200 bg-white p-4 text-left shadow-sm transition-all hover:border-stone-300 hover:shadow-md dark:border-stone-700 dark:bg-stone-800 dark:hover:border-stone-600' onClick={() => handleViewRoadmap(roadmap.id)}>
                                <div className='flex items-center gap-4'>
                                    <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                                        <FontAwesomeIcon icon={faBookOpen} className='text-xl text-stone-600 dark:text-stone-400' />
                                    </div>

                                    <div className='flex flex-1 flex-col overflow-hidden'>
                                        <p className='truncate text-lg font-bold text-stone-900 group-hover:text-stone-700 dark:text-stone-100 dark:group-hover:text-stone-300'>{roadmap.name}</p>
                                        <p className='truncate text-sm text-stone-600 dark:text-stone-400'>{roadmap.description}</p>
                                    </div>

                                    <div className='flex shrink-0 flex-col items-end gap-1 text-xs text-stone-500 sm:flex-row sm:items-center sm:gap-4 dark:text-stone-400'>
                                        <div className='flex items-center'>
                                            <FontAwesomeIcon icon={faUsers} className='mr-1.5' />
                                            <span className='font-medium'>{roadmap._count.user_paths}</span>
                                        </div>
                                        <div className='flex items-center'>
                                            <FontAwesomeIcon icon={faLayerGroup} className='mr-1.5' />
                                            <span>{roadmap._count.nodes} bài học</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {pagination.totalPages > 1 && (
                <div className='mt-auto flex justify-center'>
                    <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPrevPage={() => handlePageChange(pagination.currentPage - 1)} onNextPage={() => handlePageChange(pagination.currentPage + 1)} hasPrevPage={pagination.hasPrevPage} hasNextPage={pagination.hasNextPage} />
                </div>
            )}
        </div>
    );
};

export default Roadmap;
