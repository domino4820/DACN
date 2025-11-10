import paths from '@/config/paths';
import { useAuthStore } from '@/store/auth.store';
import type { FC, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

interface PublicOnlyRouteProps {
    children: ReactNode;
}

const PublicOnlyRoute: FC<PublicOnlyRouteProps> = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const location = useLocation();

    if (isAuthenticated) {
        const from = (location.state as { from?: string })?.from || paths.root;
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
};

export default PublicOnlyRoute;
