import MESSAGES from '@/config/message.js';
import type { GroupSelect } from '@/generated/models.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
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

const groupListSelect: GroupSelect = {
    id: true,
    name: true,
    description: true,
    _count: {
        select: {
            members: true
        }
    }
};

const app = new Hono();

app.get('/', zValidator('query', querySchema), async (c) => {
    try {
        let username: string | undefined;

        try {
            const jwtMiddleware = jwt({
                secret: process.env.JWT_SECRET || ''
            });
            await jwtMiddleware(c, async () => {});
            const payload = c.get('jwtPayload');
            if (payload?.sub) {
                username = payload.sub as string;
            }
        } catch {
            //
        }
        const { page, limit } = c.req.valid('query');
        const skip = (page - 1) * limit;

        const totalCount = await prisma.group.count();

        const groups = await prisma.group.findMany({
            select: groupListSelect,
            orderBy: {
                name: 'asc'
            },
            skip,
            take: limit
        });

        let groupsWithMembership = groups;

        if (username && groups.length > 0) {
            const groupIdList = groups.map((g) => g.id);
            const memberships = await prisma.groupMember.findMany({
                where: {
                    group_id: { in: groupIdList },
                    user_id: username
                },
                select: {
                    group_id: true,
                    role: true,
                    joined_at: true
                }
            });

            const membershipMap = new Map(memberships.map((m) => [m.group_id, { role: m.role, joinedAt: m.joined_at }]));

            groupsWithMembership = groups.map((group) => {
                const membership = membershipMap.get(group.id);
                return {
                    ...group,
                    ...(membership && {
                        isMember: true,
                        myRole: membership.role,
                        joinedAt: membership.joinedAt
                    })
                };
            });
        }

        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return c.json(
            {
                success: true,
                data: groupsWithMembership,
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
    } catch {
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

export default app;
