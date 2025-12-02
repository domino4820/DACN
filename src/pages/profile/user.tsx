import CoverImage2 from '@/assets/lottie/cover-2.json';
import CoverImage from '@/assets/lottie/cover.json';
import LoadingImage from '@/assets/lottie/loading.json';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import paths from '@/config/paths';
import { useAuthStore } from '@/store/auth.store';
import api from '@/utils/api';
import { getErrorMessage } from '@/utils/error-handler';
import { faFacebook, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCalendarAlt, faEnvelope, faUser } from '@fortawesome/free-solid-svg-icons';
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

const User: FC = () => {
    const { username } = useParams<{ username: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const loadingRef = useRef<HTMLDivElement>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [height, setHeight] = useState<number>(0);

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
                    setTimeout(() => navigate(paths.root), 2000);
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

    useEffect(() => {
        fetchUserProfile();
    }, [username]);

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
                    <p className='mb-4 text-xl font-bold text-stone-900 dark:text-stone-100'>Bài viết</p>
                    <div className='flex flex-col gap-4'></div>
                </div>
            </div>
        </>
    );
};

export default User;
