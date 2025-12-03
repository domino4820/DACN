import CoverImage2 from '@/assets/lottie/cover-2.json';
import CoverImage from '@/assets/lottie/cover.json';
import LoadingImage from '@/assets/lottie/loading.json';
import Wysiwyg from '@/components/common/wysiwyg';
import Button from '@/components/ui/button';
import Pagination from '@/components/ui/pagination';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import paths from '@/config/paths';
import { useAuthStore } from '@/store/auth.store';
import api from '@/utils/api';
import { getErrorMessage } from '@/utils/error-handler';
import { faFacebook, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCalendarAlt, faComment, faEnvelope, faPencilAlt, faPlus, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';
interface UserProfile {
    name: string | null;
    avatar_url: string | null;
    bio: string | null;
    visibility: 'PUBLIC' | 'GROUP_ONLY';
    facebook: string | null;
    github: string | null;
}

interface UserStats {
    xp: number;
}

interface UserData {
    username: string;
    email: string;
    is_banned: boolean;
    created_at: string;
    profile: UserProfile | null;
    stats: UserStats | null;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

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

const User: FC = () => {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const loadingRef = useRef<HTMLDivElement>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [height, setHeight] = useState<number>(0);
    const [posts, setPosts] = useState<Post[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);
    const [pagination, setPagination] = useState<PostPagination | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showEditor, setShowEditor] = useState(false);
    const [createForm, setCreateForm] = useState({ title: '', content: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ title: '', content: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

    useEffect(() => {
        if (loadingRef.current) {
            setHeight(loadingRef.current.clientHeight);
        }
    }, [loadingRef.current]);

    const fetchUserProfile = async () => {
        if (!username) return;

        try {
            setLoading(true);
            setError(null);
            const response = await api.get<ApiResponse<UserData>>(apiEndpoints.public.userProfile(username));

            if (response.data.success && response.data.data) {
                setUserData(response.data.data);
            } else {
                const errorMsg = response.data.error || MESSAGES.internalServerError;
                setError(errorMsg);
                toast.error(errorMsg);
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                const status = err.response?.status;
                const errorMsg = err.response?.data?.error || MESSAGES.internalServerError;

                if (status === 404) {
                    setError(MESSAGES.userNotFound);
                    toast.error(MESSAGES.userNotFound);
                } else if (status === 403) {
                    setError(errorMsg);
                    toast.error(errorMsg);
                } else {
                    const message = getErrorMessage(err, MESSAGES.internalServerError);
                    setError(message);
                    toast.error(message);
                }
            } else {
                setError(MESSAGES.internalServerError);
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchPosts = async (page: number = 1) => {
        if (!username) return;

        try {
            setPostsLoading(true);
            const response = await api.get<PostsResponse>(apiEndpoints.public.userPosts(username), {
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
                toast.error(errorMsg);
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                const errorMsg = err.response?.data?.error || MESSAGES.internalServerError;
                toast.error(errorMsg);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setPostsLoading(false);
        }
    };

    const handleCreatePost = async () => {
        if (!createForm.title.trim() || !createForm.content.trim() || createForm.content === '<p></p>') {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            setIsCreating(true);
            const response = await api.post<ApiResponse<Post>>(apiEndpoints.me.createPost, {
                title: createForm.title.trim(),
                content: createForm.content.trim()
            });

            if (response.data.success && response.data.data) {
                setShowEditor(false);
                setCreateForm({ title: '', content: '<p></p>' });
                setCurrentPage(1);
                await fetchPosts(1);
            } else {
                const errorMsg = response.data.error || MESSAGES.internalServerError;
                toast.error(errorMsg);
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                const errorMsg = err.response?.data?.error || MESSAGES.internalServerError;
                toast.error(errorMsg);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditPost = (post: Post) => {
        setEditingPostId(post.id);
        setEditForm({ title: post.title, content: post.content });
    };

    const handleUpdatePost = async () => {
        if (!editingPostId) return;
        if (!editForm.title.trim() || !editForm.content.trim() || editForm.content === '<p></p>') {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            setIsUpdating(true);
            const response = await api.put<ApiResponse<Post>>(apiEndpoints.me.updatePost(editingPostId), {
                title: editForm.title.trim(),
                content: editForm.content.trim()
            });

            if (response.data.success) {
                setEditingPostId(null);
                setEditForm({ title: '', content: '' });
                await fetchPosts(currentPage);
            } else {
                const errorMsg = response.data.error || MESSAGES.internalServerError;
                toast.error(errorMsg);
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                const errorMsg = err.response?.data?.error || MESSAGES.internalServerError;
                toast.error(errorMsg);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;

        try {
            setDeletingPostId(postId);
            const response = await api.delete<ApiResponse<null>>(apiEndpoints.me.deletePost(postId));

            if (response.data.success) {
                await fetchPosts(currentPage);
                toast.success('Đã xóa bài viết');
            } else {
                const errorMsg = response.data.error || MESSAGES.internalServerError;
                toast.error(errorMsg);
            }
        } catch (err) {
            if (err instanceof AxiosError) {
                const errorMsg = err.response?.data?.error || MESSAGES.internalServerError;
                toast.error(errorMsg);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setDeletingPostId(null);
        }
    };

    useEffect(() => {
        setUserData(null);
        setError(null);
        setCurrentPage(1);
        setPosts([]);
        setPagination(null);
        fetchUserProfile();
    }, [username]);

    useEffect(() => {
        if (userData && !error) {
            fetchPosts(currentPage);
        }
    }, [currentPage, userData]);

    if (loading) {
        return (
            <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800' ref={loadingRef} style={{ minHeight: height || 'auto' }}>
                <div className='w-full p-4'>
                    <div className='flex items-center justify-center'>
                        <Lottie animationData={LoadingImage} loop={true} />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !userData) {
        return (
            <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white p-4 shadow-lg duration-700 dark:bg-stone-800'>
                <div className='w-full p-4 text-center'>
                    <div className='mb-4 inline-flex items-center justify-center gap-3 rounded-full bg-stone-100 px-4 py-2 dark:bg-stone-700'>
                        <span className='text-2xl font-bold text-stone-800 dark:text-stone-200'>Lỗi</span>
                    </div>
                    <p className='text-lg font-semibold text-stone-900 dark:text-stone-100'>{error || MESSAGES.internalServerError}</p>
                    <p className='mt-2 text-sm text-stone-600 dark:text-stone-400'>Vui lòng thử lại sau hoặc quay lại trang chủ</p>
                </div>
            </div>
        );
    }

    const isOwnProfile = currentUser?.username === userData.username;
    const profile = userData.profile;

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

    return (
        <>
            <title>{`${profile?.name || userData.username || 'E Roadmap'}`}</title>
            <div className='flex w-full max-w-4xl flex-1 flex-col gap-6'>
                <div className='overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-800'>
                    <div className='flex h-48 items-center justify-center overflow-hidden shadow-lg shadow-black/20'>
                        <Lottie animationData={CoverImage2} loop={true} className='h-full w-full' />
                        <Lottie animationData={CoverImage} loop={true} className='h-full w-full' />
                        <Lottie animationData={CoverImage2} loop={true} className='h-full w-full' />
                    </div>
                    <div className='px-6 pb-6'>
                        <div className='-mt-16 mb-4'>
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt={userData.username} className='relative z-10 h-32 w-32 rounded-full border-4 border-white object-cover dark:border-stone-900' />
                            ) : (
                                <div className='flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-stone-100 dark:border-stone-900 dark:bg-stone-700'>
                                    <FontAwesomeIcon icon={faUser} className='text-5xl text-stone-600 dark:text-stone-400' />
                                </div>
                            )}
                        </div>

                        <div className='flex flex-col gap-6'>
                            <div className='flex-1'>
                                <div className='mb-4 flex items-center gap-3'>
                                    <p className='text-3xl font-bold text-stone-900 dark:text-stone-100'>{profile?.name || userData.username}</p>
                                    {userData.stats && <div className='rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700 dark:bg-stone-700 dark:text-stone-300'>Lv.{Math.floor(userData.stats.xp / 10)}</div>}
                                </div>
                                <div className='mb-4'>
                                    <p className='text-lg text-stone-600 dark:text-stone-400'>@{userData.username}</p>
                                </div>

                                {profile?.bio && <p className='mb-4 text-sm text-stone-700 dark:text-stone-300'>{profile.bio}</p>}

                                {(profile?.facebook || profile?.github) && (
                                    <div className='mb-4 flex gap-3'>
                                        {profile?.facebook && (
                                            <a href={`https://facebook.com/${profile.facebook}`} target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700' title={`Facebook: ${profile.facebook}`}>
                                                <FontAwesomeIcon icon={faFacebook} className='text-blue-600 dark:text-blue-400' />
                                                <span>Facebook</span>
                                            </a>
                                        )}
                                        {profile?.github && (
                                            <a href={`https://github.com/${profile.github}`} target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700' title={`GitHub: ${profile.github}`}>
                                                <FontAwesomeIcon icon={faGithub} />
                                                <span>GitHub</span>
                                            </a>
                                        )}
                                    </div>
                                )}

                                <div className='flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400'>
                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                    <span>Tham gia vào {formatVietnamDate(userData.created_at)}</span>
                                </div>

                                {isOwnProfile && (
                                    <div className='mt-3 flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400'>
                                        <FontAwesomeIcon icon={faEnvelope} />
                                        <span>{userData.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className='rounded-lg border border-stone-200 bg-white p-4 shadow-lg dark:border-stone-700 dark:bg-stone-800'>
                    <div className='mb-4 flex items-center justify-between'>
                        <p className='text-xl font-bold text-stone-900 dark:text-stone-100'>Bài viết</p>
                        {isOwnProfile && !showEditor && (
                            <Button
                                onClick={() => {
                                    setCreateForm({ title: '', content: '<p></p>' });
                                    setShowEditor(true);
                                }}
                                className='flex items-center gap-2'
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                <span>Tạo bài viết</span>
                            </Button>
                        )}
                    </div>
                    {isOwnProfile && showEditor && (
                        <div className='mb-6'>
                            <Wysiwyg
                                title={createForm.title}
                                content={createForm.content || '<p></p>'}
                                onTitleChange={(title) => setCreateForm((prev) => ({ ...prev, title }))}
                                onContentChange={(content) => setCreateForm((prev) => ({ ...prev, content }))}
                                onSubmit={handleCreatePost}
                                onCancel={() => {
                                    setShowEditor(false);
                                    setCreateForm({ title: '', content: '<p></p>' });
                                }}
                                isSubmitting={isCreating}
                            />
                        </div>
                    )}
                    {postsLoading ? (
                        <div className='flex items-center justify-center py-8'>
                            <Lottie animationData={LoadingImage} loop={true} />
                        </div>
                    ) : posts.length === 0 ? (
                        <p className='py-8 text-center text-stone-600 dark:text-stone-400'>Chưa có bài viết nào</p>
                    ) : (
                        <>
                            <div className='flex flex-col gap-4'>
                                {posts.map((post) => (
                                    <div key={post.id} className='rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900'>
                                        {editingPostId === post.id ? (
                                            <div className='mb-4'>
                                                <Wysiwyg
                                                    title={editForm.title}
                                                    content={editForm.content || '<p></p>'}
                                                    onTitleChange={(title) => setEditForm((prev) => ({ ...prev, title }))}
                                                    onContentChange={(content) => setEditForm((prev) => ({ ...prev, content }))}
                                                    onSubmit={handleUpdatePost}
                                                    onCancel={() => {
                                                        setEditingPostId(null);
                                                        setEditForm({ title: '', content: '' });
                                                    }}
                                                    isSubmitting={isUpdating}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <div className='mb-3 flex items-start justify-between gap-3'>
                                                    <div className='flex-1 cursor-pointer' onClick={() => navigate(paths.blogDetail.replace(':id', post.id))}>
                                                        <p className='mb-2 text-lg font-semibold text-stone-900 dark:text-stone-100'>{post.title}</p>
                                                        <p className='mb-3 line-clamp-2 text-sm text-stone-700 dark:text-stone-300'>{extractTextFromHTML(post.content)}</p>
                                                    </div>
                                                    {isOwnProfile && (
                                                        <div className='flex shrink-0 gap-2' onClick={(e) => e.stopPropagation()}>
                                                            <button type='button' onClick={() => handleEditPost(post)} className='rounded-lg p-2 text-stone-600 transition-colors hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-800' title='Sửa bài viết'>
                                                                <FontAwesomeIcon icon={faPencilAlt} />
                                                            </button>
                                                            <button type='button' onClick={() => handleDeletePost(post.id)} disabled={deletingPostId === post.id} className='rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 disabled:opacity-50 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-300' title='Xóa bài viết'>
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className='flex items-center justify-between text-xs text-stone-500 dark:text-stone-400'>
                                                    <div className='flex items-center gap-4'>
                                                        <span>{formatVietnamDate(post.created_at)}</span>
                                                        <div className='flex items-center gap-1'>
                                                            <FontAwesomeIcon icon={faComment} />
                                                            <span>{post._count.comments}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {pagination && pagination.totalPages > 1 && (
                                <div className='mt-6 flex justify-center'>
                                    <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPrevPage={() => setCurrentPage((prev) => Math.max(1, prev - 1))} onNextPage={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))} hasPrevPage={pagination.hasPrevPage} hasNextPage={pagination.hasNextPage} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default User;
