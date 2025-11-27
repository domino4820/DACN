import LoadingImage from '@/assets/lottie/loading.json';
import Button from '@/components/ui/button';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import paths from '@/config/paths';
import api from '@/utils/api';
import { faChevronLeft, faCrown, faPaperPlane, faRightFromBracket, faTimes, faUserPlus, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isAxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';

type Member = {
    role: 'OWNER' | 'MEMBER';
    joined_at: string;
    user: {
        username: string;
        profile: {
            name: string | null;
            avatar_url: string | null;
        } | null;
    };
};

type Group = {
    id: string;
    name: string;
    description: string | null;
    members: Member[];
    isMember?: boolean;
    myRole?: string;
    joinedAt?: string;
};

const GroupDetails: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const loadingRef = useRef<HTMLDivElement>(null);

    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isMemberDrawerOpen, setIsMemberDrawerOpen] = useState(false);
    const [message, setMessage] = useState('');

    const fetchGroup = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const response = await api.get(`${apiEndpoints.me.groups}/${id}`);

            if (response.data.success) {
                setGroup(response.data.data);
            } else {
                toast.error(response.data.error || MESSAGES.groupNotFound);
                navigate(paths.groups);
            }
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
            navigate(paths.groups);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroup();
    }, [id]);

    const handleJoinGroup = async () => {
        if (!id || !group) return;

        try {
            setActionLoading(true);
            const response = await api.post(`${apiEndpoints.me.groups}/${id}/join`);

            if (response.data.success) {
                toast.success('Đã tham gia nhóm thành công');
                fetchGroup();
            }
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeaveGroup = async () => {
        if (!id || !group) return;

        if (group.myRole === 'OWNER' && group.members.length > 1) {
            toast.error(MESSAGES.groupOwnerMustTransfer);
            return;
        }
        try {
            setActionLoading(true);
            const response = await api.post(`${apiEndpoints.me.groups}/${id}/leave`);

            if (response.data.success) {
                toast.success('Đã rời nhóm');
                if (group.myRole === 'OWNER' && group.members.length === 1) {
                    navigate(paths.groups);
                } else {
                    fetchGroup();
                    setIsMemberDrawerOpen(false);
                }
            }
        } catch (err) {
            if (isAxiosError(err)) {
                toast.error(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                toast.error(MESSAGES.internalServerError);
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleBack = () => {
        navigate(paths.groups);
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

    if (!group) {
        return (
            <div className='flex w-full max-w-4xl flex-1 items-center justify-center rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800'>
                <div className='w-full p-4 text-center'>
                    <div className='text-stone-500'>{MESSAGES.groupNotFound}</div>
                </div>
            </div>
        );
    }

    return (
        <div className='relative flex w-full max-w-4xl flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800'>
            {}
            <div className='flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-700 dark:bg-stone-800'>
                <div className='flex items-center gap-3'>
                    <Button variant='outline' onClick={handleBack} className='h-9 w-9 rounded-full border-none p-0 shadow-none hover:bg-stone-100 dark:hover:bg-stone-700'>
                        <FontAwesomeIcon icon={faChevronLeft} className='text-stone-600 dark:text-stone-400' />
                    </Button>
                    <div className='flex flex-col'>
                        <div className='font-bold text-stone-900 dark:text-stone-100'>{group.name}</div>
                        <div className='text-xs text-stone-500 dark:text-stone-400'>{group.members.length} thành viên</div>
                    </div>
                </div>
                <div className='flex items-center'>
                    {!group.isMember && (
                        <Button onClick={handleJoinGroup} disabled={actionLoading} className='h-8 min-h-0 px-3 py-1 text-xs'>
                            <FontAwesomeIcon icon={faUserPlus} className='mr-2' />
                            Tham gia
                        </Button>
                    )}
                    <Button variant='outline' onClick={() => setIsMemberDrawerOpen(true)} className='h-9 w-9 rounded-full border-none p-0 shadow-none hover:bg-stone-100 dark:hover:bg-stone-700'>
                        <FontAwesomeIcon icon={faUsers} className='text-stone-600 dark:text-stone-400' />
                    </Button>
                </div>
            </div>

            {}
            <div className='flex-1 overflow-y-auto bg-stone-50 p-6 dark:bg-stone-900/50'>
                <div className='flex h-full flex-col items-center justify-center space-y-6 text-center'>
                    <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100 text-4xl font-bold text-stone-800 dark:bg-stone-700 dark:text-stone-100'>{group.name.charAt(0).toUpperCase()}</div>
                    <div className='max-w-md space-y-2'>
                        <div className='text-2xl font-bold text-stone-900 dark:text-stone-100'>Chào mừng đến với {group.name}</div>
                        <div className='text-stone-600 dark:text-stone-400'>{group.description || 'Nhóm này chưa có mô tả gì cả.'}</div>
                    </div>

                    {!group.isMember && (
                        <Button onClick={handleJoinGroup} disabled={actionLoading} className='mt-4'>
                            Tham gia ngay để bắt đầu trò chuyện
                        </Button>
                    )}
                </div>
            </div>

            {}
            {group.isMember && (
                <div className='shrink-0 border-t border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-800'>
                    <form
                        className='relative flex items-center gap-2'
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!message.trim()) return;
                            toast.success('Tính năng đang phát triển');
                            setMessage('');
                        }}
                    >
                        <input type='text' value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Nhắn tin cho #${group.name}...`} className='flex-1 rounded-full border-0 bg-stone-100 px-4 py-3 text-sm text-stone-900 outline-hidden transition-all placeholder:text-stone-500 focus:ring-2 focus:ring-stone-500 dark:bg-stone-900 dark:text-white dark:placeholder:text-stone-500' />
                        <Button type='submit' variant='outline' className='h-10 w-10 shrink-0 rounded-full p-0' disabled={!message.trim()}>
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </Button>
                    </form>
                </div>
            )}

            {}
            {isMemberDrawerOpen && (
                <div className='absolute inset-0 z-50 flex justify-end overflow-hidden'>
                    <div className='absolute inset-0 h-full w-full cursor-default bg-black/20 backdrop-blur-sm transition-opacity' />
                    <div className='animate-in slide-in-from-right relative flex h-full w-80 flex-col border-l border-stone-200 bg-white shadow-2xl duration-300 dark:border-stone-700 dark:bg-stone-800'>
                        <div className='flex shrink-0 items-center justify-between border-b border-stone-200 p-4 dark:border-stone-700'>
                            <div className='font-bold text-stone-900 dark:text-stone-100'>Thành viên</div>
                            <Button variant='outline' onClick={() => setIsMemberDrawerOpen(false)} className='h-8 w-8 rounded-full border-none p-0 shadow-none hover:bg-stone-300 dark:hover:bg-stone-700'>
                                <FontAwesomeIcon icon={faTimes} />
                            </Button>
                        </div>

                        <div className='flex-1 space-y-4 overflow-y-auto p-4'>
                            <div className='space-y-1'>
                                <div className='mb-2 text-xs font-semibold text-stone-500 uppercase dark:text-stone-500'>Danh sách ({group.members.length})</div>
                                {group.members.map((member) => (
                                    <div key={member.user.username} className='flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-stone-100 dark:hover:bg-stone-700/50'>
                                        <div className='relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700'>{member.user.profile?.avatar_url ? <img src={member.user.profile.avatar_url} alt='' className='h-full w-full object-cover' /> : <div className='flex h-full w-full items-center justify-center text-xs font-bold text-stone-600 dark:text-stone-300'>{(member.user.profile?.name || member.user.username).charAt(0)}</div>}</div>
                                        <div className='flex flex-1 flex-col overflow-hidden'>
                                            <div className='flex items-center gap-1.5'>
                                                <span className='truncate text-sm font-medium text-stone-900 dark:text-stone-100'>{member.user.profile?.name || member.user.username}</span>
                                                {member.role === 'OWNER' && <FontAwesomeIcon icon={faCrown} className='text-[10px] text-stone-500' />}
                                            </div>
                                            <span className='truncate text-xs text-stone-500 dark:text-stone-400'>@{member.user.username}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {group.isMember && (
                            <div className='shrink-0 border-t border-stone-200 p-4 dark:border-stone-700'>
                                <Button variant='outline' onClick={handleLeaveGroup} disabled={actionLoading} className='w-full justify-center'>
                                    <FontAwesomeIcon icon={faRightFromBracket} className='mr-2' />
                                    Rời nhóm
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupDetails;
