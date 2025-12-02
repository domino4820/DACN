const apiEndpoints = {
    public: {
        adminLogin: '/admin-login',
        login: '/login',
        register: '/register',
        verify: '/verify',
        topics: '/topics',
        roadmaps: '/roadmaps',
        groups: '/groups',
        userProfile: (username: string) => `/users/${username}`
    },
    me: {
        getProfile: '/me/profile',
        updateProfile: '/me/profile',
        changePassword: '/me/change-password',
        updateVisibility: '/me/visibility',
        uploadAvatar: '/me/avatar',
        roadmaps: '/me/roadmap',
        roadmapComments: (roadmapId: string) => `/me/roadmaps/${roadmapId}/comments`,
        roadmapComment: (commentId: string) => `/me/roadmaps/comments/${commentId}`,
        roadmapNodeLearning: (roadmapId: string, nodeId: string) => `/me/roadmaps/${roadmapId}/nodes/${nodeId}/learning`,
        roadmapNodeComplete: (roadmapId: string, nodeId: string) => `/me/roadmaps/${roadmapId}/nodes/${nodeId}/complete`,
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
