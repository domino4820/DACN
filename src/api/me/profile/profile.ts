import MESSAGES from '@/config/message.js';
import { Prisma } from '@/generated/client.js';
import prisma from '@/utils/prisma.js';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import type { JwtVariables } from 'hono/jwt';
import { z } from 'zod';

const updateProfileSchema = z.object({
    name: z.string().max(100).optional(),
    bio: z.string().max(500).optional(),
    facebook: z.string().max(50).optional(),
    github: z.string().max(50).optional()
});

const app = new Hono<{ Variables: JwtVariables & { username: string } }>();

app.get('/', async (c) => {
    try {
        const username = c.get('username');

        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                username: true,
                email: true,
                is_banned: true,
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
                }
            }
        });

        if (!user) {
            return c.json(null, 401);
        }

        if (!user.profile) {
            const newProfile = await prisma.userProfile.create({
                data: {
                    username,
                    visibility: 'PUBLIC'
                }
            });

            user.profile = newProfile;
        }

        return c.json({ success: true, data: user }, 200);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return c.json(null, 401);
            }
        }

        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

app.patch('/', zValidator('json', updateProfileSchema), async (c) => {
    try {
        const username = c.get('username');
        const { name, bio, facebook, github } = c.req.valid('json');

        const existingProfile = await prisma.userProfile.findUnique({
            where: { username }
        });

        const profileData = {
            name: name === undefined ? undefined : name || null,
            bio: bio === undefined ? undefined : bio || null,
            facebook: facebook === undefined ? undefined : facebook === '' ? null : facebook,
            github: github === undefined ? undefined : github === '' ? null : github
        };

        let updatedProfile;
        if (existingProfile) {
            updatedProfile = await prisma.userProfile.update({
                where: { username },
                data: profileData
            });
        } else {
            updatedProfile = await prisma.userProfile.create({
                data: {
                    username,
                    ...profileData
                }
            });
        }

        return c.json(
            {
                success: true,
                data: updatedProfile
            },
            200
        );
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return c.json(null, 401);
            }
        }

        return c.json({ success: false, error: MESSAGES.internalServerError }, 500);
    }
});

export default app;
