import MESSAGES from '@/config/message.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const querySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val) : 1)),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val) : 10))
});

const usernameParamSchema = z.object({
    username: z.string().min(1).max(50)
});

const idParamSchema = z.object({
    id: z.uuid()
});

const postListSelect = {
    id: true,
    title: true,
    content: true,
    created_at: true,
    updated_at: true,
    user: {
        select: {
            username: true,
            profile: {
                select: {
                    name: true,
                    avatar_url: true
                }
            }
        }
    },
    _count: {
        select: {
            comments: true
        }
    }
};

const truncateContent = (content: string, maxLength: number = 100): string => {
    if (content.length <= maxLength) {
        return content;
    }
    return content.slice(0, maxLength) + '...';
};

const app = new Hono();

app.get('/', zValidator('query', querySchema), async (c) => {
    try {
        const { page, limit } = c.req.valid('query');
        const skip = (page - 1) * limit;

        const totalCount = await prisma.post.count();

        const posts = await prisma.post.findMany({
            select: postListSelect,
            orderBy: {
                created_at: 'desc'
            },
            skip,
            take: limit
        });

        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        const postsWithTruncatedContent = posts.map((post) => ({
            ...post,
            content: truncateContent(post.content)
        }));

        return c.json(
            {
                success: true,
                data: postsWithTruncatedContent,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage,
                    hasPrevPage
                }
            },
            200
        );
    } catch (error) {
        console.log('posts list error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.get('/:id', zValidator('param', idParamSchema), async (c) => {
    try {
        const { id } = c.req.valid('param');

        const post = await prisma.post.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                content: true,
                created_at: true,
                updated_at: true,
                user: {
                    select: {
                        username: true,
                        profile: {
                            select: {
                                name: true,
                                avatar_url: true
                            }
                        }
                    }
                },
                comments: {
                    orderBy: {
                        created_at: 'desc'
                    },
                    select: {
                        id: true,
                        content: true,
                        created_at: true,
                        user: {
                            select: {
                                username: true,
                                profile: {
                                    select: {
                                        name: true,
                                        avatar_url: true
                                    }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        comments: true
                    }
                }
            }
        });

        if (!post) {
            return c.json({ success: false, error: 'Post không tồn tại' }, 404);
        }

        return c.json(
            {
                success: true,
                data: post
            },
            200
        );
    } catch (error) {
        console.log('post detail error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.get('/u/:username', zValidator('param', usernameParamSchema), zValidator('query', querySchema), async (c) => {
    try {
        const { username } = c.req.valid('param');
        const { page, limit } = c.req.valid('query');
        const skip = (page - 1) * limit;

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                username: true,
                is_banned: true
            }
        });

        if (!user) {
            return c.json({ success: false, error: MESSAGES.userNotFound }, 404);
        }

        if (user.is_banned) {
            return c.json({ success: false, error: MESSAGES.userBanned }, 403);
        }

        const totalCount = await prisma.post.count({
            where: { user_id: username }
        });

        const posts = await prisma.post.findMany({
            where: { user_id: username },
            select: postListSelect,
            orderBy: {
                created_at: 'desc'
            },
            skip,
            take: limit
        });

        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        const postsWithTruncatedContent = posts.map((post) => ({
            ...post,
            content: truncateContent(post.content)
        }));

        return c.json(
            {
                success: true,
                data: postsWithTruncatedContent,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage,
                    hasPrevPage
                }
            },
            200
        );
    } catch (error) {
        console.log('posts by user error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

export default app;
