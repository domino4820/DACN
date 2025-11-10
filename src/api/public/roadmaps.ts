import MESSAGES from '@/config/message.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono<{ Variables: { username: string } }>();

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
            select: {
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
            },
            orderBy: {
                name: 'asc'
            },
            skip,
            take: limit
        });

        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return c.json({
            data: roadmaps,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit,
                hasNextPage,
                hasPrevPage
            }
        });
    } catch {
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

export default app;
