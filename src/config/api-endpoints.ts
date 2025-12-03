const apiEndpoints = {
    public: {
        adminLogin: '/admin-login',
        login: '/login',
        register: '/register',
        verify: '/verify',
        topics: '/topics',
        roadmaps: '/roadmaps',
        groups: '/groups',
        userProfile: (username: string) => `/users/${username}`,
        userPosts: (username: string) => `/posts/u/${username}`,
        posts: '/posts',
        postDetail: (id: string) => `/posts/${id}`
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
        groupKick: (groupId: string) => `/me/groups/${groupId}/kick`,
        groupTransfer: (groupId: string) => `/me/groups/${groupId}/transfer`,
        quizzes: '/me/quizzes',
        createPost: '/me/posts',
        updatePost: (postId: string) => `/me/posts/${postId}`,
        deletePost: (postId: string) => `/me/posts/${postId}`,
        createPostComment: (postId: string) => `/me/posts/${postId}/comments`
    },
    admin: {
        config: '/admin/config',
        topics: '/admin/topics',
        roadmap: '/admin/roadmap',
        quizzes: '/admin/quizzes',
        users: '/admin/users',
        changePassword: '/admin/change-password',
        genRoadmap: '/admin/gen-roadmap',
        genQuizz: '/admin/gen-quizz',
        userDetail: (username: string) => `/admin/users/${username}`,
        userBan: (username: string) => `/admin/users/${username}/ban`,
        userVerify: (username: string) => `/admin/users/${username}/verify`
    }
};

export default apiEndpoints;
