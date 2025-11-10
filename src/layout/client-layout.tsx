import Footer from '@/components/common/footer.tsx';
import Header from '@/components/common/header';
import ScrollToTop from '@/components/common/scroll-to-top';
import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { Outlet, useLocation } from 'react-router';

const ClientLayout: FC = () => {
    const headerRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    useEffect(() => {
        const updateHeight = () => {
            if (headerRef.current && contentRef.current) {
                const headerHeight = headerRef.current.offsetHeight;
                contentRef.current.style.minHeight = `calc(100vh - 2rem - ${headerHeight}px)`;
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);

        return () => {
            window.removeEventListener('resize', updateHeight);
        };
    }, [location.pathname]);

    return (
        <>
            <div className='flex h-screen items-center justify-center text-center text-3xl sm:hidden'>CHƯA LÀM CHO MOBILE</div>
            <div className='hidden bg-linear-to-br from-gray-50 via-gray-100 to-gray-200 p-4 transition-colors duration-300 sm:block dark:from-stone-950 dark:via-stone-900 dark:to-stone-950' style={{ minHeight: '100vh' }}>
                <Header ref={headerRef} />
                <div ref={contentRef} className='flex flex-col gap-4 py-4'>
                    <div className='flex flex-1 flex-col items-center justify-center gap-4'>
                        <Outlet />
                    </div>
                    <Footer />
                </div>
                <ScrollToTop />
                <Toaster position='top-right' />
            </div>
        </>
    );
};

export default ClientLayout;
