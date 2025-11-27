import MESSAGES from '@/config/message.js';
import { Prisma } from '@/generated/client.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { compare, hash } from 'bcrypt';
import { Hono } from 'hono';
import type { JwtVariables } from 'hono/jwt';
import { z } from 'zod';

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(6),
        confirmPassword: z.string().min(1)
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: MESSAGES.passwordMismatch,
        path: ['confirmPassword']
    });

const app = new Hono<{ Variables: JwtVariables & { username: string } }>();

app.patch('/', zValidator('json', changePasswordSchema), async (c) => {
    try {
        const username = c.get('username');
        const { currentPassword, newPassword } = c.req.valid('json');

        const user = await prisma.user.findUnique({
            where: { username },
            select: { password: true }
        });

        if (!user) {
            return c.json({ success: false, error: MESSAGES.passwordMismatch }, 400);
        }

        const isCurrentPasswordValid = await compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            return c.json({ success: false, error: MESSAGES.passwordMismatch }, 400);
        }

        const saltRounds = Number.parseInt(process.env.SALT_ROUNDS || '10');
        const hashedNewPassword = await hash(newPassword, saltRounds);

        await prisma.user.update({
            where: { username },
            data: { password: hashedNewPassword }
        });

        return c.json(
            {
                success: true
            },
            200
        );
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return c.json({ success: false, error: MESSAGES.passwordMismatch }, 400);
            }
        }

        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

export default app;
