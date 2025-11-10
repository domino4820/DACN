import paths from '@/config/paths';
import AdminLayout from '@/layout/admin-layout';
import ClientLayout from '@/layout/client-layout';
import AdminLogin from '@/pages/admin/admin-login';
import Config from '@/pages/admin/config.tsx';
import Quizzes from '@/pages/admin/quizzes.tsx';
import Roadmaps from '@/pages/admin/roadmaps.tsx';
import Topics from '@/pages/admin/topics.tsx';
import Users from '@/pages/admin/users.tsx';
import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';
import Verify from '@/pages/auth/verify';
import Index from '@/pages/index';
import Profile from '@/pages/me/profile';
import Roadmap from '@/pages/me/roadmap.tsx';
import NotFound from '@/pages/not-found';
import ProtectedRoute from '@/router/protected-route';
import PublicOnlyRoute from '@/router/public-only-route';
import { createBrowserRouter, Navigate } from 'react-router';

const router = createBrowserRouter([
    {
        path: paths.root,
        element: <ClientLayout />,
        children: [
            {
                path: paths.root,
                element: <Index />
            },
            {
                path: paths.login,
                element: (
                    <PublicOnlyRoute>
                        <Login />
                    </PublicOnlyRoute>
                )
            },
            {
                path: paths.register,
                element: (
                    <PublicOnlyRoute>
                        <Register />
                    </PublicOnlyRoute>
                )
            },
            {
                path: paths.verify,
                element: (
                    <PublicOnlyRoute>
                        <Verify />
                    </PublicOnlyRoute>
                )
            },
            {
                path: paths.me,
                element: (
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                )
            },
            {
                path: paths.roadmaps,
                element: (
                    <ProtectedRoute>
                        <Roadmap />
                    </ProtectedRoute>
                )
            },
            {
                path: paths.notFound,
                element: <NotFound />
            }
        ]
    },
    {
        path: paths.admin.root,
        element: <AdminLayout />,
        children: [
            { index: true, element: <Quizzes /> },
            { path: paths.admin.config, element: <Config /> },
            { path: paths.admin.login, element: <AdminLogin /> },
            { path: paths.admin.roadmaps, element: <Roadmaps /> },
            { path: paths.admin.topics, element: <Topics /> },
            { path: paths.admin.users, element: <Users /> },
            { path: paths.notFound, element: <Navigate to={paths.admin.root} replace /> }
        ]
    }
]);

export default router;
