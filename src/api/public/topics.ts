import MESSAGES from '@/config/message.js';
import type { TopicSelect } from '@/generated/models.js';
import prisma from '@/utils/prisma.js';
import { Hono } from 'hono';

const topicListSelect: TopicSelect = {
    id: true,
    name: true,
    created_at: true,
    _count: {
        select: {
            roadmap_topics: true
        }
    }
};

const app = new Hono();

app.get('/', async (c) => {
    try {
        const topics = await prisma.topic.findMany({
            orderBy: {
                created_at: 'desc'
            },
            select: topicListSelect
        });

        return c.json(
            {
                success: true,
                data: topics
            },
            200
        );
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
