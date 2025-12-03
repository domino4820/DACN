import CommentImage from '@/assets/lottie/comment.json';
import LoadingImage from '@/assets/lottie/loading.json';
import Wysiwyg from '@/components/common/wysiwyg';
import Breadcrumb, { type BreadcrumbItem } from '@/components/ui/breadcrumb';
import Button from '@/components/ui/button';
import Textarea from '@/components/ui/textarea';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import paths from '@/config/paths';
import { useAuthStore } from '@/store/auth.store';
import api from '@/utils/api';
import { faBook, faCalendarAlt, faComment, faFileText, faPaperPlane, faPencilAlt, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AxiosError, isAxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';

interface PostUser {
    username: string;
    profile: {
        name: string | null;
        avatar_url: string | null;
    } | null;
}

interface PostComment {
    id: string;
    content: string;
    created_at: string;
    user: {
        username: string;
        profile: {
            name: string | null;
            avatar_url: string | null;
        } | null;
    };
}

interface Post {
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    user: PostUser;
    comments: PostComment[];
    _count: {
        comments: number;
    };
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

const BlogDetail: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user: currentUser } = useAuthStore();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [commentContent, setCommentContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', content: '' });
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const fetchPost = async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);
            const response = await api.get<ApiResponse<Post>>(apiEndpoints.public.postDetail(id));

            if (response.data.success && response.data.data) {
                setPost(response.data.data);
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
                    setError('Post không tồn tại');
                    toast.error('Post không tồn tại');
                    setTimeout(() => navigate(paths.blog), 2000);
                } else {
                    setError(errorMsg);
                    toast.error(errorMsg);
                }
            } else {
                setError(MESSAGES.internalServerError);
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPost();
    }, [id]);

    const handleCreateComment = async () => {
        if (!id || !commentContent.trim() || !isAuthenticated) return;

        try {
            setIsSubmitting(true);
            const response = await api.post<ApiResponse<PostComment>>(apiEndpoints.me.createPostComment(id), {
                content: commentContent.trim()
            });

            if (response.data.success) {
                setCommentContent('');
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                }
                await fetchPost();
            }
        } catch (err) {
            if (isAxiosError(err)) {
                const errorMsg = err.response?.data?.error || MESSAGES.internalServerError;
                toast.error(errorMsg);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditPost = () => {
        if (!post) return;
        setIsEditing(true);
        setEditForm({ title: post.title, content: post.content });
    };

    const handleUpdatePost = async () => {
        if (!id || !editForm.title.trim() || !editForm.content.trim() || editForm.content === '<p></p>') {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            setIsUpdating(true);
            const response = await api.put<ApiResponse<Post>>(apiEndpoints.me.updatePost(id), {
                title: editForm.title.trim(),
                content: editForm.content.trim()
            });

            if (response.data.success) {
                setIsEditing(false);
                setEditForm({ title: '', content: '' });
                await fetchPost();
            } else {
                const errorMsg = response.data.error || MESSAGES.internalServerError;
                toast.error(errorMsg);
            }
        } catch (err) {
            if (isAxiosError(err)) {
                const errorMsg = err.response?.data?.error || MESSAGES.internalServerError;
                toast.error(errorMsg);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeletePost = async () => {
        if (!id) return;
        if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;

        try {
            setIsDeleting(true);
            const response = await api.delete<ApiResponse<null>>(apiEndpoints.me.deletePost(id));

            if (response.data.success) {
                toast.success('Đã xóa bài viết');
                navigate(paths.blog);
            } else {
                const errorMsg = response.data.error || MESSAGES.internalServerError;
                toast.error(errorMsg);
            }
        } catch (err) {
            if (isAxiosError(err)) {
                const errorMsg = err.response?.data?.error || MESSAGES.internalServerError;
                toast.error(errorMsg);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'vừa xong';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatFullDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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

    if (error || !post) {
        return (
            <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white p-4 shadow-lg duration-700 dark:bg-stone-800'>
                <div className='w-full p-4 text-center'>
                    <div className='mb-4 inline-flex items-center justify-center gap-3 rounded-full bg-stone-100 px-4 py-2 dark:bg-stone-700'>
                        <span className='text-2xl font-bold text-stone-800 dark:text-stone-200'>Lỗi</span>
                    </div>
                    <p className='text-lg font-semibold text-stone-900 dark:text-stone-100'>{error || MESSAGES.internalServerError}</p>
                    <p className='mt-4 text-sm text-stone-600 dark:text-stone-400'>Vui lòng thử lại sau hoặc quay lại trang chủ</p>
                </div>
            </div>
        );
    }

    const breadcrumbItems: BreadcrumbItem[] = [
        {
            label: 'Blog',
            href: paths.blog,
            icon: <FontAwesomeIcon icon={faBook} />
        },
        {
            label: post.user.profile?.name || post.user.username,
            href: `/profile/${post.user.username}`,
            icon: <FontAwesomeIcon icon={faUser} />
        },
        {
            label: post.title,
            icon: <FontAwesomeIcon icon={faFileText} />,
            isActive: true
        }
    ];

    return (
        <article className='flex w-full max-w-4xl flex-1 flex-col'>
            <Breadcrumb items={breadcrumbItems} className='mb-4' />
            <div className='flex flex-col gap-4'>
                <header className='flex flex-col gap-4'>
                    <div className='flex items-start justify-between gap-4'>
                        {isEditing ? null : <p className='mb-4 text-3xl leading-tight font-bold text-stone-900 dark:text-stone-100'>{post.title}</p>}
                        {!isEditing && currentUser?.username === post.user.username && (
                            <div className='flex shrink-0 gap-2'>
                                <button type='button' onClick={handleEditPost} className='rounded-lg p-2 text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700' title='Sửa bài viết'>
                                    <FontAwesomeIcon icon={faPencilAlt} />
                                </button>
                                <button type='button' onClick={handleDeletePost} disabled={isDeleting} className='rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 disabled:opacity-50 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-300' title='Xóa bài viết'>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className='flex flex-wrap items-center gap-4 border-b border-stone-200 pb-4 dark:border-stone-700'>
                        <div onClick={() => navigate(`/profile/${post.user.username}`)} className='flex cursor-pointer items-center gap-4'>
                            {post.user.profile?.avatar_url ? (
                                <img src={post.user.profile.avatar_url} alt={post.user.username} className='h-12 w-12 rounded-full border-2 border-stone-200 object-cover dark:border-stone-700' />
                            ) : (
                                <div className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-700'>
                                    <FontAwesomeIcon icon={faUser} className='text-stone-600 dark:text-stone-400' />
                                </div>
                            )}
                            <div className='flex flex-col'>
                                <span className='font-semibold text-stone-900 dark:text-stone-100'>{post.user.profile?.name || post.user.username}</span>
                                <span className='text-sm text-stone-500 dark:text-stone-400'>@{post.user.username}</span>
                            </div>
                        </div>

                        <div className='h-6 w-px bg-stone-300 dark:bg-stone-600' />

                        <div className='flex flex-wrap items-center gap-4 text-sm text-stone-600 dark:text-stone-400'>
                            <div className='flex items-center gap-4'>
                                <FontAwesomeIcon icon={faCalendarAlt} className='h-4 w-4' />
                                <time dateTime={post.created_at}>{formatFullDate(post.created_at)}</time>
                            </div>
                            <div className='flex items-center gap-4'>
                                <FontAwesomeIcon icon={faComment} className='h-4 w-4' />
                                <span>{post._count.comments} bình luận</span>
                            </div>
                        </div>
                    </div>
                </header>

                {isEditing ? (
                    <div className='rounded-lg border border-stone-200 bg-white p-4 shadow-lg dark:border-stone-700 dark:bg-stone-800'>
                        <Wysiwyg
                            title={editForm.title}
                            content={editForm.content || '<p></p>'}
                            onTitleChange={(title) => setEditForm((prev) => ({ ...prev, title }))}
                            onContentChange={(content) => setEditForm((prev) => ({ ...prev, content }))}
                            onSubmit={handleUpdatePost}
                            onCancel={() => {
                                setIsEditing(false);
                                setEditForm({ title: '', content: '' });
                            }}
                            isSubmitting={isUpdating}
                        />
                    </div>
                ) : (
                    <div className='prose prose-stone dark:prose-invert max-w-none [&_a]:text-stone-600 [&_a]:underline [&_a]:hover:text-stone-900 [&_a]:dark:text-stone-400 [&_a]:dark:hover:text-stone-100 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-stone-400 [&_blockquote]:bg-stone-50 [&_blockquote]:py-2 [&_blockquote]:pl-6 [&_blockquote]:text-stone-600 [&_blockquote]:italic [&_blockquote]:dark:bg-stone-900/50 [&_blockquote]:dark:text-stone-400 [&_code]:rounded [&_code]:bg-stone-100 [&_code]:px-2 [&_code]:py-1 [&_code]:font-mono [&_code]:text-sm [&_code]:text-stone-800 [&_code]:dark:bg-stone-800 [&_code]:dark:text-stone-200 [&_em]:italic [&_img]:my-4 [&_img]:h-auto [&_img]:w-full [&_li]:leading-relaxed [&_li]:text-stone-700 [&_li]:dark:text-stone-300 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-8 [&_p]:my-4 [&_p]:leading-relaxed [&_p]:text-stone-700 [&_p]:dark:text-stone-300 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-stone-900 [&_pre]:p-4 [&_pre]:text-stone-100 [&_pre]:shadow-lg [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-sm [&_strong]:font-bold [&_strong]:text-stone-900 [&_strong]:dark:text-stone-100 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-8' dangerouslySetInnerHTML={{ __html: post.content }} />
                )}
            </div>

            {!isEditing && (
                <div className='mt-4 rounded-xl border border-stone-200 bg-white p-4 shadow-lg dark:border-stone-700 dark:bg-stone-800'>
                    <div className='mb-4 flex items-center gap-4 border-b border-stone-200 pb-4 dark:border-stone-700'>
                        <FontAwesomeIcon icon={faComment} className='h-5 w-5 text-stone-600 dark:text-stone-400' />
                        <p className='text-lg font-bold text-stone-900 dark:text-stone-100'>Bình luận ({post._count.comments})</p>
                    </div>

                    {isAuthenticated && (
                        <form
                            className='relative my-4 flex items-end gap-2'
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleCreateComment();
                            }}
                        >
                            <Textarea
                                ref={textareaRef}
                                value={commentContent}
                                onChange={(e) => {
                                    setCommentContent(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleCreateComment();
                                    }
                                }}
                                placeholder='Chia sẻ suy nghĩ của bạn...'
                                className='max-h-32 flex-1 resize-none overflow-y-auto rounded-2xl border-0 bg-stone-100 px-4 py-3 text-sm text-stone-900 outline-hidden transition-all placeholder:text-stone-500 focus:ring-2 focus:ring-stone-500 dark:bg-stone-900 dark:text-white dark:placeholder:text-stone-500'
                                rows={1}
                                disabled={isSubmitting}
                            />
                            <Button type='submit' variant='outline' className='mb-0.5 h-10 w-10 shrink-0 rounded-full p-0' disabled={!commentContent.trim() || isSubmitting}>
                                <FontAwesomeIcon icon={faPaperPlane} />
                            </Button>
                        </form>
                    )}

                    {post.comments.length === 0 ? (
                        <div className='flex flex-col items-center justify-center py-4'>
                            <Lottie animationData={CommentImage} loop={true} className='h-32 w-32' />
                            <p className='mt-4 text-sm text-stone-600 dark:text-stone-400'>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            {post.comments.map((comment) => (
                                <div key={comment.id} className='flex gap-4 rounded-lg border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900/50'>
                                    <div className='h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800'>
                                        {comment.user.profile?.avatar_url ? (
                                            <img src={comment.user.profile.avatar_url} alt={comment.user.username} className='h-full w-full object-cover' />
                                        ) : (
                                            <div className='flex h-full w-full items-center justify-center'>
                                                <FontAwesomeIcon icon={faUser} className='text-stone-600 dark:text-stone-400' />
                                            </div>
                                        )}
                                    </div>
                                    <div className='flex-1'>
                                        <div>
                                            <span className='font-semibold text-stone-900 dark:text-stone-100'>{comment.user.profile?.name || comment.user.username}</span>
                                            <span className='ml-2 text-xs text-stone-500 dark:text-stone-400'>{formatDate(comment.created_at)}</span>
                                        </div>
                                        <p className='leading-relaxed whitespace-pre-wrap text-stone-700 dark:text-stone-300'>{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </article>
    );
};

export default BlogDetail;
