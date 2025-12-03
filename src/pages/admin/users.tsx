import Button from '@/components/admin/ui/button';
import Dropdown, { DropdownItem } from '@/components/ui/drop-down';
import apiEndpoints from '@/config/api-endpoints';
import MESSAGES from '@/config/messages';
import { useLayoutStore } from '@/store/layout.store';
import api from '@/utils/api';
import { isAxiosError } from 'axios';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

type User = {
    username: string;
    email: string;
    is_banned: boolean;
    is_verified: boolean;
    created_at: string;
    profile: {
        name: string | null;
        avatar_url: string | null;
    } | null;
    stats: {
        xp: number;
    } | null;
};

type UserDetail = {
    username: string;
    email: string;
    is_banned: boolean;
    is_verified: boolean;
    otp: string | null;
    created_at: string;
    profile: {
        name: string | null;
        avatar_url: string | null;
        bio: string | null;
        visibility: string | null;
        facebook: string | null;
        github: string | null;
    } | null;
    stats: {
        xp: number;
    } | null;
};

type Pagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}

const Users: FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
    });
    const [isBannedFilter, setIsBannedFilter] = useState<boolean | undefined>(undefined);
    const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const { contentHeight } = useLayoutStore();

    const fetchUsers = async (page = 1, banned?: boolean) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });

            if (banned !== undefined) {
                params.append('is_banned', banned.toString());
            }

            const response = await api.get<ApiResponse<{ users: User[]; pagination: Pagination }>>(`${apiEndpoints.admin.users}?${params.toString()}`);

            const { users: usersData, pagination: paginationData } = response.data.data;

            setUsers(usersData);
            setPagination(paginationData);
            setError(null);
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                setError(MESSAGES.internalServerError);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetail = async (username: string) => {
        try {
            const response = await api.get<ApiResponse<UserDetail>>(apiEndpoints.admin.userDetail(username));
            setUserDetail(response.data.data);
            setSelectedUsername(username);
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                setError(MESSAGES.internalServerError);
            }
        }
    };

    useEffect(() => {
        fetchUsers(pagination.page, isBannedFilter);
    }, [pagination.page, isBannedFilter]);

    const handlePageChange = (page: number) => {
        setPagination((prev) => ({ ...prev, page }));
    };

    const handleBannedFilter = (value: boolean | undefined) => {
        setIsBannedFilter(value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleBanUser = async (username: string, currentBanned: boolean) => {
        try {
            await api.patch<ApiResponse<User>>(apiEndpoints.admin.userBan(username), {
                is_banned: !currentBanned
            });
            fetchUsers(pagination.page, isBannedFilter);
            if (selectedUsername === username) {
                fetchUserDetail(username);
            }
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                setError(MESSAGES.internalServerError);
            }
        }
    };

    const handleVerifyUser = async (username: string) => {
        try {
            await api.patch<ApiResponse<User>>(apiEndpoints.admin.userVerify(username), {
                is_verified: true
            });
            fetchUsers(pagination.page, isBannedFilter);
            if (selectedUsername === username) {
                fetchUserDetail(username);
            }
        } catch (err) {
            if (isAxiosError(err)) {
                setError(err.response?.data?.error || MESSAGES.internalServerError);
            } else {
                setError(MESSAGES.internalServerError);
            }
        }
    };

    const getBannedFilterLabel = () => {
        if (isBannedFilter === true) return 'Đã bị cấm';
        if (isBannedFilter === false) return 'Chưa bị cấm';
        return 'Tất cả';
    };

    return (
        <div className='flex flex-col' style={{ height: `${contentHeight}px` }}>
            <div className='mb-4 flex shrink-0 items-center justify-between'>
                <p className='text-2xl font-bold'>Quản lý Users</p>
            </div>

            {error && <div className='mb-4 shrink-0 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>{error}</div>}

            <div className='mb-4 flex shrink-0 items-center gap-4'>
                <div className='flex items-center gap-2'>
                    <Dropdown trigger={getBannedFilterLabel()} triggerVariant='outline' triggerClassName='inline-flex items-center justify-start w-[150px] truncate rounded-md border border-stone-800 px-4 py-2 text-left align-middle font-sans text-sm font-medium transition-all duration-300 ease-in' menuClassName='w-[150px]'>
                        <DropdownItem onClick={() => handleBannedFilter(undefined)}>Tất cả</DropdownItem>
                        <DropdownItem onClick={() => handleBannedFilter(true)}>Đã bị cấm</DropdownItem>
                        <DropdownItem onClick={() => handleBannedFilter(false)}>Chưa bị cấm</DropdownItem>
                    </Dropdown>
                </div>
            </div>

            <div className='flex-1 overflow-hidden rounded-lg bg-white shadow'>
                <div className='h-full overflow-y-auto'>
                    <table className='min-w-full divide-y divide-gray-200'>
                        <thead className='sticky top-0 z-10 bg-gray-50'>
                            <tr>
                                <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Username</th>
                                <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Email</th>
                                <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Tên</th>
                                <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>XP</th>
                                <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Trạng thái</th>
                                <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>Ngày tạo</th>
                                <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-200 bg-white'>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className='px-4 py-4 text-center text-gray-500'>
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='px-4 py-4 text-center text-gray-500'>
                                        Không có user nào
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.username}>
                                        <td className='px-4 py-4 text-sm font-medium whitespace-nowrap text-gray-900'>
                                            <button onClick={() => fetchUserDetail(user.username)} className='text-stone-800 hover:text-stone-600 hover:underline'>
                                                {user.username}
                                            </button>
                                        </td>
                                        <td className='px-4 py-4 text-sm whitespace-nowrap text-gray-500'>{user.email}</td>
                                        <td className='px-4 py-4 text-sm whitespace-nowrap text-gray-500'>{user.profile?.name || '-'}</td>
                                        <td className='px-4 py-4 text-sm whitespace-nowrap text-gray-500'>{user.stats?.xp || 0}</td>
                                        <td className='px-4 py-4 text-sm whitespace-nowrap'>
                                            <div className='flex flex-col gap-1'>
                                                {user.is_banned && <span className='inline-flex w-fit rounded bg-stone-100 px-2 py-1 text-xs font-medium text-stone-800'>Bị cấm</span>}
                                                {user.is_verified && <span className='inline-flex w-fit rounded bg-stone-100 px-2 py-1 text-xs font-medium text-stone-800'>Đã xác thực</span>}
                                            </div>
                                        </td>
                                        <td className='px-4 py-4 text-sm whitespace-nowrap text-gray-500'>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                                        <td className='px-4 py-4 text-right text-sm font-medium whitespace-nowrap'>
                                            <div className='flex items-center justify-end gap-2'>
                                                <Button className='bg-transparent text-stone-800 transition-all duration-200 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50' onClick={() => handleBanUser(user.username, user.is_banned)}>
                                                    {user.is_banned ? 'Bỏ cấm' : 'Cấm'}
                                                </Button>
                                                {!user.is_verified && (
                                                    <Button className='bg-transparent text-stone-800 transition-all duration-200 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50' onClick={() => handleVerifyUser(user.username)}>
                                                        Xác thực
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {pagination.totalPages > 1 && (
                <div className='mt-4 flex justify-center space-x-2'>
                    <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className='rounded border border-stone-300 bg-white px-3 py-1 text-sm disabled:opacity-50'>
                        Trước
                    </button>
                    <span className='px-3 py-1 text-sm'>
                        Trang {pagination.page} / {pagination.totalPages}
                    </span>
                    <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className='rounded border border-stone-300 bg-white px-3 py-1 text-sm disabled:opacity-50'>
                        Sau
                    </button>
                </div>
            )}

            {selectedUsername && userDetail && (
                <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black' onClick={() => setSelectedUsername(null)}>
                    <div className='max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl' onClick={(e) => e.stopPropagation()}>
                        <div className='mb-4 flex items-center justify-between'>
                            <p className='text-2xl font-bold'>Chi tiết User</p>
                            <button onClick={() => setSelectedUsername(null)} className='rounded-md px-3 py-1 text-gray-500 hover:bg-gray-100'>
                                ✕
                            </button>
                        </div>
                        <div className='space-y-4'>
                            <div>
                                <p className='text-sm font-semibold text-gray-600'>Username</p>
                                <p className='text-lg'>{userDetail.username}</p>
                            </div>
                            <div>
                                <p className='text-sm font-semibold text-gray-600'>Email</p>
                                <p className='text-lg'>{userDetail.email}</p>
                            </div>
                            {userDetail.profile && (
                                <>
                                    <div>
                                        <p className='text-sm font-semibold text-gray-600'>Tên</p>
                                        <p className='text-lg'>{userDetail.profile.name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className='text-sm font-semibold text-gray-600'>Bio</p>
                                        <p className='text-lg'>{userDetail.profile.bio || '-'}</p>
                                    </div>
                                    <div>
                                        <p className='text-sm font-semibold text-gray-600'>Visibility</p>
                                        <p className='text-lg'>{userDetail.profile.visibility || '-'}</p>
                                    </div>
                                </>
                            )}
                            <div>
                                <p className='text-sm font-semibold text-gray-600'>XP</p>
                                <p className='text-lg'>{userDetail.stats?.xp || 0}</p>
                            </div>
                            <div>
                                <p className='text-sm font-semibold text-gray-600'>Trạng thái</p>
                                <div className='flex gap-2'>
                                    {userDetail.is_banned && <span className='inline-flex rounded bg-stone-100 px-2 py-1 text-sm font-medium text-stone-800'>Bị cấm</span>}
                                    {userDetail.is_verified && <span className='inline-flex rounded bg-stone-100 px-2 py-1 text-sm font-medium text-stone-800'>Đã xác thực</span>}
                                </div>
                            </div>
                            <div>
                                <p className='text-sm font-semibold text-gray-600'>Ngày tạo</p>
                                <p className='text-lg'>{new Date(userDetail.created_at).toLocaleString('vi-VN')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
