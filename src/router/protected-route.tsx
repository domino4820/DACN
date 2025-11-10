import paths from '@/config/paths';
import { useAuthStore } from '@/store/auth.store';
import type { FC, ReactNode } from 'react';
import { Navigate } from 'react-router';

interface ProtectedRouteProps {
    children: ReactNode;
}
const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    if (!isAuthenticated) {
        return <Navigate to={paths.login} replace />;
    }
    return <>{children}</>;
};

export default ProtectedRoute;
