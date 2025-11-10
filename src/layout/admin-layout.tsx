import Header from '@/components/admin/common/header.tsx';
import NavBar from '@/components/admin/common/nav-bar.tsx';
import paths from '@/config/paths';
import { useAdminStore } from '@/store/admin.store';
import { useLayoutStore } from '@/store/layout.store';
import { useThemeStore } from '@/store/theme.store';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

const AdminLayout: FC = () => {
    const { setTheme } = useThemeStore();
    const { isAuthenticated } = useAdminStore();
    const { setHeaderHeight, setContentHeight } = useLayoutStore();
    const navigate = useNavigate();
    const location = useLocation();
    const headerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setTheme(false);
    }, [setTheme]);

    useEffect(() => {
        if (!isAuthenticated && location.pathname !== paths.admin.login) {
            navigate(paths.admin.login);
        }
        if (isAuthenticated && location.pathname === paths.admin.login) {
            navigate(paths.admin.root);
        }
    }, [isAuthenticated, location.pathname, navigate]);

    useEffect(() => {
        const handleResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    }, [headerRef.current, setHeaderHeight]);

    useEffect(() => {
        const contentHeight = dimensions.height - (headerRef.current?.offsetHeight || 0) - 32;
        setContentHeight(contentHeight);
    }, [dimensions, setHeaderHeight, setContentHeight]);

    return (
        <div className='hidden flex-col sm:flex' style={{ minHeight: '100vh' }}>
            <title>ADMIN</title>
            {isAuthenticated && (
                <div ref={headerRef}>
                    <Header />
                </div>
            )}
            <div className={`flex flex-1 ${isAuthenticated ? 'flex-row' : 'flex-col'}`}>
                {isAuthenticated && <NavBar />}
                <div className='w-full px-4 py-4'>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
