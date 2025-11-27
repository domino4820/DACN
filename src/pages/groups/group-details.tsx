import LoadingImage from '@/assets/lottie/loading.json';
import Button from '@/components/ui/button';
import Textarea from '@/components/ui/textarea';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import paths from '@/config/paths';
import { useAuthStore } from '@/store/auth.store';
import api from '@/utils/api';
import socketEvent from '@/utils/socket-event';
import { faChevronLeft, faCrown, faPaperPlane, faReply, faRightFromBracket, faTimes, faUserPlus, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isAxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';
import { type Socket, io } from 'socket.io-client';

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

type MessageUser = {
    username: string;
    name: string | null;
    avatarUrl: string | null;
};

type Message = {
    id: string;
    groupId: string;
    content: string;
    createdAt: string;
    user: MessageUser;
    replyToMessageId?: string | null;
    replyTo?: {
        id: string;
        content: string;
        user: MessageUser;
    } | null;
    replyCount?: number;
};

const GroupDetails: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const loadingRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [height, setHeight] = useState<number>(0);
    const { token, user } = useAuthStore();

    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isMemberDrawerOpen, setIsMemberDrawerOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (loadingRef.current) {
            setHeight(loadingRef.current.clientHeight);
        }
    }, [loadingRef.current]);

    const scrollToBottom = (smooth = true) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
        }
    };

    const scrollToMessage = (messageId: string) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-stone-100', 'dark:bg-stone-800/50');
            setTimeout(() => {
                element.classList.remove('bg-stone-100', 'dark:bg-stone-800/50');
            }, 1500);
        } else {
            toast.error('Tin nhắn gốc không có sẵn');
        }
    };

    const fetchMessages = async (isLoadMore = false) => {
        if (!id || (isLoadMore && !cursor)) return;

        try {
            const container = scrollContainerRef.current;
            const oldScrollHeight = container?.scrollHeight;
            const oldScrollTop = container?.scrollTop;

            const response = await api.get(`${apiEndpoints.me.groups}/${id}/messages`, {
                params: {
                    cursor: isLoadMore ? cursor : undefined,
                    limit: 20
                }
            });

            if (response.data.success) {
                const { items, nextCursor } = response.data.data as { items: Message[]; nextCursor: string | null };
                setCursor(nextCursor);
                setHasMore(!!nextCursor);

                const newMessages = [...items].reverse();

                if (isLoadMore) {
                    setMessages((prev) => [...newMessages, ...prev]);

                    setTimeout(() => {
                        if (container && oldScrollHeight) {
                            const newScrollHeight = container.scrollHeight;
                            container.scrollTop = newScrollHeight - oldScrollHeight + (oldScrollTop || 0);
                        }
                    }, 0);
                } else {
                    setMessages(newMessages);

                    setTimeout(() => {
                        scrollToBottom(false);
                        setIsInitialScrollDone(true);
                    }, 100);
                }
            }
        } catch {
            toast.error('Không thể tải tin nhắn');
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries?.[0]?.isIntersecting && hasMore && isInitialScrollDone) {
                    fetchMessages(true);
                }
            },
            { threshold: 1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, cursor, isInitialScrollDone]);

    useEffect(() => {
        if (!token) return;

        const newSocket = io('/', {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        newSocket.on(socketEvent.GROUP_MESSAGE_RECEIVED, (newMessage: Message) => {
            setMessages((prev) => {
                if (prev.some((m) => m.id === newMessage.id)) return prev;

                let msgToAdd = { ...newMessage };
                if (msgToAdd.replyToMessageId && !msgToAdd.replyTo) {
                    const parent = prev.find((m) => m.id === msgToAdd.replyToMessageId);
                    if (parent) {
                        msgToAdd.replyTo = {
                            id: parent.id,
                            content: parent.content,
                            user: parent.user
                        };
                    }
                }
                return [...prev, msgToAdd];
            });
            setTimeout(scrollToBottom, 100);
        });

        newSocket.on(socketEvent.ERROR, (err: any) => {
            toast.error(typeof err === 'string' ? err : 'Lỗi kết nối chat');
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token]);

    useEffect(() => {
        if (socket && id && group?.isMember) {
            socket.emit(socketEvent.JOIN_GROUP, { groupId: id });
        }
    }, [socket, id, group?.isMember]);

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
        setIsInitialScrollDone(false);
        setMessages([]);
        setCursor(null);
        setHasMore(false);
        fetchGroup();
        fetchMessages();
    }, [id]);

    useEffect(() => {
        if (!loading && messages.length > 0) {
            scrollToBottom(false);
        }
    }, [loading]);

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

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!message.trim() || !socket) return;

        if (replyingTo) {
            socket.emit(socketEvent.SEND_GROUP_MESSAGE_REPLY, {
                replyToMessageId: replyingTo.id,
                content: message
            });
            setReplyingTo(null);
        } else {
            socket.emit(socketEvent.SEND_GROUP_MESSAGE, {
                groupId: id,
                content: message
            });
        }
        setMessage('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
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
        <div
            className='relative flex w-full max-w-4xl flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-lg duration-700 dark:bg-stone-800'
            style={{
                height: height || undefined,
                maxHeight: height || undefined
            }}
            ref={loadingRef}
        >
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
            <div className='flex-1 overflow-y-auto bg-stone-50 p-6 dark:bg-stone-900/50' ref={scrollContainerRef}>
                {group.isMember ? (
                    messages.length === 0 ? (
                        <div className='flex h-full flex-col items-center justify-center space-y-4 text-center'>
                            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-stone-100 text-3xl font-bold text-stone-800 dark:bg-stone-700 dark:text-stone-100'>{group.name.charAt(0).toUpperCase()}</div>
                            <div className='text-stone-500 dark:text-stone-400'>Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!</div>
                        </div>
                    ) : (
                        <div className='flex flex-col space-y-4'>
                            <div ref={observerTarget} className='h-1' />
                            {hasMore && (
                                <div className='flex justify-center py-2'>
                                    <div className='h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600 dark:border-stone-700 dark:border-t-stone-400'></div>
                                </div>
                            )}
                            {messages.map((msg) => {
                                const isMe = msg.user.username === user?.username;
                                return (
                                    <div key={msg.id} id={`message-${msg.id}`} className={`flex px-2 py-1 transition-colors duration-500 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex max-w-[70%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className='h-8 w-8 shrink-0 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700'>{msg.user.avatarUrl ? <img src={msg.user.avatarUrl} alt='' className='h-full w-full object-cover' /> : <div className='flex h-full w-full items-center justify-center text-xs font-bold text-stone-600 dark:text-stone-300'>{(msg.user.name || msg.user.username).charAt(0)}</div>}</div>
                                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                <div className='mb-1 flex items-center gap-2'>
                                                    <span className='text-xs font-medium text-stone-600 dark:text-stone-400'>{msg.user.name || msg.user.username}</span>
                                                    <span className='text-[10px] text-stone-400'>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                {msg.replyTo && (
                                                    <button onClick={() => scrollToMessage(msg.replyTo!.id)} className='mb-1 flex cursor-pointer flex-col rounded-md border-l-2 border-stone-300 bg-stone-100/50 px-2 py-1 text-xs dark:border-stone-600 dark:bg-stone-800/50'>
                                                        <span className='font-bold text-stone-600 dark:text-stone-400'>{msg.replyTo.user.name || msg.replyTo.user.username}</span>
                                                        <span className='line-clamp-1 text-stone-500 dark:text-stone-500'>{msg.replyTo.content}</span>
                                                    </button>
                                                )}
                                                <div className='group relative'>
                                                    <div className={`rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${isMe ? 'bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-900' : 'bg-white text-stone-800 shadow-xs dark:bg-stone-800 dark:text-stone-100'}`}>{msg.content}</div>
                                                    <Button
                                                        variant='outline'
                                                        onClick={() => {
                                                            setReplyingTo(msg);
                                                            textareaRef.current?.focus();
                                                        }}
                                                        className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-none p-0 opacity-0 shadow-none transition-opacity group-hover:opacity-100 hover:bg-stone-200 dark:hover:bg-stone-800 ${isMe ? '-left-8' : '-right-8'}`}
                                                    >
                                                        <FontAwesomeIcon icon={faReply} className='text-stone-500' />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )
                ) : (
                    <div className='flex h-full flex-col items-center justify-center space-y-6 text-center'>
                        <div className='flex h-24 w-24 items-center justify-center rounded-full bg-stone-100 text-4xl font-bold text-stone-800 dark:bg-stone-700 dark:text-stone-100'>{group.name.charAt(0).toUpperCase()}</div>
                        <div className='max-w-md space-y-2'>
                            <div className='text-2xl font-bold text-stone-900 dark:text-stone-100'>Chào mừng đến với {group.name}</div>
                            <div className='text-stone-600 dark:text-stone-400'>{group.description || 'Nhóm này chưa có mô tả gì cả.'}</div>
                        </div>

                        <Button onClick={handleJoinGroup} disabled={actionLoading} className='mt-4'>
                            Tham gia ngay để bắt đầu trò chuyện
                        </Button>
                    </div>
                )}
            </div>

            {}
            {group.isMember && (
                <div className='shrink-0 border-t border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-800'>
                    {replyingTo && (
                        <div className='mb-2 flex items-center justify-between rounded-lg bg-stone-100 px-4 py-2 text-sm dark:bg-stone-900'>
                            <div className='flex items-center gap-2'>
                                <FontAwesomeIcon icon={faReply} className='text-stone-500' />
                                <span className='text-stone-600 dark:text-stone-400'>
                                    Đang trả lời <span className='font-bold'>{replyingTo.user.name || replyingTo.user.username}</span>
                                </span>
                            </div>
                            <Button variant='outline' onClick={() => setReplyingTo(null)} className='h-6 w-6 rounded-full border-none p-0 shadow-none hover:bg-stone-200 dark:hover:bg-stone-800'>
                                <FontAwesomeIcon icon={faTimes} className='text-stone-500' />
                            </Button>
                        </div>
                    )}
                    <form className='relative flex items-end gap-2' onSubmit={handleSendMessage}>
                        <Textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder={replyingTo ? `Trả lời ${replyingTo.user.name || replyingTo.user.username}...` : `Nhắn tin cho #${group.name}...`}
                            className='max-h-32 flex-1 resize-none overflow-y-auto rounded-2xl border-0 bg-stone-100 px-4 py-3 text-sm text-stone-900 outline-hidden transition-all placeholder:text-stone-500 focus:ring-2 focus:ring-stone-500 dark:bg-stone-900 dark:text-white dark:placeholder:text-stone-500'
                            rows={1}
                        />
                        <Button type='submit' variant='outline' className='mb-0.5 h-10 w-10 shrink-0 rounded-full p-0' disabled={!message.trim()}>
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </Button>
                    </form>
                </div>
            )}
            {isMemberDrawerOpen && (
                <div className='absolute inset-0 z-50 flex justify-end overflow-hidden'>
                    <div className='absolute inset-0 h-full w-full cursor-default bg-black/20 backdrop-blur-sm transition-opacity' />
                    <div className='animate-in slide-in-from-right relative flex h-full w-80 flex-col border-l border-stone-200 bg-white shadow-2xl duration-300 dark:border-stone-700 dark:bg-stone-800'>
                        <div className='flex shrink-0 items-center justify-between border-b border-stone-200 p-4 dark:border-stone-700'>
                            <div className='font-bold text-stone-900 dark:text-stone-100'>Thành viên ({group.members.length})</div>
                            <Button variant='outline' onClick={() => setIsMemberDrawerOpen(false)} className='h-8 w-8 rounded-full border-none p-0 shadow-none hover:bg-stone-300 dark:hover:bg-stone-700'>
                                <FontAwesomeIcon icon={faTimes} />
                            </Button>
                        </div>

                        <div className='flex-1 space-y-4 overflow-y-auto p-4'>
                            <div className='space-y-1'>
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
