import CONST from '@/config/const.js';
import MESSAGES from '@/config/message.js';
import { Prisma } from '@/generated/client.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { compare, hash } from 'bcrypt';
import { Hono } from 'hono';
import { z } from 'zod';

const changePasswordSchema = z.object({
    old_password: z.string().min(CONST.PASSWORD_MIN_LENGTH, MESSAGES.invalidCredentials).max(CONST.PASSWORD_MAX_LENGTH, MESSAGES.invalidCredentials),
    new_password: z.string().min(CONST.PASSWORD_MIN_LENGTH, MESSAGES.invalidCredentials).max(CONST.PASSWORD_MAX_LENGTH, MESSAGES.invalidCredentials)
});

const app = new Hono();

app.patch('/', zValidator('json', changePasswordSchema), async (c) => {
    try {
        const { old_password, new_password } = c.req.valid('json');

        const admin = await prisma.admin.findUnique({
            where: { username: 'admin' }
        });

        if (!admin) {
            return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
        }

        const isOldPasswordValid = await compare(old_password, admin.password);

        if (!isOldPasswordValid) {
            return c.json({ success: false, error: MESSAGES.invalidCredentials }, 401);
        }

        const hashedNewPassword = await hash(new_password, 10);

        await prisma.admin.update({
            where: { username: 'admin' },
            data: { password: hashedNewPassword }
        });

        return c.json({
            success: true,
            data: { message: 'Đổi mật khẩu thành công' }
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
            }
        }

        console.log('change password error:', error);
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
