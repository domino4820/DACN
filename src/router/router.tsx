import paths from '@/config/paths';
import AdminLayout from '@/layout/admin-layout';
import ClientLayout from '@/layout/client-layout';
import AdminLogin from '@/pages/admin/admin-login';
import Config from '@/pages/admin/config';
import AdminQuizzes from '@/pages/admin/quizzes';
import Roadmaps from '@/pages/admin/roadmaps';
import Topics from '@/pages/admin/topics';
import Users from '@/pages/admin/users';
import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';
import Verify from '@/pages/auth/verify';
import GroupDetails from '@/pages/groups/group-details';
import Groups from '@/pages/groups/groups';
import Index from '@/pages/index';
import Profile from '@/pages/me/profile';
import NotFound from '@/pages/not-found';
import User from '@/pages/profile/user';
import QuizDetail from '@/pages/quizzes/quiz-detail';
import Quizzes from '@/pages/quizzes/quizzes';
import Roadmap from '@/pages/roadmaps/roadmap';
import RoadmapDetail from '@/pages/roadmaps/roadmap-detail';
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
                path: paths.setting,
                element: (
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                )
            },
            {
                path: paths.profile,
                element: <User />
            },
            {
                path: paths.roadmaps,
                element: <Roadmap />
            },
            {
                path: paths.roadmapDetail,
                element: <RoadmapDetail />
            },
            {
                path: paths.groups,
                element: <Groups />
            },
            {
                path: paths.groupDetails,
                element: (
                    <ProtectedRoute>
                        <GroupDetails />
                    </ProtectedRoute>
                )
            },
            {
                path: paths.quizzes,
                element: (
                    <ProtectedRoute>
                        <Quizzes />
                    </ProtectedRoute>
                )
            },
            {
                path: paths.quizDetail,
                element: (
                    <ProtectedRoute>
                        <QuizDetail />
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
            { index: true, element: <AdminQuizzes /> },
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
