import CommentImage from '@/assets/lottie/comment.json';
import LoadingImage from '@/assets/lottie/loading.json';
import RoadmapFlow from '@/components/common/roadmap-flow';
import Button from '@/components/ui/button';
import Pagination from '@/components/ui/pagination';
import Textarea from '@/components/ui/textarea';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import paths from '@/config/paths';
import { useAuthStore } from '@/store/auth.store';
import api from '@/utils/api';
import { faComment, faTimes, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { Edge, Node } from '@xyflow/react';
import { isAxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';

type Topic = {
    id: string;
    name: string;
};

type RoadmapNodeData = {
    id: string;
    roadmap_id: string;
    position_x: number;
    position_y: number;
    node_type: string;
    label: string;
    content?: string;
    level: 'REQUIRED' | 'OPTIONAL';
    data?: {
        data?: {
            level?: 'REQUIRED' | 'OPTIONAL';
        };
    };
};

type RoadmapEdgeData = {
    id: string;
    roadmap_id: string;
    source_id: string;
    target_id: string;
};

type UserProgress = {
    currentNodeId: string | null;
    currentNode: {
        id: string;
        label: string;
    } | null;
    completedNodeIds: string[];
    progress: {
        completed: number;
        total: number;
        percentage: number;
    };
};

type Roadmap = {
    id: string;
    name: string;
    description: string | null;
    roadmap_topics: {
        topic: Topic;
    }[];
    _count: {
        nodes: number;
        user_paths: number;
    };
    nodes: RoadmapNodeData[];
    edges: RoadmapEdgeData[];
    userProgress?: UserProgress;
};

type Comment = {
    id: string;
    roadmapId: string;
    content: string;
    createdAt: string;
    user: {
        username: string;
        name: string | null;
        avatarUrl: string | null;
    };
};

type CommentsPagination = {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};

const RoadmapDetail: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [loading, setLoading] = useState(true);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [pagination, setPagination] = useState<CommentsPagination>({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [commentContent, setCommentContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
    const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);

    const fetchRoadmap = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const response = await api.get(`${apiEndpoints.public.roadmaps}/${id}`);

            if (response.data.success) {
                const roadmapData = response.data.data;
                setRoadmap(roadmapData);

                const flowNodes = roadmapData.nodes.map((node: RoadmapNodeData): Node => {
                    const nodeData = node.data;
                    const isLearning = roadmapData.userProgress?.currentNodeId === node.id;
                    const isCompleted = roadmapData.userProgress?.completedNodeIds.includes(node.id) || false;

                    if (nodeData && typeof nodeData === 'object') {
                        const level = nodeData.data?.level || node.level || 'OPTIONAL';
                        return {
                            id: node.id,
                            type: 'roadmapNode',
                            position: { x: node.position_x, y: node.position_y },
                            data: {
                                label: node.label,
                                content: node.content || '',
                                level: level,
                                deletable: true,
                                isLearning,
                                isCompleted
                            },
                            className: level === 'REQUIRED' ? 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border-2! border-stone-900! dark:border-stone-300! text-black! dark:text-white! cursor-pointer!' : 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border! border-stone-300! dark:border-stone-600! text-black! dark:text-white! cursor-pointer!'
                        };
                    }

                    const level = node.level || 'OPTIONAL';
                    return {
                        id: node.id,
                        type: 'roadmapNode',
                        position: { x: node.position_x, y: node.position_y },
                        data: {
                            label: node.label,
                            content: node.content || '',
                            level: level,
                            deletable: true,
                            isLearning,
                            isCompleted
                        },
                        className: level === 'REQUIRED' ? 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border-2! border-stone-900! dark:border-stone-300! text-black! dark:text-white! cursor-pointer!' : 'shadow-md! rounded-md! bg-white! dark:bg-stone-800! border! border-stone-300! dark:border-stone-600! text-black! dark:text-white! cursor-pointer!'
                    };
                });

                const flowEdges = roadmapData.edges.map((edge: RoadmapEdgeData) => ({
                    id: edge.id,
                    source: edge.source_id,
                    target: edge.target_id,
                    type: 'smoothstep',
                    markerEnd: undefined
                }));

                setNodes(flowNodes);
                setEdges(flowEdges);
            } else {
                toast.error(response.data.error || MESSAGES.internalServerError);
                navigate(paths.roadmaps);
            }
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
            navigate(paths.roadmaps);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoadmap();
    }, [id]);

    useEffect(() => {
        if (id && isAuthenticated) {
            fetchComments(1);
        } else if (!isAuthenticated) {
            setComments([]);
            setPagination({
                currentPage: 1,
                totalPages: 1,
                totalCount: 0,
                limit: 10,
                hasNextPage: false,
                hasPrevPage: false
            });
        }
    }, [id, isAuthenticated]);

    const fetchComments = async (page: number) => {
        if (!id || !isAuthenticated) return;

        try {
            setCommentsLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10'
            });
            const response = await api.get(`${apiEndpoints.me.roadmapComments(id)}?${params.toString()}`);

            if (response.data.success) {
                setComments(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || 'load comments fail');
            }
        } finally {
            setCommentsLoading(false);
        }
    };

    const handleCreateComment = async () => {
        if (!id || !commentContent.trim() || !isAuthenticated) return;

        try {
            setIsSubmitting(true);
            const response = await api.post(apiEndpoints.me.roadmapComments(id), {
                content: commentContent.trim()
            });

            if (response.data.success) {
                setCommentContent('');
                fetchComments(1);
            }
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || 'comment fail');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            setDeletingCommentId(commentId);
            const response = await api.delete(apiEndpoints.me.roadmapComment(commentId));

            if (response.data.success) {
                fetchComments(pagination.currentPage);
            }
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || 'xóa comment fail');
            }
        } finally {
            setDeletingCommentId(null);
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

    const handleBackToList = () => {
        navigate(paths.roadmaps);
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

    if (!roadmap) {
        return (
            <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800'>
                <div className='w-full p-4'>
                    <div className='flex items-center justify-center'>
                        <div className='text-stone-500'>Không tìm thấy roadmap</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='relative flex w-full max-w-4xl flex-1 flex-col items-center justify-center rounded-lg bg-white p-4 shadow-lg duration-700 dark:bg-stone-800'>
            <RoadmapFlow
                name={roadmap.name}
                description={roadmap.description}
                topicIds={roadmap.roadmap_topics.map((t) => t.topic.id)}
                onSave={() => {}}
                onCancel={handleBackToList}
                roadmapId={roadmap.id}
                viewOnly={true}
                nodes={nodes}
                edges={edges}
                userProgress={roadmap.userProgress}
                onNodeStatusChange={() => {
                    fetchRoadmap();
                }}
                headerActions={
                    isAuthenticated ? (
                        <Button variant='outline' onClick={() => setIsCommentDrawerOpen(true)} className='h-9 w-9 rounded-full border-none p-0 shadow-none hover:bg-stone-300 dark:hover:bg-stone-700'>
                            <FontAwesomeIcon icon={faComment} className='text-stone-600 dark:text-stone-400' />
                        </Button>
                    ) : undefined
                }
            />

            {isCommentDrawerOpen && (
                <div className='absolute inset-0 z-50 flex justify-end overflow-hidden'>
                    <div className='animate-in slide-in-from-right relative flex h-full w-96 flex-col border-l border-stone-200 bg-white shadow-2xl duration-300 dark:border-stone-700 dark:bg-stone-800'>
                        <div className='flex shrink-0 items-center justify-between border-b border-stone-200 p-4 dark:border-stone-700'>
                            <div className='font-bold text-stone-900 dark:text-stone-100'>Bình luận ({pagination.totalCount})</div>
                            <Button variant='outline' onClick={() => setIsCommentDrawerOpen(false)} className='h-8 w-8 rounded-full border-none p-0 shadow-none hover:bg-stone-300 dark:hover:bg-stone-700'>
                                <FontAwesomeIcon icon={faTimes} />
                            </Button>
                        </div>

                        {isAuthenticated && (
                            <div className='shrink-0 space-y-2 border-b border-stone-200 p-4 dark:border-stone-700'>
                                <Textarea value={commentContent} onChange={(e) => setCommentContent(e.target.value)} placeholder='Viết bình luận...' rows={3} className='resize-none' />
                                <div className='flex justify-end'>
                                    <Button onClick={handleCreateComment} disabled={!commentContent.trim() || isSubmitting}>
                                        {isSubmitting ? 'Đang gửi...' : 'Gửi'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className='flex-1 overflow-hidden'>
                            <div className='h-full overflow-y-auto p-4'>
                                {commentsLoading ? (
                                    <></>
                                ) : comments.length === 0 ? (
                                    <div className='flex flex-col items-center justify-center'>
                                        <Lottie animationData={CommentImage} loop={true} />
                                    </div>
                                ) : (
                                    <div className='space-y-4'>
                                        {comments.map((comment) => (
                                            <div key={comment.id} className='flex gap-3 rounded-lg border border-stone-200 p-3 dark:border-stone-700'>
                                                <div className='h-10 w-10 shrink-0 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700'>
                                                    {comment.user.avatarUrl ? (
                                                        <img src={comment.user.avatarUrl} alt={comment.user.username} className='h-full w-full object-cover' />
                                                    ) : (
                                                        <div className='flex h-full w-full items-center justify-center'>
                                                            <FontAwesomeIcon icon={faUser} className='text-stone-600 dark:text-stone-400' />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className='flex-1'>
                                                    <div className='mb-1 flex items-center justify-between'>
                                                        <div>
                                                            <span className='font-medium text-stone-800 dark:text-stone-200'>{comment.user.name || comment.user.username}</span>
                                                            <span className='ml-2 text-xs text-stone-400 dark:text-stone-500'>{formatDate(comment.createdAt)}</span>
                                                        </div>
                                                        {isAuthenticated && user?.username === comment.user.username && (
                                                            <button onClick={() => handleDeleteComment(comment.id)} disabled={deletingCommentId === comment.id} className='text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'>
                                                                <FontAwesomeIcon icon={faTrash} className='text-sm' />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className='text-sm whitespace-pre-wrap text-stone-700 dark:text-stone-300'>{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {pagination.totalPages > 1 && (
                            <div className='shrink-0 border-t border-stone-200 p-4 dark:border-stone-700'>
                                <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} hasPrevPage={pagination.hasPrevPage} hasNextPage={pagination.hasNextPage} onPrevPage={() => fetchComments(pagination.currentPage - 1)} onNextPage={() => fetchComments(pagination.currentPage + 1)} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoadmapDetail;
