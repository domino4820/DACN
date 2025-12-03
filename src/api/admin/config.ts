import MESSAGES from '@/config/message.js';
import { Prisma } from '@/generated/client.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

const updateConfigSchema = z.object({
    zai_api: z.string().optional(),
    resend_api: z.string().optional()
});

const app = new Hono();

app.get('/', async (c) => {
    try {
        const config = await prisma.config.findUnique({
            where: { id: 'singleton' }
        });

        if (!config) {
            const newConfig = await prisma.config.create({
                data: {
                    id: 'singleton'
                }
            });
            return c.json({
                success: true,
                data: newConfig
            });
        }

        return c.json({
            success: true,
            data: config
        });
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

        return c.json(
            {
                success: false,
                error: MESSAGES.internalServerError
            },
            500
        );
    }
});

app.put('/', zValidator('json', updateConfigSchema), async (c) => {
    try {
        const { zai_api, resend_api } = c.req.valid('json');

        const config = await prisma.config.upsert({
            where: { id: 'singleton' },
            update: {
                zai_api,
                resend_api
            },
            create: {
                id: 'singleton',
                zai_api,
                resend_api
            }
        });

        return c.json({
            success: true,
            data: config
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
