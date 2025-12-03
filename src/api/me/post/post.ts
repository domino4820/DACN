import MESSAGES from '@/config/message.js';
import { Prisma } from '@/generated/client.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import type { JwtVariables } from 'hono/jwt';
import { z } from 'zod';

const postIdParamSchema = z.object({
    id: z.uuid()
});

const createPostSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1)
});

const createCommentSchema = z.object({
    content: z.string().min(1).max(1000)
});

const updatePostSchema = z
    .object({
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).optional()
    })
    .refine((data) => data.title !== undefined || data.content !== undefined, {
        message: 'Phải cung cấp ít nhất title hoặc content để cập nhật'
    });

const commentUserSelect = {
    username: true,
    profile: {
        select: {
            name: true,
            avatar_url: true
        }
    }
} satisfies Prisma.UserSelect;

const app = new Hono<{ Variables: JwtVariables & { username: string } }>();

app.post('/', zValidator('json', createPostSchema), async (c) => {
    try {
        const username = c.get('username');
        const { title, content } = c.req.valid('json');

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

        const post = await prisma.post.create({
            data: {
                user_id: username,
                title: title.trim(),
                content: content
            },
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
                _count: {
                    select: {
                        comments: true
                    }
                }
            }
        });

        return c.json(
            {
                success: true,
                data: post
            },
            201
        );
    } catch (error) {
        console.log('create post error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.post('/:id/comments', zValidator('param', postIdParamSchema), zValidator('json', createCommentSchema), async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.valid('param');
        const { content } = c.req.valid('json');

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

        const post = await prisma.post.findUnique({
            where: { id }
        });

        if (!post) {
            return c.json({ success: false, error: 'Post không tồn tại' }, 404);
        }

        const comment = await prisma.postComment.create({
            data: {
                post_id: id,
                user_id: username,
                content: content.trim()
            },
            include: {
                user: {
                    select: commentUserSelect
                }
            }
        });

        return c.json(
            {
                success: true,
                data: {
                    id: comment.id,
                    postId: comment.post_id,
                    content: comment.content,
                    createdAt: comment.created_at,
                    user: {
                        username: comment.user.username,
                        name: comment.user.profile?.name ?? null,
                        avatarUrl: comment.user.profile?.avatar_url ?? null
                    }
                }
            },
            201
        );
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                return c.json({ success: false, error: 'Post không tồn tại' }, 404);
            }
        }

        console.log('create post comment error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.put('/:id', zValidator('param', postIdParamSchema), zValidator('json', updatePostSchema), async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.valid('param');
        const { title, content } = c.req.valid('json');

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

        const post = await prisma.post.findUnique({
            where: { id },
            select: {
                user_id: true
            }
        });

        if (!post) {
            return c.json({ success: false, error: 'Post không tồn tại' }, 404);
        }

        if (post.user_id !== username) {
            return c.json({ success: false, error: 'Không có quyền sửa bài viết này' }, 403);
        }

        const updateData: { title?: string; content?: string } = {};
        if (title !== undefined) {
            updateData.title = title.trim();
        }
        if (content !== undefined) {
            updateData.content = content.trim();
        }

        const updatedPost = await prisma.post.update({
            where: { id },
            data: updateData,
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
                _count: {
                    select: {
                        comments: true
                    }
                }
            }
        });

        return c.json({
            success: true,
            data: updatedPost
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return c.json({ success: false, error: 'Post không tồn tại' }, 404);
            }
        }

        console.log('update post error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.delete('/:id', zValidator('param', postIdParamSchema), async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.valid('param');

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

        const post = await prisma.post.findUnique({
            where: { id },
            select: {
                user_id: true
            }
        });

        if (!post) {
            return c.json({ success: true }, 200);
        }

        if (post.user_id !== username) {
            return c.json({ success: false, error: 'Không có quyền xóa bài viết này' }, 403);
        }

        await prisma.post.delete({
            where: { id }
        });

        return c.json({ success: true }, 200);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return c.json({ success: true }, 200);
            }
        }

        console.log('delete post error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

export default app;
