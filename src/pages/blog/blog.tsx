import EmptyBlogImage from '@/assets/lottie/404-v2.json';
import LoadingImage from '@/assets/lottie/loading.json';
import Pagination from '@/components/ui/pagination';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import paths from '@/config/paths';
import api from '@/utils/api';
import { getErrorMessage } from '@/utils/error-handler';
import { faComment, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';

interface PostUser {
    username: string;
    profile: {
        name: string | null;
        avatar_url: string | null;
    } | null;
}

interface Post {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    user: PostUser;
    _count: {
        comments: number;
    };
}

interface PostPagination {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface PostsResponse {
    success: boolean;
    data: Post[];
    pagination: PostPagination;
    error?: string;
}

const Blog: FC = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PostPagination | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchPosts = async (page: number = 1) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get<PostsResponse>(apiEndpoints.public.posts, {
                params: {
                    page,
                    limit: 10
                }
            });

            if (response.data.success && response.data.data) {
                setPosts(response.data.data);
                setPagination(response.data.pagination);
            } else {
                const errorMsg = response.data.error || MESSAGES.internalServerError;
                setError(errorMsg);
                toast.error(errorMsg);
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                const message = getErrorMessage(err, MESSAGES.internalServerError);
                setError(message);
                toast.error(message);
            } else {
                setError(MESSAGES.internalServerError);
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts(currentPage);
    }, [currentPage]);

    const formatVietnamDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const extractTextFromHTML = (html: string): string => {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    };

    if (loading && posts.length === 0) {
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

    if (error) {
        return (
            <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white p-4 shadow-lg duration-700 dark:bg-stone-800'>
                <div className='w-full p-4 text-center'>
                    <div className='mb-4 inline-flex items-center justify-center gap-3 rounded-full bg-stone-100 px-4 py-2 dark:bg-stone-700'>
                        <span className='text-2xl font-bold text-stone-800 dark:text-stone-200'>Lỗi</span>
                    </div>
                    <p className='text-lg font-semibold text-stone-900 dark:text-stone-100'>{error}</p>
                    <p className='mt-2 text-sm text-stone-600 dark:text-stone-400'>Vui lòng thử lại sau hoặc quay lại trang chủ</p>
                </div>
            </div>
        );
    }

    return (
        <div className='flex w-full max-w-4xl flex-1 flex-col rounded-lg bg-white p-4 shadow-lg dark:bg-stone-800'>
            <div className='mb-6 flex shrink-0 flex-col gap-4'>
                <div className='flex shrink-0 flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
                    <div>
                        <p className='text-3xl leading-tight font-bold text-stone-900 dark:text-stone-100'>Blog</p>
                        <p className='text-stone-600 dark:text-stone-400'>Khám phá các bài viết và chia sẻ kiến thức</p>
                    </div>
                </div>
            </div>

            <div>
                {!loading && posts.length === 0 ? (
                    <>
                        <div className='mb-4 w-full text-center'>
                            <p className='text-lg font-bold text-stone-600 dark:text-stone-400'>Hiện tại chưa có bài viết nào.</p>
                            <p className='mt-2 text-sm text-stone-600 dark:text-stone-400'>Hãy quay lại sau để xem các bài viết mới!</p>
                        </div>
                        <div className='mx-auto w-full max-w-md'>
                            <Lottie animationData={EmptyBlogImage} loop={true} className='h-full w-full' />
                        </div>
                    </>
                ) : (
                    <div className='mb-4 grid grid-cols-4 gap-4'>
                        {posts.map((post) => (
                            <button key={post.id} className='group flex h-full flex-col rounded-lg border border-stone-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-800' onClick={() => navigate(paths.blogDetail.replace(':id', post.id))}>
                                <p className='mb-2 line-clamp-2 text-lg font-bold text-stone-900 group-hover:text-stone-700 dark:text-stone-100 dark:group-hover:text-stone-300'>{post.title}</p>
                                <p className='mb-4 line-clamp-3 flex-1 text-sm text-stone-600 dark:text-stone-400'>{extractTextFromHTML(post.content)}</p>

                                <div className='flex flex-col gap-2 border-t border-stone-200 pt-3 dark:border-stone-700'>
                                    <div className='flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400'>
                                        {post.user.profile?.avatar_url ? (
                                            <img src={post.user.profile.avatar_url} alt={post.user.username} className='h-5 w-5 rounded-full object-cover' />
                                        ) : (
                                            <div className='flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-700'>
                                                <FontAwesomeIcon icon={faUser} className='text-xs text-stone-600 dark:text-stone-400' />
                                            </div>
                                        )}
                                        <span className='truncate text-stone-600 dark:text-stone-400'>{post.user.profile?.name || post.user.username}</span>
                                    </div>
                                    <div className='flex items-center justify-between gap-2 text-xs text-stone-600 dark:text-stone-400'>
                                        <span>{formatVietnamDate(post.created_at)}</span>
                                        <div className='flex items-center gap-1'>
                                            <FontAwesomeIcon icon={faComment} className='text-xs' />
                                            <span>{post._count.comments}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className='mt-6 flex justify-center'>
                    <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPrevPage={() => setCurrentPage((prev) => Math.max(1, prev - 1))} onNextPage={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))} hasPrevPage={pagination.hasPrevPage} hasNextPage={pagination.hasNextPage} />
                </div>
            )}
        </div>
    );
};

export default Blog;
