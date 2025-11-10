import MESSAGES from '@/config/message.js';
import prisma from '@/utils/prisma.js';
import { Hono } from 'hono';

const app = new Hono();

app.get('/', async (c) => {
    try {
        const topics = await prisma.topic.findMany({
            orderBy: {
                created_at: 'desc'
            },
            select: {
                id: true,
                name: true,
                created_at: true,
                _count: {
                    select: {
                        roadmap_topics: true
                    }
                }
            }
        });

        return c.json({
            success: true,
            data: topics
        });
    } catch {
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
