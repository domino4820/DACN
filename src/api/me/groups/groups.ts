import MESSAGES from '@/config/message.js';
import { Prisma } from '@/generated/client.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import type { JwtVariables } from 'hono/jwt';
import { z } from 'zod';

const createGroupSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional()
});

const groupIdParamSchema = z.object({
    id: z.uuid()
});

const groupWithMembersInclude: NonNullable<Prisma.GroupCreateArgs['include']> = {
    members: {
        include: {
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
        },
        orderBy: {
            joined_at: 'asc'
        }
    }
};

const app = new Hono<{ Variables: JwtVariables & { username: string } }>();

app.post('/', zValidator('json', createGroupSchema), async (c) => {
    try {
        const username = c.get('username');
        const { name, description } = c.req.valid('json');

        const group = await prisma.group.create({
            data: {
                name,
                description: description || null,
                members: {
                    create: {
                        user_id: username,
                        role: 'OWNER'
                    }
                }
            },
            include: groupWithMembersInclude
        });

        return c.json(
            {
                success: true,
                data: group
            },
            201
        );
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return c.json(
                    {
                        success: false,
                        error: MESSAGES.nameExists
                    },
                    409
                );
            }
        }
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.get('/:id', zValidator('param', groupIdParamSchema), async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.valid('param');

        const group = await prisma.group.findUnique({
            where: { id },
            include: groupWithMembersInclude
        });

        if (!group) {
            return c.json({ success: false, error: MESSAGES.groupNotFound }, 404);
        }

        const membership = await prisma.groupMember.findUnique({
            where: {
                group_id_user_id: {
                    group_id: id,
                    user_id: username
                }
            },
            select: {
                role: true,
                joined_at: true
            }
        });

        const groupWithMembership = membership
            ? {
                  ...group,
                  isMember: true,
                  myRole: membership.role,
                  joinedAt: membership.joined_at
              }
            : group;

        return c.json(
            {
                success: true,
                data: groupWithMembership
            },
            200
        );
    } catch {
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.post('/:id/join', zValidator('param', groupIdParamSchema), async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.valid('param');

        const group = await prisma.group.findUnique({
            where: { id }
        });

        if (!group) {
            return c.json({ success: false, error: MESSAGES.groupNotFound }, 404);
        }

        const existingMembership = await prisma.groupMember.findUnique({
            where: {
                group_id_user_id: {
                    group_id: id,
                    user_id: username
                }
            }
        });

        if (existingMembership) {
            return c.json({ success: false, error: MESSAGES.groupAlreadyJoined }, 409);
        }

        await prisma.groupMember.create({
            data: {
                group_id: id,
                user_id: username
            }
        });

        const groupWithMembers = await prisma.group.findUnique({
            where: { id },
            include: groupWithMembersInclude
        });

        return c.json(
            {
                success: true,
                data: groupWithMembers
            },
            200
        );
    } catch {
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.post('/:id/leave', zValidator('param', groupIdParamSchema), async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.valid('param');

        const membership = await prisma.groupMember.findUnique({
            where: {
                group_id_user_id: {
                    group_id: id,
                    user_id: username
                }
            },
            select: {
                role: true
            }
        });

        if (!membership) {
            return c.json({ success: false, error: MESSAGES.groupNotMember }, 404);
        }

        if (membership.role === 'OWNER') {
            const totalMembers = await prisma.groupMember.count({
                where: { group_id: id }
            });

            if (totalMembers > 1) {
                return c.json({ success: false, error: MESSAGES.groupOwnerMustTransfer }, 400);
            }

            await prisma.group.delete({
                where: { id }
            });

            return c.json({ success: true }, 200);
        }

        await prisma.groupMember.delete({
            where: {
                group_id_user_id: {
                    group_id: id,
                    user_id: username
                }
            }
        });

        return c.json({ success: true }, 200);
    } catch {
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

export default app;
