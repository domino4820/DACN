import CONST from '@/config/const.js';
import MESSAGES from '@/config/message.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Prisma } from '@prisma/client';
import { compare } from 'bcrypt';
import { Hono } from 'hono';
import { sign, type JwtVariables } from 'hono/jwt';
import { z } from 'zod';

const loginSchema = z.object({
    username: z.string().min(CONST.USERNAME_MIN_LENGTH, MESSAGES.invalidCredentials).max(CONST.USERNAME_MAX_LENGTH, MESSAGES.invalidCredentials),
    password: z.string().min(CONST.PASSWORD_MIN_LENGTH, MESSAGES.invalidCredentials).max(CONST.PASSWORD_MAX_LENGTH, MESSAGES.invalidCredentials)
});

const authUserSelect: Prisma.UserSelect = {
    password: true,
    is_banned: true,
    is_verified: true
};

const userInfoSelect: Prisma.UserSelect = {
    username: true,
    email: true,
    created_at: true,
    profile: {
        select: {
            name: true,
            avatar_url: true,
            bio: true,
            visibility: true,
            facebook: true,
            github: true
        }
    },
    stats: {
        select: {
            level: true,
            xp: true
        }
    }
};

const app = new Hono<{ Variables: JwtVariables }>();

app.post('/', zValidator('json', loginSchema), async (c) => {
    try {
        const { username, password } = c.req.valid('json');

        const authUser = await prisma.user.findUnique({
            where: { username },
            select: authUserSelect
        });

        if (!authUser) {
            return c.json({ success: false, error: MESSAGES.invalidCredentials }, 401);
        }

        const isPasswordValid = await compare(password, authUser.password);

        if (!isPasswordValid) {
            return c.json({ success: false, error: MESSAGES.invalidCredentials }, 401);
        }

        if (authUser.is_banned) {
            return c.json({ success: false, error: MESSAGES.accountBanned }, 401);
        }

        if (!authUser.is_verified) {
            return c.json(
                {
                    success: false,
                    requiresVerification: true,
                    username: username
                },
                201
            );
        }

        const user = await prisma.user.findUnique({
            where: { username },
            select: userInfoSelect
        });

        const now = Math.floor(Date.now() / 1000);
        const exp = now + Number(process.env.JWT_EXPIRES_IN || 86400000);

        const token = await sign({ sub: username, exp, iat: now }, process.env.JWT_SECRET, 'HS256');

        return c.json(
            {
                success: true,
                data: { token, user }
            },
            200
        );
    } catch {
        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

export default app;
