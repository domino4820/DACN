import MESSAGES from '@/config/message.js';
import type { Prisma } from '@/generated/client.js';
import type { RoadmapSelect } from '@/generated/models.js';
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
        .transform((val) => (val ? Number.parseInt(val) : 10)),
    topic: z.string().optional()
});

const roadmapListSelect: RoadmapSelect = {
    id: true,
    name: true,
    description: true,
    roadmap_topics: {
        select: {
            topic: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    },
    _count: {
        select: {
            nodes: true,
            user_paths: true
        }
    }
};

const roadmapDetailInclude: NonNullable<Prisma.RoadmapFindUniqueArgs['include']> = {
    roadmap_topics: {
        include: {
            topic: true
        }
    },
    nodes: {
        orderBy: {
            label: 'asc'
        }
    },
    edges: true
};

const app = new Hono<{ Variables: { username: string } }>();

app.get('/', zValidator('query', querySchema), async (c) => {
    try {
        const { page, limit, topic } = c.req.valid('query');
        const skip = (page - 1) * limit;

        const where: {
            roadmap_topics?: {
                some: {
                    topic: {
                        name: {
                            contains: string;
                            mode: 'insensitive';
                        };
                    };
                };
            };
        } = {};

        if (topic) {
            where.roadmap_topics = {
                some: {
                    topic: {
                        name: {
                            contains: topic,
                            mode: 'insensitive'
                        }
                    }
                }
            };
        }

        const totalCount = await prisma.roadmap.count({ where });

        const roadmaps = await prisma.roadmap.findMany({
            where,
            select: roadmapListSelect,
            orderBy: {
                name: 'asc'
            },
            skip,
            take: limit
        });

        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return c.json(
            {
                success: true,
                data: roadmaps,
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
        console.log('roadmaps list error:', error);
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.get('/:id', async (c) => {
    try {
        const { id } = c.req.param();

        const roadmap = await prisma.roadmap.findUnique({
            where: { id },
            include: roadmapDetailInclude
        });

        if (!roadmap) {
            return c.json({ success: false }, 404);
        }

        return c.json(
            {
                success: true,
                data: roadmap
            },
            200
        );
    } catch (error) {
        console.log('roadmap detail error:', error);
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
