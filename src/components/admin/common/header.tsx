import Logo from '@/assets/images/favicon/logo-transparent.png';
import Button from '@/components/admin/ui/button.tsx';
import { useAdminStore } from '@/store/admin.store';
import type { FC } from 'react';
const Header: FC = () => {
    const logout = useAdminStore((state) => state.logout);
    const handleLogout = () => {
        logout();
    };

    return (
        <header className='w-full bg-white shadow-md'>
            <div className='flex items-center justify-between py-4 pr-4'>
                <div className='flex w-[200px] items-center justify-center'>
                    <img src={Logo} alt='' className='h-12 w-12 object-contain' />
                </div>
                <div className='flex items-center gap-4'>
                    <Button>Đổi mật khẩu</Button>
                    <Button onClick={handleLogout}>Đăng xuất</Button>
                </div>
            </div>
        </header>
    );
};

export default Header;
