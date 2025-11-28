import CONST from '@/config/const.js';
import MESSAGES from '@/config/message.js';
import { Prisma } from '@/generated/client.js';
import type { AdminSelect } from '@/generated/models.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { compare } from 'bcrypt';
import { Hono } from 'hono';
import { sign, type JwtVariables } from 'hono/jwt';
import { z } from 'zod';

const loginSchema = z.object({
    username: z.string().min(CONST.USERNAME_MIN_LENGTH, MESSAGES.invalidCredentials).max(CONST.USERNAME_MAX_LENGTH, MESSAGES.invalidCredentials),
    password: z.string().min(CONST.PASSWORD_MIN_LENGTH, MESSAGES.invalidCredentials).max(CONST.PASSWORD_MAX_LENGTH, MESSAGES.invalidCredentials)
});

const authAdminSelect: AdminSelect = {
    password: true
};

const app = new Hono<{ Variables: JwtVariables }>();

app.post('/', zValidator('json', loginSchema), async (c) => {
    try {
        const { username, password } = c.req.valid('json');

        const admin = await prisma.admin.findUnique({
            where: { username },
            select: authAdminSelect
        });

        if (!admin) {
            return c.json({ success: false, error: MESSAGES.invalidCredentials }, 401);
        }

        const isPasswordValid = await compare(password, admin.password);

        if (!isPasswordValid) {
            return c.json({ success: false, error: MESSAGES.invalidCredentials }, 401);
        }

        const now = Math.floor(Date.now() / 1000);
        const exp = now + Number(process.env.JWT_EXPIRES_IN || 86400000);

        const token = await sign({ sub: 'CON-CA-SAU', exp, iat: now }, process.env.JWT_SECRET, 'HS256');

        return c.json(
            {
                success: true,
                data: { token }
            },
            200
        );
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return c.json({ success: false, error: MESSAGES.invalidCredentials }, 401);
            }
        }

        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

export default app;
