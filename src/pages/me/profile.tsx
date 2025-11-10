import LoadingImage from '@/assets/lottie/loading.json';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import apiEndpoints from '@/config/api-endpoints';
import paths from '@/config/paths';
import { useAuthStore } from '@/store/auth.store';
import api from '@/utils/api';
import { faFacebook, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faCamera, faKey, faLock, faLockOpen, faPencilAlt, faSave, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AxiosError } from 'axios';
import Lottie from 'lottie-react';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
const Profile: FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, setFullUser } = useAuthStore();
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editedProfile, setEditedProfile] = useState({
        name: user?.profile?.name || '',
        bio: user?.profile?.bio || '',
        facebook: user?.profile?.facebook || '',
        github: user?.profile?.github || '',
        avatar_url: user?.profile?.avatar_url || ''
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!isAuthenticated) {
                navigate(paths.login);
                return;
            }

            try {
                setIsLoading(true);
                const response = await api.get(apiEndpoints.me.getProfile);

                if (response.data.success && response.data.data) {
                    setFullUser(response.data.data);
                }
            } catch (error) {
                if (error instanceof AxiosError && error.response?.status === 401) {
                    navigate(paths.login);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [isAuthenticated, navigate, setFullUser]);

    useEffect(() => {
        if (user?.profile) {
            setEditedProfile({
                name: user.profile.name || '',
                bio: user.profile.bio || '',
                facebook: user.profile.facebook || '',
                github: user.profile.github || '',
                avatar_url: user.profile.avatar_url || ''
            });
        }
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await api.patch(apiEndpoints.me.updateProfile, {
                name: editedProfile.name || undefined,
                bio: editedProfile.bio || undefined,
                facebook: editedProfile.facebook || undefined,
                github: editedProfile.github || undefined
            });

            if (response.data.success && user) {
                setFullUser({
                    ...user,
                    profile: {
                        ...user.profile,
                        ...response.data.data,
                        visibility: user.profile?.visibility || 'PUBLIC'
                    }
                });
                toast.success(response.data.message || 'Cập nhật hồ sơ thành công');
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.error || 'Lỗi máy chủ';
                toast.error(errorMessage);
            } else {
                toast.error('Lỗi máy chủ');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleVisibilityChange = async (newVisibility: 'PUBLIC' | 'GROUP_ONLY') => {
        try {
            const response = await api.patch(apiEndpoints.me.updateVisibility, { visibility: newVisibility });

            if (response.data.success && user) {
                setFullUser({
                    ...user,
                    profile: {
                        ...user.profile,
                        visibility: newVisibility,
                        name: user.profile?.name || null,
                        bio: user.profile?.bio || null,
                        avatar_url: user.profile?.avatar_url || null,
                        facebook: user.profile?.facebook || null,
                        github: user.profile?.github || null
                    }
                });
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.error || 'Lỗi máy chủ';
                toast.error(errorMessage);
            } else {
                toast.error('Lỗi máy chủ');
            }
        }
    };

    const handlePasswordChange = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        setIsSaving(true);
        try {
            const response = await api.patch(apiEndpoints.me.changePassword, {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword
            });

            if (response.data.success) {
                toast.success(response.data.message || 'Đổi mật khẩu thành công');
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setIsChangingPassword(false);
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.error || 'Lỗi máy chủ';
                toast.error(errorMessage);
            } else {
                toast.error('Lỗi máy chủ');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('File không hợp lệ');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File quá lớn');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await api.post(apiEndpoints.me.uploadAvatar, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success && user && response.data.data) {
                const avatarUrl = response.data.data.avatar_url;

                setFullUser({
                    ...user,
                    profile: {
                        ...user.profile,
                        avatar_url: avatarUrl,
                        name: user.profile?.name || null,
                        bio: user.profile?.bio || null,
                        facebook: user.profile?.facebook || null,
                        github: user.profile?.github || null,
                        visibility: user.profile?.visibility || 'PUBLIC'
                    }
                });
                setEditedProfile({
                    ...editedProfile,
                    avatar_url: avatarUrl
                });
                toast.success(response.data.message || 'Cập nhật ảnh đại diện thành công');
            }
        } catch (error) {
            if (error instanceof AxiosError) {
                const errorMessage = error.response?.data?.error || 'Lỗi máy chủ';
                toast.error(errorMessage);
            } else {
                toast.error('Lỗi máy chủ');
            }
        }
    };

    if (!user) {
        return null;
    }

    if (isLoading) {
        return (
            <div className='flex w-full items-center justify-center'>
                <Lottie animationData={LoadingImage} loop={true} />
            </div>
        );
    }

    return (
        <>
            <title>{`${user?.profile?.name || user?.username || 'E Roadmap'}`}</title>
            <div className='flex w-full max-w-4xl flex-1 gap-4'>
                <div className='flex w-1/2 flex-col justify-start'>
                    {user.stats && (
                        <div className='mb-4 grid grid-cols-2 gap-4 rounded-lg bg-stone-50 p-4 dark:bg-stone-900'>
                            <div className='text-center'>
                                <div className='mb-1 text-2xl font-bold text-stone-900 dark:text-stone-100'>{user.stats.level}</div>
                                <div className='text-xs text-stone-600 dark:text-stone-400'>Level</div>
                            </div>
                            <div className='text-center'>
                                <div className='mb-1 text-2xl font-bold text-stone-900 dark:text-stone-100'>{user.stats.xp}</div>
                                <div className='text-xs text-stone-600 dark:text-stone-400'>EXP</div>
                            </div>
                        </div>
                    )}

                    <div className='mb-4'>
                        <div className='mb-4 flex items-center justify-between'>
                            <p className='text-lg font-semibold text-stone-900 dark:text-stone-100'>Thông tin tài khoản</p>
                            <Button onClick={handleSave} disabled={isSaving} variant='gradient' className='px-3 py-1.5 text-xs' title='Lưu'>
                                <FontAwesomeIcon icon={faSave} className='mr-1' />
                                Lưu
                            </Button>
                        </div>

                        <div className='space-y-4'>
                            <div>
                                <p className='mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300'>Tên hiển thị</p>
                                <Input type='text' value={editedProfile.name} onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })} placeholder='Nhập tên của bạn' />
                            </div>
                            <div>
                                <p className='mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300'>Giới thiệu</p>
                                <Textarea value={editedProfile.bio} onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })} placeholder='Giới thiệu về bạn' rows={3} />
                            </div>
                            <div>
                                <p className='mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300'>
                                    <FontAwesomeIcon icon={faFacebook} className='mr-1 text-blue-600' />
                                    Facebook
                                </p>
                                <Input type='text' value={editedProfile.facebook} onChange={(e) => setEditedProfile({ ...editedProfile, facebook: e.target.value })} placeholder='username' />
                            </div>
                            <div>
                                <p className='mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300'>
                                    <FontAwesomeIcon icon={faGithub} className='mr-1' />
                                    GitHub
                                </p>
                                <Input type='text' value={editedProfile.github} onChange={(e) => setEditedProfile({ ...editedProfile, github: e.target.value })} placeholder='username' />
                            </div>
                        </div>
                    </div>

                    <div className='mb-4'>
                        <div className='mb-4 flex items-center justify-between'>
                            <p className='text-lg font-semibold text-stone-900 dark:text-stone-100'>
                                <FontAwesomeIcon icon={faKey} className='mr-2 text-stone-600 dark:text-stone-400' />
                                Mật khẩu
                            </p>
                            {!isChangingPassword && (
                                <Button onClick={() => setIsChangingPassword(true)} variant='outline' className='px-3 py-1.5 text-xs' title='Đổi mật khẩu'>
                                    <FontAwesomeIcon icon={faPencilAlt} />
                                </Button>
                            )}
                        </div>

                        {isChangingPassword ? (
                            <div className='space-y-4'>
                                <div>
                                    <p className='mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300'>
                                        <FontAwesomeIcon icon={faLock} className='mr-1' />
                                        Mật khẩu hiện tại
                                    </p>
                                    <Input type='password' value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder='Nhập mật khẩu hiện tại' />
                                </div>
                                <div>
                                    <p className='mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300'>
                                        <FontAwesomeIcon icon={faKey} className='mr-1' />
                                        Mật khẩu mới
                                    </p>
                                    <Input type='password' value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder='Nhập mật khẩu mới (tối thiểu 6 ký tự)' />
                                </div>
                                <div>
                                    <p className='mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300'>
                                        <FontAwesomeIcon icon={faKey} className='mr-1' />
                                        Xác nhận mật khẩu mới
                                    </p>
                                    <Input type='password' value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder='Nhập lại mật khẩu mới' />
                                </div>
                                <div className='flex gap-2 pt-2'>
                                    <Button onClick={handlePasswordChange} disabled={isSaving} variant='gradient' className='flex-1' title='Lưu mật khẩu'>
                                        <FontAwesomeIcon icon={faSave} className='mr-2' />
                                        {isSaving ? 'Đang lưu...' : 'Đổi mật khẩu'}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setIsChangingPassword(false);
                                            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                        }}
                                        disabled={isSaving}
                                        variant='outline'
                                        title='Hủy'
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className='flex items-center text-sm text-stone-600 dark:text-stone-400'>
                                <FontAwesomeIcon icon={faLock} className='mr-2' />
                                <span>••••••••</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className='flex w-1/2 items-center justify-center'>
                    <div className='relative h-full w-full overflow-hidden rounded-md border border-white bg-white/10 shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] backdrop-blur-xs dark:border-stone-700 dark:bg-stone-900/50 dark:shadow-[inset_0_1px_0px_rgba(255,255,255,0.1),0_0_9px_rgba(0,0,0,0.5),0_3px_8px_rgba(0,0,0,0.3)]'>
                        <div className='flex h-full flex-col items-center justify-start p-4 font-semibold text-stone-800 dark:text-stone-200'>
                            <div className='mb-4'>
                                <button className='group relative cursor-pointer' onClick={handleAvatarClick}>
                                    <input type='file' ref={fileInputRef} onChange={handleAvatarChange} accept='image/*' className='hidden' />
                                    {user.profile?.avatar_url ? (
                                        <img src={user.profile.avatar_url} alt={user.username} className='h-40 w-40 rounded-full border-4 border-stone-200 object-cover transition-opacity group-hover:opacity-75 dark:border-stone-700' />
                                    ) : (
                                        <div className='flex h-40 w-40 items-center justify-center rounded-full border-4 border-stone-200 bg-stone-100 transition-opacity group-hover:opacity-75 dark:border-stone-700 dark:bg-stone-700'>
                                            <FontAwesomeIcon icon={faUser} className='text-6xl text-stone-600 dark:text-stone-400' />
                                        </div>
                                    )}
                                    <div className='pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-all group-hover:bg-black/50'>
                                        <FontAwesomeIcon icon={faCamera} className='text-3xl text-white opacity-0 transition-opacity group-hover:opacity-100' />
                                    </div>
                                </button>
                            </div>

                            <div className='text-center'>
                                <div className='mb-2 flex items-center justify-center gap-2'>
                                    <p className='text-xl font-bold text-stone-900 dark:text-stone-100'>{user.profile?.name || user.username}</p>
                                    <button onClick={() => handleVisibilityChange(user.profile?.visibility === 'PUBLIC' ? 'GROUP_ONLY' : 'PUBLIC')} className='text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100' title={user.profile?.visibility === 'PUBLIC' ? 'Chuyển sang chế độ ẩn' : 'Chuyển sang chế độ công khai'}>
                                        <FontAwesomeIcon icon={user.profile?.visibility === 'PUBLIC' ? faLockOpen : faLock} className='text-sm' />
                                    </button>
                                </div>
                                <p className='text-stone-600 dark:text-stone-400'>@{user.username}</p>
                            </div>

                            {user.profile?.bio && (
                                <div className='mt-4 text-center'>
                                    <p className='text-sm text-stone-600 dark:text-stone-400'>{user.profile.bio}</p>
                                </div>
                            )}

                            <div className='mt-4 flex gap-4'>
                                {editedProfile.facebook && (
                                    <a href={`https://facebook.com/${editedProfile.facebook}`} target='_blank' rel='noopener noreferrer' className='text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300' title={`Facebook: ${editedProfile.facebook}`}>
                                        <FontAwesomeIcon icon={faFacebook} className='text-xl' />
                                    </a>
                                )}
                                {editedProfile.github && (
                                    <a href={`https://github.com/${editedProfile.github}`} target='_blank' rel='noopener noreferrer' className='text-stone-900 transition-colors hover:text-stone-700 dark:text-stone-100 dark:hover:text-stone-300' title={`GitHub: ${editedProfile.github}`}>
                                        <FontAwesomeIcon icon={faGithub} className='text-xl' />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
