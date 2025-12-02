import MESSAGES from '@/config/message.js';
import { Prisma } from '@/generated/client.js';
import { optionalAuthMiddleware } from '@/middleware/optional-auth.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const usernameParamSchema = z.object({
    username: z.string().min(1).max(50)
});

const app = new Hono<{ Variables: { username?: string } }>();

app.get('/:username', optionalAuthMiddleware, zValidator('param', usernameParamSchema), async (c) => {
    try {
        const currentUsername = c.get('username');
        const { username: targetUsername } = c.req.valid('param');

        const targetUser = await prisma.user.findUnique({
            where: { username: targetUsername },
            select: {
                username: true,
                email: true,
                is_banned: true,
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

        if (!targetUser) {
            return c.json({ success: false, error: MESSAGES.userNotFound }, 404);
        }

        if (targetUser.is_banned) {
            return c.json({ success: false, error: MESSAGES.userBanned }, 403);
        }

        if (currentUsername === targetUsername) {
            return c.json(
                {
                    success: true,
                    data: targetUser
                },
                200
            );
        }

        if (!targetUser.profile) {
            const defaultProfile = await prisma.userProfile.create({
                data: {
                    username: targetUsername,
                    visibility: 'PUBLIC'
                }
            });
            targetUser.profile = defaultProfile;
        }

        const visibility = targetUser.profile.visibility;

        if (visibility === 'PUBLIC') {
            return c.json(
                {
                    success: true,
                    data: targetUser
                },
                200
            );
        }

        if (visibility === 'GROUP_ONLY') {
            if (!currentUsername) {
                return c.json({ success: false, error: MESSAGES.profileGroupOnly }, 403);
            }

            const targetGroups = await prisma.groupMember.findMany({
                where: { user_id: targetUsername },
                select: { group_id: true }
            });

            if (targetGroups.length === 0) {
                return c.json({ success: false, error: MESSAGES.profileGroupOnly }, 403);
            }

            const targetGroupIds = targetGroups.map((g) => g.group_id);

            const commonGroup = await prisma.groupMember.findFirst({
                where: {
                    user_id: currentUsername,
                    group_id: { in: targetGroupIds }
                }
            });

            if (!commonGroup) {
                return c.json({ success: false, error: MESSAGES.profileGroupOnly }, 403);
            }

            return c.json(
                {
                    success: true,
                    data: targetUser
                },
                200
            );
        }

        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return c.json({ success: false, error: MESSAGES.userNotFound }, 404);
            }
        }

        console.log('get user profile error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

export default app;
