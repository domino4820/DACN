import MESSAGES from '@/config/message.js';
import { Prisma } from '@/generated/client.js';
import prisma from '@/utils/prisma.js';
import { Hono } from 'hono';
import type { JwtVariables } from 'hono/jwt';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const app = new Hono<{ Variables: JwtVariables & { username: string } }>();

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

app.post('/', async (c) => {
    try {
        const username = c.get('username');

        const body = await c.req.parseBody();
        const file = body['avatar'];

        if (!file || !(file instanceof File)) {
            return c.json({ success: false, error: MESSAGES.avatarInvalid }, 400);
        }

        if (!ALLOWED_TYPES.has(file.type)) {
            return c.json({ success: false, error: MESSAGES.avatarInvalid }, 400);
        }

        if (file.size > MAX_FILE_SIZE) {
            return c.json({ success: false, error: MESSAGES.avatarInvalid }, 400);
        }

        await mkdir(UPLOAD_DIR, { recursive: true });

        const extension = file.name.split('.').pop() || 'jpg';
        const filename = `${username}.${extension}`;
        const filepath = join(UPLOAD_DIR, filename);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await writeFile(filepath, buffer);

        const avatarUrl = `/uploads/avatars/${filename}`;

        const updatedProfile = await prisma.userProfile.update({
            where: { username },
            data: { avatar_url: avatarUrl }
        });

        return c.json(
            {
                success: true,
                data: { avatar_url: updatedProfile.avatar_url }
            },
            200
        );
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return c.json({ success: false, error: MESSAGES.avatarInvalid }, 400);
            }
        }

        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

export default app;
