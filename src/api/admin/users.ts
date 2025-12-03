import MESSAGES from '@/config/message.js';
import { Prisma } from '@/generated/client.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const usernameParamSchema = z.object({
    username: z.string().min(1).max(50)
});

const querySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val) : 1)),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val) : 20)),
    is_banned: z
        .string()
        .optional()
        .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
    is_verified: z
        .string()
        .optional()
        .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined))
});

const banUserSchema = z.object({
    is_banned: z.boolean()
});

const verifyUserSchema = z.object({
    is_verified: z.literal(true)
});

const app = new Hono();

app.get('/', zValidator('query', querySchema), async (c) => {
    try {
        const { page, limit, is_banned, is_verified } = c.req.valid('query');

        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {};

        if (is_banned !== undefined) {
            where.is_banned = is_banned;
        }

        if (is_verified !== undefined) {
            where.is_verified = is_verified;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    username: true,
                    email: true,
                    is_banned: true,
                    is_verified: true,
                    created_at: true,
                    profile: {
                        select: {
                            name: true,
                            avatar_url: true
                        }
                    },
                    stats: {
                        select: {
                            xp: true
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            }),
            prisma.user.count({ where })
        ]);

        return c.json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.log('list users error:', error);
        return c.json(
            {
                success: false,
                error: MESSAGES.internalServerError
            },
            500
        );
    }
});

app.get('/:username', zValidator('param', usernameParamSchema), async (c) => {
    try {
        const { username } = c.req.valid('param');

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                username: true,
                email: true,
                is_banned: true,
                is_verified: true,
                otp: true,
                created_at: true,
                profile: {
                    select: {
                        name: true,
                        avatar_url: true,
                        bio: true,
                        visibility: true,
                        facebook: true,
                        github: true
                    }
                },
                stats: {
                    select: {
                        xp: true
                    }
                }
            }
        });

        if (!user) {
            return c.json({ success: false, error: MESSAGES.userNotFound }, 404);
        }

        return c.json({
            success: true,
            data: user
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return c.json({ success: false, error: MESSAGES.userNotFound }, 404);
            }
        }

        console.log('get user error:', error);
        return c.json(
            {
                success: false,
                error: MESSAGES.internalServerError
            },
            500
        );
    }
});

app.patch('/:username/ban', zValidator('param', usernameParamSchema), zValidator('json', banUserSchema), async (c) => {
    try {
        const { username } = c.req.valid('param');
        const { is_banned } = c.req.valid('json');

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return c.json({ success: false, error: MESSAGES.userNotFound }, 404);
        }

        const updatedUser = await prisma.user.update({
            where: { username },
            data: { is_banned },
            select: {
                username: true,
                email: true,
                is_banned: true,
                is_verified: true,
                created_at: true
            }
        });

        return c.json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return c.json({ success: false, error: MESSAGES.userNotFound }, 404);
            }
        }

        console.log('ban user error:', error);
        return c.json(
            {
                success: false,
                error: MESSAGES.internalServerError
            },
            500
        );
    }
});

app.patch('/:username/verify', zValidator('param', usernameParamSchema), zValidator('json', verifyUserSchema), async (c) => {
    try {
        const { username } = c.req.valid('param');

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            return c.json({ success: false, error: MESSAGES.userNotFound }, 404);
        }

        const updatedUser = await prisma.user.update({
            where: { username },
            data: { is_verified: true },
            select: {
                username: true,
                email: true,
                is_banned: true,
                is_verified: true,
                created_at: true
            }
        });

        return c.json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return c.json({ success: false, error: MESSAGES.userNotFound }, 404);
            }
        }

        console.log('verify user error:', error);
        return c.json(
            {
                success: false,
                error: MESSAGES.internalServerError
            },
            500
        );
    }
});

export default app;
