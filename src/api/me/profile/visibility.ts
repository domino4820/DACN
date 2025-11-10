import MESSAGES from '@/config/message.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import type { JwtVariables } from 'hono/jwt';
import { z } from 'zod';

const updateVisibilitySchema = z.object({
    visibility: z.enum(['PUBLIC', 'GROUP_ONLY'])
});

const app = new Hono<{ Variables: JwtVariables & { username: string } }>();

app.patch('/', zValidator('json', updateVisibilitySchema), async (c) => {
    try {
        const username = c.get('username');
        const { visibility } = c.req.valid('json');

        const existingProfile = await prisma.userProfile.findUnique({
            where: { username }
        });

        if (existingProfile) {
            await prisma.userProfile.update({
                where: { username },
                data: { visibility }
            });
        } else {
            await prisma.userProfile.create({
                data: {
                    username,
                    visibility
                }
            });
        }

        return c.json(
            {
                success: true
            },
            200
        );
    } catch {
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

export default app;
