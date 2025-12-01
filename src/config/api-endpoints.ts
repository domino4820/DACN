const apiEndpoints = {
    public: {
        adminLogin: '/admin-login',
        login: '/login',
        register: '/register',
        verify: '/verify',
        topics: '/topics',
        roadmaps: '/roadmaps',
        groups: '/groups'
    },
    me: {
        getProfile: '/me/profile',
        updateProfile: '/me/profile',
        changePassword: '/me/change-password',
        updateVisibility: '/me/visibility',
        uploadAvatar: '/me/avatar',
        roadmaps: '/me/roadmap',
        groups: '/me/groups',
        quizzes: '/me/quizzes'
    },
    admin: {
        config: '/admin/config',
        topics: '/admin/topics',
        roadmap: '/admin/roadmap',
        quizzes: '/admin/quizzes'
    }
};

export default apiEndpoints;
