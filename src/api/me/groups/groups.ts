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

const messageQuerySchema = z.object({
    cursor: z.uuid().optional(),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? Number.parseInt(val, 10) : 20))
        .refine((val) => Number.isFinite(val) && val > 0 && val <= 50, {
            message: 'limit invalid'
        })
});

const kickMemberSchema = z.object({
    username: z.string().min(1)
});

const transferOwnershipSchema = z.object({
    username: z.string().min(1)
});

const messageUserSelect = {
    username: true,
    profile: {
        select: {
            name: true,
            avatar_url: true
        }
    }
} satisfies Prisma.UserSelect;

const groupWithMembersInclude: NonNullable<Prisma.GroupCreateArgs['include']> = {
    members: {
        include: {
            user: {
                select: messageUserSelect
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

app.get('/:id/messages', zValidator('param', groupIdParamSchema), zValidator('query', messageQuerySchema), async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.valid('param');
        const { cursor, limit } = c.req.valid('query');

        const membership = await prisma.groupMember.findUnique({
            where: {
                group_id_user_id: {
                    group_id: id,
                    user_id: username
                }
            },
            select: { user_id: true }
        });

        if (!membership) {
            return c.json({ success: false, error: MESSAGES.groupNotMember }, 403);
        }

        const messages = await prisma.groupMessage.findMany({
            where: { group_id: id },
            orderBy: { created_at: 'desc' },
            take: limit,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1
            }),
            include: {
                user: {
                    select: messageUserSelect
                },
                reply_to: {
                    select: {
                        id: true,
                        content: true,
                        user: {
                            select: messageUserSelect
                        }
                    }
                },
                _count: {
                    select: {
                        replies: true
                    }
                }
            }
        });

        const items = messages.map((message) => ({
            id: message.id,
            groupId: message.group_id,
            replyToMessageId: message.reply_to_message_id,
            content: message.content,
            createdAt: message.created_at,
            replyCount: message._count.replies,
            replyTo: message.reply_to
                ? {
                      id: message.reply_to.id,
                      content: message.reply_to.content,
                      user: {
                          username: message.reply_to.user.username,
                          name: message.reply_to.user.profile?.name ?? null,
                          avatarUrl: message.reply_to.user.profile?.avatar_url ?? null
                      }
                  }
                : null,
            user: {
                username: message.user.username,
                name: message.user.profile?.name ?? null,
                avatarUrl: message.user.profile?.avatar_url ?? null
            }
        }));

        const nextCursor = messages.length === limit ? (messages.at(-1)?.id ?? null) : null;

        return c.json(
            {
                success: true,
                data: {
                    items,
                    nextCursor
                }
            },
            200
        );
    } catch (error) {
        console.log('get group messages fail', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.post('/:id/kick', zValidator('param', groupIdParamSchema), zValidator('json', kickMemberSchema), async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.valid('param');
        const { username: targetUsername } = c.req.valid('json');

        if (username === targetUsername) {
            return c.json({ success: false, error: MESSAGES.groupCannotKickSelf }, 400);
        }

        const ownerMembership = await prisma.groupMember.findUnique({
            where: {
                group_id_user_id: {
                    group_id: id,
                    user_id: username
                }
            },
            select: { role: true }
        });

        if (!ownerMembership) {
            return c.json({ success: false, error: MESSAGES.groupNotMember }, 403);
        }

        if (ownerMembership.role !== 'OWNER') {
            return c.json({ success: false, error: MESSAGES.groupNotOwner }, 403);
        }

        const targetMembership = await prisma.groupMember.findUnique({
            where: {
                group_id_user_id: {
                    group_id: id,
                    user_id: targetUsername
                }
            }
        });

        if (!targetMembership) {
            return c.json({ success: false, error: MESSAGES.groupMemberNotFound }, 404);
        }

        await prisma.groupMember.delete({
            where: {
                group_id_user_id: {
                    group_id: id,
                    user_id: targetUsername
                }
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

app.post('/:id/transfer', zValidator('param', groupIdParamSchema), zValidator('json', transferOwnershipSchema), async (c) => {
    try {
        const username = c.get('username');
        const { id } = c.req.valid('param');
        const { username: targetUsername } = c.req.valid('json');

        if (username === targetUsername) {
            return c.json({ success: false, error: MESSAGES.groupCannotTransferSelf }, 400);
        }

        const ownerMembership = await prisma.groupMember.findUnique({
            where: {
                group_id_user_id: {
                    group_id: id,
                    user_id: username
                }
            },
            select: { role: true }
        });

        if (!ownerMembership) {
            return c.json({ success: false, error: MESSAGES.groupNotMember }, 403);
        }

        if (ownerMembership.role !== 'OWNER') {
            return c.json({ success: false, error: MESSAGES.groupNotOwner }, 403);
        }

        const targetMembership = await prisma.groupMember.findUnique({
            where: {
                group_id_user_id: {
                    group_id: id,
                    user_id: targetUsername
                }
            }
        });

        if (!targetMembership) {
            return c.json({ success: false, error: MESSAGES.groupMemberNotFound }, 404);
        }

        await prisma.$transaction([
            prisma.groupMember.update({
                where: {
                    group_id_user_id: {
                        group_id: id,
                        user_id: username
                    }
                },
                data: { role: 'MEMBER' }
            }),
            prisma.groupMember.update({
                where: {
                    group_id_user_id: {
                        group_id: id,
                        user_id: targetUsername
                    }
                },
                data: { role: 'OWNER' }
            })
        ]);

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

export default app;
