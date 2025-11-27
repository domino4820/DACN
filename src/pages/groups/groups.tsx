import EmptyGroupImage from '@/assets/lottie/404-v2.json';
import LoadingImage from '@/assets/lottie/loading.json';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Pagination from '@/components/ui/pagination';
import Textarea from '@/components/ui/textarea';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import { useAuthStore } from '@/store/auth.store';
import api from '@/utils/api';
import { faPlus, faRightFromBracket, faRightToBracket, faUserGroup, faUsers, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isAxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';

type Group = {
    id: string;
    name: string;
    description: string | null;
    _count: {
        members: number;
    };
    isMember?: boolean;
    myRole?: string;
    joinedAt?: string;
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
    pagination: Pagination;
    error?: string;
}

const Groups: FC = () => {
    const { isAuthenticated } = useAuthStore();
    const loadingRef = useRef<HTMLDivElement>(null);
    const [groups, setGroups] = useState<Group[]>([]);
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

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', description: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [leavingGroupId, setLeavingGroupId] = useState<string | null>(null);
    const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

    const navigate = useNavigate();

    const fetchGroups = async (page: number) => {
        try {
            if (groups.length === 0) {
                setLoading(true);
            }

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10'
            });

            const response = await api.get<ApiResponse<Group[]>>(`${apiEndpoints.public.groups}?${params.toString()}`);

            const { data, pagination: newPagination } = response.data;

            setGroups(data);
            setPagination(newPagination);
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
        fetchGroups(pagination.currentPage);
    }, [pagination.currentPage]);

    useEffect(() => {
        if (loadingRef.current) {
            console.log(loadingRef.current.clientHeight);
            setHeight(loadingRef.current.clientHeight);
        }
    }, [loadingRef.current]);

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({ ...prev, currentPage: page }));
    };

    const handleViewGroup = (groupId: string) => {
        navigate(`/groups/${groupId}`);
    };

    const handleCreateGroup = async () => {
        if (!createForm.name.trim()) {
            toast.error('Tên nhóm là bắt buộc');
            return;
        }

        try {
            setIsCreating(true);
            await api.post(apiEndpoints.me.groups, createForm);
            toast.success('Tạo nhóm thành công');
            setIsCreateModalOpen(false);
            setCreateForm({ name: '', description: '' });

            fetchGroups(1);
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleLeaveGroup = async (groupId: string) => {
        try {
            setLeavingGroupId(groupId);
            await api.post(`${apiEndpoints.me.groups}/${groupId}/leave`);
            toast.success('Đã rời nhóm thành công');
            fetchGroups(pagination.currentPage);
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setLeavingGroupId(null);
        }
    };

    const handleJoinGroup = async (groupId: string) => {
        try {
            setJoiningGroupId(groupId);
            await api.post(`${apiEndpoints.me.groups}/${groupId}/join`);
            toast.success('Đã tham gia nhóm thành công');
            fetchGroups(pagination.currentPage);
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setJoiningGroupId(null);
        }
    };

    if (loading && groups.length === 0) {
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
            <div className='mb-6 flex shrink-0 flex-col gap-4'>
                <div className='flex shrink-0 flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
                    <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-700'>
                            <FontAwesomeIcon icon={faUserGroup} className='text-stone-600 dark:text-stone-400' />
                        </div>
                        <div>
                            <p className='text-2xl font-bold text-stone-900 dark:text-stone-100'>Danh sách nhóm</p>
                            <p className='text-sm text-stone-600 dark:text-stone-400'>Kết nối và thảo luận cùng cộng đồng</p>
                        </div>
                    </div>
                    {isAuthenticated && (
                        <Button onClick={() => setIsCreateModalOpen(true)} className='flex items-center gap-2'>
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Tạo nhóm</span>
                        </Button>
                    )}
                </div>
            </div>

            <div className={`flex-1 ${groups.length > 0 ? 'overflow-y-auto' : ''}`}>
                {!loading && groups.length === 0 ? (
                    <>
                        <div className='mb-4 w-full text-center'>
                            <p className='text-lg font-medium text-stone-600 dark:text-stone-400'>Hiện tại chưa có nhóm nào.</p>
                            {isAuthenticated && <p className='mt-2 text-sm text-stone-500 dark:text-stone-400'>Hãy là người đầu tiên tạo nhóm!</p>}
                        </div>
                        <div className='mx-auto w-full max-w-md'>
                            <Lottie animationData={EmptyGroupImage} loop={true} className='h-full w-full' />
                        </div>
                    </>
                ) : (
                    <div className='mb-4 flex flex-col gap-3'>
                        {groups.map((group) => {
                            const isOwner = group.myRole === 'OWNER';
                            const isSolo = group._count.members === 1;
                            const canLeave = !isOwner || isSolo;
                            const canView = Boolean(group.isMember);

                            return (
                                <button
                                    key={group.id}
                                    className={`w-full ${canView ? 'cursor-pointer hover:border-stone-300 hover:shadow-md dark:hover:border-stone-600' : 'cursor-default'} overflow-hidden rounded-lg border border-stone-200 bg-white p-4 text-left shadow-sm transition-all dark:border-stone-700 dark:bg-stone-800`}
                                    onClick={() => {
                                        if (!canView) return;
                                        handleViewGroup(group.id);
                                    }}
                                >
                                    <div className='flex items-center gap-4'>
                                        <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-700'>
                                            <span className='text-lg font-bold text-stone-800 dark:text-stone-100'>{group.name.charAt(0).toUpperCase()}</span>
                                        </div>

                                        <div className='flex flex-1 flex-col overflow-hidden'>
                                            <div className='flex items-center justify-between gap-2'>
                                                <p className='truncate text-lg font-bold text-stone-900 group-hover:text-stone-700 dark:text-stone-100 dark:group-hover:text-stone-300'>{group.name}</p>
                                            </div>
                                            <p className='truncate text-sm text-stone-600 dark:text-stone-400'>{group.description || 'Chưa có mô tả'}</p>
                                        </div>

                                        <div className='flex shrink-0 flex-col items-end gap-2'>
                                            <div className='flex items-center text-xs text-stone-500 dark:text-stone-400'>
                                                <FontAwesomeIcon icon={faUsers} className='mr-1.5' />
                                                <span className='font-medium'>{group._count.members} thành viên</span>
                                            </div>
                                            {isAuthenticated &&
                                                (group.isMember ? (
                                                    <Button
                                                        variant='outline'
                                                        className='h-8 shrink-0 px-3 text-xs'
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (!canLeave) {
                                                                toast.error(MESSAGES.groupOwnerMustTransfer || 'Owner phải chuyển quyền trước khi rời nhóm');
                                                                return;
                                                            }
                                                            handleLeaveGroup(group.id);
                                                        }}
                                                        disabled={leavingGroupId === group.id}
                                                        title={canLeave ? 'Rời nhóm' : 'Không thể rời nhóm'}
                                                    >
                                                        <FontAwesomeIcon icon={faRightFromBracket} className='mr-1.5' />
                                                        {leavingGroupId === group.id ? 'Đang rời...' : 'Rời nhóm'}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant='outline'
                                                        className='h-8 shrink-0 px-3 text-xs'
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleJoinGroup(group.id);
                                                        }}
                                                        disabled={joiningGroupId === group.id}
                                                    >
                                                        <FontAwesomeIcon icon={faRightToBracket} className='mr-1.5' />
                                                        {joiningGroupId === group.id ? 'Đang tham gia...' : 'Tham gia'}
                                                    </Button>
                                                ))}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {pagination.totalPages > 1 && (
                <div className='mt-auto flex justify-center'>
                    <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPrevPage={() => handlePageChange(pagination.currentPage - 1)} onNextPage={() => handlePageChange(pagination.currentPage + 1)} hasPrevPage={pagination.hasPrevPage} hasNextPage={pagination.hasNextPage} />
                </div>
            )}

            {isCreateModalOpen && (
                <div className='animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm duration-200'>
                    <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-stone-800'>
                        <div className='mb-4 flex items-center justify-between'>
                            <p className='text-xl font-bold text-stone-900 dark:text-stone-100'>Tạo nhóm mới</p>
                            <button onClick={() => setIsCreateModalOpen(false)} className='text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'>
                                <FontAwesomeIcon icon={faXmark} className='text-xl' />
                            </button>
                        </div>

                        <div className='flex flex-col gap-4'>
                            <div>
                                <Input value={createForm.name} onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))} placeholder='Tên nhóm (bắt buộc)' />
                            </div>
                            <div>
                                <Textarea value={createForm.description} onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))} placeholder='Mô tả về nhóm của bạn...' rows={3} />
                            </div>

                            <div className='mt-2 flex justify-end gap-3'>
                                <Button variant='outline' onClick={() => setIsCreateModalOpen(false)} disabled={isCreating}>
                                    Hủy
                                </Button>
                                <Button onClick={handleCreateGroup} disabled={isCreating}>
                                    {isCreating ? 'Đang tạo...' : 'Tạo nhóm'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Groups;
