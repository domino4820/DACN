const paths = {
    blog: '/blog',
    faq: '/faq',
    groups: '/groups',
    groupDetails: '/groups/:id',
    guides: '/guides',
    login: '/login',
    profile: '/profile/:username',
    notFound: '*',
    setting: '/setting',
    quizzes: '/quizzes',
    register: '/register',
    roadmaps: '/roadmaps',
    roadmapDetail: '/roadmaps/:id',
    root: '/',
    verify: '/verify',
    admin: {
        badges: '/admin/badges',
        config: '/admin/config',
        login: '/admin/login',
        root: '/admin',
        roadmaps: '/admin/roadmaps',
        topics: '/admin/topics',
        users: '/admin/users'
    }
};
export default paths;
