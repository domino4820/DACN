const apiEndpoints = {
    public: {
        adminLogin: '/admin-login',
        login: '/login',
        register: '/register',
        verify: '/verify',
        topics: '/topics',
        roadmaps: '/roadmaps'
    },
    me: {
        getProfile: '/me/profile',
        updateProfile: '/me/profile',
        changePassword: '/me/change-password',
        updateVisibility: '/me/visibility',
        uploadAvatar: '/me/avatar',
        roadmaps: '/me/roadmap'
    },
    admin: {
        config: '/admin/config',
        topics: '/admin/topics',
        roadmaps: '/admin/roadmaps'
    }
};

export default apiEndpoints;
