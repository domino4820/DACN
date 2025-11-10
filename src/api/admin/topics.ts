import MESSAGES from '@/config/message.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const createTopicSchema = z.object({
    name: z.string().min(1).max(100)
});

const app = new Hono();

app.post('/', zValidator('json', createTopicSchema), async (c) => {
    try {
        const { name } = c.req.valid('json');

        const existingTopic = await prisma.topic.findUnique({
            where: { name }
        });

        if (existingTopic) {
            return c.json(
                {
                    success: false,
                    error: MESSAGES.nameExists
                },
                400
            );
        }

        const topic = await prisma.topic.create({
            data: {
                name
            }
        });

        return c.json(
            {
                success: true,
                data: topic
            },
            201
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

app.delete('/:id', async (c) => {
    try {
        const { id } = c.req.param();

        const topic = await prisma.topic.findUnique({
            where: { id },
            include: {
                roadmap_topics: {
                    include: {
                        roadmap: true
                    }
                }
            }
        });

        if (!topic) {
            return c.json({
                success: true
            });
        }

        await prisma.topic.delete({
            where: { id }
        });

        return c.json({
            success: true
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
